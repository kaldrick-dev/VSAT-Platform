import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["log-admin@example.com", "log-vendor1@example.com", "log-vendor2@example.com"];
const password = "password123";
let adminToken, vendor1Token, vendor2Token, allocationId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;

const cleanup = async () => {
  await prisma.$executeRaw`ALTER TABLE allocations DISABLE TRIGGER allocations_no_update_delete`;
  await prisma.allocation.deleteMany({ where: { site: { reference: "LOG-TEST" } } });
  await prisma.$executeRaw`ALTER TABLE allocations ENABLE TRIGGER allocations_no_update_delete`;
  await prisma.application.deleteMany({ where: { site: { reference: "LOG-TEST" } } });
  await prisma.site.deleteMany({ where: { reference: "LOG-TEST" } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  const admin = await prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash, role: "admin" } });
  const vendor1 = await prisma.user.create({ data: { fullName: "One", email: emails[1], passwordHash } });
  await prisma.user.create({ data: { fullName: "Two", email: emails[2], passwordHash } });
  const site = await prisma.site.create({
    data: { reference: "LOG-TEST", name: "Log Test", district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none" }
  });
  const application = await prisma.application.create({ data: { siteId: site.id, vendorId: vendor1.id, status: "approved" } });
  const allocation = await prisma.allocation.create({
    data: { siteId: site.id, applicationId: application.id, outcome: "approved", reason: "First in queue", decidedById: admin.id }
  });
  allocationId = allocation.id;
  [adminToken, vendor1Token, vendor2Token] = await Promise.all(emails.map(login));
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("rejects reading the log without a token", async () => {
  const res = await request(app).get("/api/v1/allocations");
  assert.equal(res.status, 401);
});

test("admin reads the full log", async () => {
  const res = await request(app).get("/api/v1/allocations?outcome=approved").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((a) => a.id === allocationId));
});

test("vendor sees their own entry", async () => {
  const res = await request(app).get("/api/v1/allocations").set("Authorization", `Bearer ${vendor1Token}`);
  assert.ok(res.body.data.some((a) => a.id === allocationId));
});

test("vendor does not see another vendor's entry", async () => {
  const res = await request(app).get("/api/v1/allocations").set("Authorization", `Bearer ${vendor2Token}`);
  assert.equal(res.body.data.length, 0);
});

test("the database refuses to update the log", async () => {
  await assert.rejects(prisma.allocation.update({ where: { id: allocationId }, data: { reason: "edited" } }));
});

test("the database refuses to delete from the log", async () => {
  await assert.rejects(prisma.allocation.delete({ where: { id: allocationId } }));
});
