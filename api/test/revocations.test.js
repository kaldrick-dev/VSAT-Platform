import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["rev-admin@example.com", "rev-vendor@example.com"];
const password = "password123";
const reason = "The stall has been empty for three months";
let adminToken, vendorToken, vendorId, siteId, applicationId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;
const revoke = (id, body, token = adminToken) => request(app).post(`/api/v1/sites/${id}/revoke`).set("Authorization", `Bearer ${token}`).send(body);

const cleanup = async () => {
  await prisma.notification.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.$executeRaw`ALTER TABLE allocations DISABLE TRIGGER allocations_no_update_delete`;
  await prisma.allocation.deleteMany({ where: { site: { reference: "REV-TEST" } } });
  await prisma.$executeRaw`ALTER TABLE allocations ENABLE TRIGGER allocations_no_update_delete`;
  await prisma.application.deleteMany({ where: { site: { reference: "REV-TEST" } } });
  await prisma.site.deleteMany({ where: { reference: "REV-TEST" } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  const admin = await prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash, role: "admin" } });
  const vendor = await prisma.user.create({ data: { fullName: "Vendor", email: emails[1], passwordHash } });
  vendorId = vendor.id;
  const site = await prisma.site.create({
    data: { reference: "REV-TEST", name: "Rev Test", district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none", status: "allocated" }
  });
  siteId = site.id;
  const application = await prisma.application.create({ data: { siteId, vendorId, status: "approved" } });
  applicationId = application.id;
  await prisma.allocation.create({ data: { siteId, applicationId, outcome: "approved", reason: "First in queue", decidedById: admin.id } });
  adminToken = await login(emails[0]);
  vendorToken = await login(emails[1]);
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("vendor cannot revoke an allocation", async () => {
  const res = await revoke(siteId, { reason }, vendorToken);
  assert.equal(res.status, 403);
});

test("rejects a revocation without a long enough reason", async () => {
  const res = await revoke(siteId, { reason: "too short" });
  assert.equal(res.status, 400);
});

test("returns 404 revoking a missing site", async () => {
  const res = await revoke("missing-site", { reason });
  assert.equal(res.status, 404);
});

test("admin revokes an allocation", async () => {
  const res = await revoke(siteId, { reason, reasonCategory: "not_used" });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.outcome, "revoked");

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  const entries = await prisma.allocation.findMany({ where: { siteId }, orderBy: { decidedAt: "asc" } });
  const notifications = await prisma.notification.count({ where: { userId: vendorId, title: "Allocation revoked" } });
  assert.equal(site.status, "available");
  assert.equal(application.status, "revoked");
  assert.deepEqual(entries.map((e) => e.outcome), ["approved", "revoked"]);
  assert.equal(notifications, 1);
});

test("the public activity log shows the revocation without the reason", async () => {
  const res = await request(app).get("/api/v1/public/activity").set("Authorization", `Bearer ${vendorToken}`);
  const entry = res.body.data.find((e) => e.reference === "REV-TEST" && e.event === "Revoked");
  assert.equal(entry.reasonCategory, "Space not used");
  assert.ok(!JSON.stringify(res.body).includes("three months"));
});

test("refuses to revoke a site that is no longer allocated", async () => {
  const res = await revoke(siteId, { reason });
  assert.equal(res.status, 409);
  assert.equal(res.body.code, "no_active_allocation");
});
