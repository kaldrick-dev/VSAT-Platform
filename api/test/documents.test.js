import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["doc-admin@example.com", "doc-vendor1@example.com", "doc-vendor2@example.com"];
const password = "password123";
const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
let adminToken, vendor1Token, vendor2Token, vendor1Id, documentId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;
const upload = (token, body, type = "application/pdf", query = "kind=National%20ID&fileName=id.pdf") =>
  request(app).post(`/api/v1/documents?${query}`).set("Authorization", `Bearer ${token}`).set("Content-Type", type).send(body);

const cleanup = async () => {
  await prisma.document.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  await prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash, role: "admin" } });
  vendor1Id = (await prisma.user.create({ data: { fullName: "Vendor One", email: emails[1], passwordHash } })).id;
  await prisma.user.create({ data: { fullName: "Vendor Two", email: emails[2], passwordHash } });
  [adminToken, vendor1Token, vendor2Token] = await Promise.all(emails.map(login));
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("vendor uploads a PDF", async () => {
  const res = await upload(vendor1Token, pdf);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.fileName, "id.pdf");
  assert.equal(res.body.data.size, pdf.length);
  assert.equal(res.body.data.data, undefined);
  documentId = res.body.data.id;
});

test("rejects a file that is not really a PDF", async () => {
  const res = await upload(vendor1Token, Buffer.from("just some text"));
  assert.equal(res.status, 400);
  assert.equal(res.body.code, "invalid_file");
});

test("rejects an upload with no file or an unsupported type", async () => {
  const res = await upload(vendor1Token, "hello", "text/plain");
  assert.equal(res.status, 400);
  assert.equal(res.body.code, "file_required");
});

test("rejects an unknown document type", async () => {
  const res = await upload(vendor1Token, pdf, "application/pdf", "kind=Selfie&fileName=id.pdf");
  assert.equal(res.status, 400);
});

test("rejects a file over 4 MB", async () => {
  const big = Buffer.concat([pdf, Buffer.alloc(4 * 1024 * 1024)]);
  const res = await upload(vendor1Token, big);
  assert.equal(res.status, 413);
  assert.equal(res.body.code, "file_too_large");
});

test("admin cannot upload", async () => {
  const res = await upload(adminToken, pdf);
  assert.equal(res.status, 403);
});

test("vendor lists their documents without the file bytes", async () => {
  const res = await request(app).get("/api/v1/documents").set("Authorization", `Bearer ${vendor1Token}`);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].data, undefined);
});

test("the owner downloads the file", async () => {
  const res = await request(app).get(`/api/v1/documents/${documentId}/file`).set("Authorization", `Bearer ${vendor1Token}`).buffer(true).parse((r, done) => {
    const chunks = [];
    r.on("data", (c) => chunks.push(c));
    r.on("end", () => done(null, Buffer.concat(chunks)));
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers["content-type"], "application/pdf");
  assert.deepEqual(res.body, pdf);
});

test("an administrator downloads a vendor's file", async () => {
  const res = await request(app).get(`/api/v1/documents/${documentId}/file`).set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 200);
});

test("another vendor cannot download it", async () => {
  const res = await request(app).get(`/api/v1/documents/${documentId}/file`).set("Authorization", `Bearer ${vendor2Token}`);
  assert.equal(res.status, 404);
});

test("downloading needs a token", async () => {
  const res = await request(app).get(`/api/v1/documents/${documentId}/file`);
  assert.equal(res.status, 401);
});

test("admin views a vendor's documents", async () => {
  const res = await request(app).get(`/api/v1/vendors/${vendor1Id}/documents`).set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 1);
});

test("vendor deletes a document", async () => {
  const res = await request(app).delete(`/api/v1/documents/${documentId}`).set("Authorization", `Bearer ${vendor1Token}`);
  assert.equal(res.status, 204);
});

test("returns 404 deleting it again", async () => {
  const res = await request(app).delete(`/api/v1/documents/${documentId}`).set("Authorization", `Bearer ${vendor1Token}`);
  assert.equal(res.status, 404);
});
