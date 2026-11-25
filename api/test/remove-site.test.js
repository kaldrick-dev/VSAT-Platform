import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["rm-admin@example.com", "rm-vendor@example.com"];
const password = "password123";
const refs = ["RM-FREE", "RM-ALLOC", "RM-PEND", "RM-HIST"];
let adminToken, vendorToken, ids = {};

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;
const remove = (id, token = adminToken) => request(app).delete(`/api/v1/sites/${id}`).set("Authorization", `Bearer ${token}`);

const cleanup = async () => {
  await prisma.$executeRaw`ALTER TABLE allocations DISABLE TRIGGER allocations_no_update_delete`;
  await prisma.allocation.deleteMany({ where: { site: { reference: { in: refs } } } });
  await prisma.$executeRaw`ALTER TABLE allocations ENABLE TRIGGER allocations_no_update_delete`;
  await prisma.application.deleteMany({ where: { site: { reference: { in: refs } } } });
  await prisma.site.deleteMany({ where: { reference: { in: refs } } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

const makeSite = (reference, status = "available") =>
  prisma.site.create({
    data: { reference, name: `Site ${reference}`, district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none", status }
  });

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  const adminUser = await prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash, role: "admin" } });
  const vendorUser = await prisma.user.create({ data: { fullName: "Vendor", email: emails[1], passwordHash } });
  for (const [ref, status] of [["RM-FREE", "available"], ["RM-ALLOC", "allocated"], ["RM-PEND", "available"], ["RM-HIST", "available"]]) ids[ref] = (await makeSite(ref, status)).id;
  await prisma.application.create({ data: { siteId: ids["RM-PEND"], vendorId: vendorUser.id } });
  const old = await prisma.application.create({ data: { siteId: ids["RM-HIST"], vendorId: vendorUser.id, status: "revoked" } });
  for (const outcome of ["approved", "revoked"]) {
    await prisma.allocation.create({ data: { siteId: ids["RM-HIST"], applicationId: old.id, outcome, reason: "history entry", decidedById: adminUser.id } });
  }
  adminToken = await login(emails[0]);
  vendorToken = await login(emails[1]);
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("vendor cannot remove a site", async () => {
  assert.equal((await remove(ids["RM-FREE"], vendorToken)).status, 403);
});

test("returns 404 removing a missing site", async () => {
  assert.equal((await remove("missing-site")).status, 404);
});

test("refuses to remove a site that is still allocated", async () => {
  const res = await remove(ids["RM-ALLOC"]);
  assert.equal(res.status, 409);
  assert.equal(res.body.code, "site_allocated");
});

test("refuses to remove a site with pending applications", async () => {
  const res = await remove(ids["RM-PEND"]);
  assert.equal(res.status, 409);
  assert.equal(res.body.code, "has_pending_applications");
});

test("admin removes a free site and it leaves every list", async () => {
  assert.equal((await remove(ids["RM-FREE"])).status, 204);

  const list = await request(app).get("/api/v1/sites");
  assert.ok(!list.body.data.some((s) => s.id === ids["RM-FREE"]));
  assert.equal((await request(app).get(`/api/v1/sites/${ids["RM-FREE"]}`)).status, 404);

  const spaces = await request(app).get("/api/v1/public/spaces").set("Authorization", `Bearer ${vendorToken}`);
  assert.ok(!spaces.body.data.some((s) => s.reference === "RM-FREE"));
});

test("nobody can apply for a removed site", async () => {
  const res = await request(app).post(`/api/v1/sites/${ids["RM-FREE"]}/applications`).set("Authorization", `Bearer ${vendorToken}`).send({});
  assert.equal(res.status, 404);
});

test("removing it again returns 404", async () => {
  assert.equal((await remove(ids["RM-FREE"])).status, 404);
});

test("a removed site keeps its decisions in the log", async () => {
  assert.equal((await remove(ids["RM-HIST"])).status, 204);
  const kept = await prisma.allocation.count({ where: { siteId: ids["RM-HIST"] } });
  assert.equal(kept, 2);

  const activity = await request(app).get("/api/v1/public/activity").set("Authorization", `Bearer ${vendorToken}`);
  assert.ok(activity.body.data.some((e) => e.reference === "RM-HIST"));
});
