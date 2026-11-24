import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["dec-admin@example.com", "dec-vendor@example.com", "dec-vendor2@example.com"];
const password = "password123";
let adminToken, vendorToken, applicationId, vendorId, firstId, secondId, otherId, siteId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;

const cleanup = async () => {
  await prisma.notification.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.$executeRaw`ALTER TABLE allocations DISABLE TRIGGER allocations_no_update_delete`;
  await prisma.allocation.deleteMany({ where: { site: { reference: { startsWith: "DEC-TEST" } } } });
  await prisma.$executeRaw`ALTER TABLE allocations ENABLE TRIGGER allocations_no_update_delete`;
  await prisma.application.deleteMany({ where: { site: { reference: { startsWith: "DEC-TEST" } } } });
  await prisma.site.deleteMany({ where: { reference: { startsWith: "DEC-TEST" } } });
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
  const other = await prisma.user.create({ data: { fullName: "Vendor Two", email: emails[2], passwordHash } });
  otherId = other.id;
  siteId = site.id;
  const queued = await prisma.site.create({
    data: { reference: "DEC-TEST-Q", name: "Dec Queue", district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none" }
  });
  firstId = (await prisma.application.create({ data: { siteId: queued.id, vendorId, appliedAt: new Date(Date.now() - 60000) } })).id;
  secondId = (await prisma.application.create({ data: { siteId: queued.id, vendorId: other.id } })).id;
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

const decide = (id, body) => request(app).patch(`/api/v1/applications/${id}`).set("Authorization", `Bearer ${adminToken}`).send(body);

test("refuses to approve an application that skips the queue", async () => {
  const res = await decide(secondId, { outcome: "approved", reason: "I like this one" });
  assert.equal(res.status, 409);
  assert.equal(res.body.code, "out_of_queue_order");
});

test("an override needs a long reason", async () => {
  const res = await decide(secondId, { outcome: "approved", reason: "too short", outOfOrder: true });
  assert.equal(res.status, 400);
});

test("rejecting a later application does not need an override", async () => {
  const res = await decide(secondId, { outcome: "rejected", reason: "Documents missing", reasonCategory: "documents" });
  assert.equal(res.status, 200);
  const entry = await prisma.allocation.findFirst({ where: { applicationId: secondId } });
  assert.equal(entry.outOfOrder, false);
  assert.equal(entry.reasonCategory, "documents");
});

test("approving the first application records its queue position", async () => {
  const res = await decide(firstId, { outcome: "approved", reason: "First in queue order", reasonCategory: "queue_order" });
  assert.equal(res.status, 200);
  const entry = await prisma.allocation.findFirst({ where: { applicationId: firstId } });
  assert.equal(entry.queuePosition, 1);
  assert.equal(entry.waitingCount, 1);
  assert.equal(entry.outOfOrder, false);
});

test("refuses to allocate a site that is already allocated", async () => {
  const late = await prisma.application.create({ data: { siteId, vendorId: otherId } });
  const res = await decide(late.id, { outcome: "approved", reason: "Trying after the site is gone", outOfOrder: true });
  assert.equal(res.status, 409);
  assert.equal(res.body.code, "site_unavailable");
});
