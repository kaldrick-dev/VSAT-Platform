import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["dec-admin@example.com", "dec-vendor@example.com"];
const password = "password123";
let adminToken, vendorToken, applicationId, vendorId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;

const cleanup = async () => {
  await prisma.notification.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.$executeRaw`ALTER TABLE allocations DISABLE TRIGGER allocations_no_update_delete`;
  await prisma.allocation.deleteMany({ where: { site: { reference: "DEC-TEST" } } });
  await prisma.$executeRaw`ALTER TABLE allocations ENABLE TRIGGER allocations_no_update_delete`;
  await prisma.application.deleteMany({ where: { site: { reference: "DEC-TEST" } } });
  await prisma.site.deleteMany({ where: { reference: "DEC-TEST" } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  await prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash, role: "admin" } });
  const vendor = await prisma.user.create({ data: { fullName: "Vendor", email: emails[1], passwordHash } });
  vendorId = vendor.id;
  const site = await prisma.site.create({
    data: { reference: "DEC-TEST", name: "Dec Test", district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none" }
  });
  const application = await prisma.application.create({ data: { siteId: site.id, vendorId } });
  applicationId = application.id;
  adminToken = await login(emails[0]);
  vendorToken = await login(emails[1]);
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("admin lists the application queue", async () => {
  const res = await request(app).get("/api/v1/applications?status=pending").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((a) => a.id === applicationId));
});

test("vendor cannot list the queue", async () => {
  const res = await request(app).get("/api/v1/applications").set("Authorization", `Bearer ${vendorToken}`);
  assert.equal(res.status, 403);
});

test("rejects a decision without a reason", async () => {
  const res = await request(app).patch(`/api/v1/applications/${applicationId}`).set("Authorization", `Bearer ${adminToken}`).send({ outcome: "approved" });
  assert.equal(res.status, 400);
});

test("vendor cannot decide", async () => {
  const res = await request(app).patch(`/api/v1/applications/${applicationId}`).set("Authorization", `Bearer ${vendorToken}`).send({ outcome: "approved", reason: "me" });
  assert.equal(res.status, 403);
});

test("admin approves an application", async () => {
  const res = await request(app).patch(`/api/v1/applications/${applicationId}`).set("Authorization", `Bearer ${adminToken}`).send({ outcome: "approved", reason: "First in queue" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "approved");

  const allocations = await prisma.allocation.count({ where: { applicationId } });
  const notifications = await prisma.notification.count({ where: { userId: vendorId } });
  assert.equal(allocations, 1);
  assert.equal(notifications, 1);
});

test("rejects deciding twice", async () => {
  const res = await request(app).patch(`/api/v1/applications/${applicationId}`).set("Authorization", `Bearer ${adminToken}`).send({ outcome: "rejected", reason: "Changed mind" });
  assert.equal(res.status, 409);
});
