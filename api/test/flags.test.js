import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["flag-admin@example.com", "flag-vendor@example.com"];
const password = "password123";
let adminToken, vendorToken, allocationId, flagId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;

const cleanup = async () => {
  await prisma.notification.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.flag.deleteMany({ where: { vendor: { email: { in: emails } } } });
  await prisma.$executeRaw`ALTER TABLE allocations DISABLE TRIGGER allocations_no_update_delete`;
  await prisma.allocation.deleteMany({ where: { site: { reference: "FLAG-TEST" } } });
  await prisma.$executeRaw`ALTER TABLE allocations ENABLE TRIGGER allocations_no_update_delete`;
  await prisma.application.deleteMany({ where: { site: { reference: "FLAG-TEST" } } });
  await prisma.site.deleteMany({ where: { reference: "FLAG-TEST" } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  const admin = await prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash, role: "admin" } });
  const vendor = await prisma.user.create({ data: { fullName: "Vendor", email: emails[1], passwordHash } });
  const site = await prisma.site.create({
    data: { reference: "FLAG-TEST", name: "Flag Test", district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none" }
  });
  const application = await prisma.application.create({ data: { siteId: site.id, vendorId: vendor.id, status: "approved" } });
  const allocation = await prisma.allocation.create({
    data: { siteId: site.id, applicationId: application.id, outcome: "approved", reason: "ok", decidedById: admin.id }
  });
  allocationId = allocation.id;
  adminToken = await login(emails[0]);
  vendorToken = await login(emails[1]);
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("vendor creates a flag", async () => {
  const res = await request(app).post(`/api/v1/allocations/${allocationId}/flags`).set("Authorization", `Bearer ${vendorToken}`).send({ category: "Queue order", note: "Skipped the queue" });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.status, "open");
  const days = (new Date(res.body.data.dueAt) - new Date(res.body.data.createdAt)) / 86400000;
  assert.ok(Math.abs(days - 7) < 0.01);
  flagId = res.body.data.id;
});

test("admin cannot create a flag", async () => {
  const res = await request(app).post(`/api/v1/allocations/${allocationId}/flags`).set("Authorization", `Bearer ${adminToken}`).send({ category: "x", note: "not allowed" });
  assert.equal(res.status, 403);
});

test("rejects a flag with bad input", async () => {
  const res = await request(app).post(`/api/v1/allocations/${allocationId}/flags`).set("Authorization", `Bearer ${vendorToken}`).send({});
  assert.equal(res.status, 400);
});

test("returns 404 flagging a missing allocation", async () => {
  const res = await request(app).post("/api/v1/allocations/nope/flags").set("Authorization", `Bearer ${vendorToken}`).send({ category: "x", note: "missing one" });
  assert.equal(res.status, 404);
});

test("vendor lists their flags", async () => {
  const res = await request(app).get("/api/v1/flags/me").set("Authorization", `Bearer ${vendorToken}`);
  assert.equal(res.body.data.length, 1);
});

test("admin lists open flags", async () => {
  const res = await request(app).get("/api/v1/flags?status=open").set("Authorization", `Bearer ${adminToken}`);
  assert.ok(res.body.data.some((f) => f.id === flagId));
});

test("vendor cannot list all flags", async () => {
  const res = await request(app).get("/api/v1/flags").set("Authorization", `Bearer ${vendorToken}`);
  assert.equal(res.status, 403);
});

test("admin upholds a flag and the vendor is notified", async () => {
  const res = await request(app).patch(`/api/v1/flags/${flagId}`).set("Authorization", `Bearer ${adminToken}`).send({ status: "upheld", reviewNote: "Confirmed" });
  assert.equal(res.body.data.status, "upheld");
  const notes = await prisma.notification.count({ where: { user: { email: emails[1] } } });
  assert.equal(notes, 1);
});

test("rejects reviewing a flag twice", async () => {
  const res = await request(app).patch(`/api/v1/flags/${flagId}`).set("Authorization", `Bearer ${adminToken}`).send({ status: "dismissed", reviewNote: "Again" });
  assert.equal(res.status, 409);
});
