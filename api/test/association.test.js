import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["assoc-admin@example.com", "assoc-vendor@example.com", "assoc-rep@example.com"];
const password = "password123";
let adminToken, repToken, allocationId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;
const register = (body) => request(app).post("/api/v1/auth/register").send({ fullName: "Rep Person", email: emails[2], password, ...body });

const cleanup = async () => {
  await prisma.flag.deleteMany({ where: { vendor: { email: { in: emails } } } });
  await prisma.$executeRaw`ALTER TABLE allocations DISABLE TRIGGER allocations_no_update_delete`;
  await prisma.allocation.deleteMany({ where: { site: { reference: "ASSOC-TEST" } } });
  await prisma.$executeRaw`ALTER TABLE allocations ENABLE TRIGGER allocations_no_update_delete`;
  await prisma.application.deleteMany({ where: { site: { reference: "ASSOC-TEST" } } });
  await prisma.site.deleteMany({ where: { reference: "ASSOC-TEST" } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  const admin = await prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash, role: "admin" } });
  const vendor = await prisma.user.create({ data: { fullName: "Vendor", email: emails[1], passwordHash } });
  const site = await prisma.site.create({
    data: { reference: "ASSOC-TEST", name: "Assoc Test", district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none", status: "allocated" }
  });
  const application = await prisma.application.create({ data: { siteId: site.id, vendorId: vendor.id, status: "approved" } });
  allocationId = (await prisma.allocation.create({ data: { siteId: site.id, applicationId: application.id, outcome: "approved", reason: "First in queue", decidedById: admin.id } })).id;
  adminToken = await login(emails[0]);
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("an association account needs an organisation", async () => {
  const res = await register({ accountType: "association" });
  assert.equal(res.status, 400);
});

test("nobody can register as an admin", async () => {
  const res = await register({ accountType: "admin" });
  assert.equal(res.status, 400);
});

test("registers an association representative", async () => {
  const res = await register({ accountType: "association", organisation: "Kigali Vendors Association" });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, "association");
  assert.equal(res.body.user.organisation, "Kigali Vendors Association");
  repToken = res.body.token;
});

test("a plain registration is still a vendor", async () => {
  await prisma.user.deleteMany({ where: { email: emails[2] } });
  const res = await register({});
  assert.equal(res.body.user.role, "vendor");
  await prisma.user.deleteMany({ where: { email: emails[2] } });
  repToken = (await register({ accountType: "association", organisation: "Kigali Vendors Association" })).body.token;
});

test("the representative reads the allocation record", async () => {
  const res = await request(app).get("/api/v1/public/activity").set("Authorization", `Bearer ${repToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((e) => e.id === allocationId));
});

test("the representative flags an allocation", async () => {
  const res = await request(app).post(`/api/v1/allocations/${allocationId}/flags`).set("Authorization", `Bearer ${repToken}`).send({ category: "Queue order", note: "Members say the queue was skipped" });
  assert.equal(res.status, 201);
});

test("the representative lists their own flags", async () => {
  const res = await request(app).get("/api/v1/flags/me").set("Authorization", `Bearer ${repToken}`);
  assert.equal(res.body.data.length, 1);
});

test("the administrator sees the organisation on the flag", async () => {
  const res = await request(app).get("/api/v1/flags").set("Authorization", `Bearer ${adminToken}`);
  const flag = res.body.data.find((f) => f.vendor.organisation === "Kigali Vendors Association");
  assert.ok(flag);
});

test("the representative cannot apply for a site", async () => {
  const site = await prisma.site.findFirst({ where: { reference: "ASSOC-TEST" } });
  const res = await request(app).post(`/api/v1/sites/${site.id}/applications`).set("Authorization", `Bearer ${repToken}`).send({});
  assert.equal(res.status, 403);
});

test("the representative cannot see applications, profile or the admin queue", async () => {
  for (const path of ["/applications/me", "/applications", "/profile", "/documents"]) {
    const res = await request(app).get(`/api/v1${path}`).set("Authorization", `Bearer ${repToken}`);
    assert.equal(res.status, 403, path);
  }
});
