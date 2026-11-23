import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const admin = { email: "sites-admin@example.com", password: "password123" };
const vendor = { email: "sites-vendor@example.com", password: "password123" };
const site = {
  reference: "TEST-1", name: "Test Market", district: "Gasabo", sector: "Remera", type: "Produce",
  size: "10 m²", fee: 15000, latitude: -1.95, longitude: 30.1, terms: "Daily trading"
};
let adminToken, vendorToken, siteId;

const login = async (user) => (await request(app).post("/api/v1/auth/login").send(user)).body.token;

before(async () => {
  const passwordHash = await bcrypt.hash(admin.password, 4);
  await prisma.site.deleteMany({ where: { reference: site.reference } });
  await prisma.user.deleteMany({ where: { email: { in: [admin.email, vendor.email] } } });
  await prisma.user.create({ data: { fullName: "Admin", email: admin.email, passwordHash, role: "admin" } });
  await prisma.user.create({ data: { fullName: "Vendor", email: vendor.email, passwordHash } });
  adminToken = await login(admin);
  vendorToken = await login(vendor);
});

after(async () => {
  await prisma.site.deleteMany({ where: { reference: site.reference } });
  await prisma.user.deleteMany({ where: { email: { in: [admin.email, vendor.email] } } });
  await prisma.$disconnect();
});

test("admin creates a site", async () => {
  const res = await request(app).post("/api/v1/sites").set("Authorization", `Bearer ${adminToken}`).send(site);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.name, "Test Market");
  siteId = res.body.data.id;
});

test("vendor cannot create a site", async () => {
  const res = await request(app).post("/api/v1/sites").set("Authorization", `Bearer ${vendorToken}`).send(site);
  assert.equal(res.status, 403);
});

test("rejects a site with bad input", async () => {
  const res = await request(app).post("/api/v1/sites").set("Authorization", `Bearer ${adminToken}`).send({ name: "x" });
  assert.equal(res.status, 400);
});

test("anyone lists sites with a filter", async () => {
  const res = await request(app).get("/api/v1/sites?district=Gasabo");
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((s) => s.id === siteId));
});

test("anyone reads one site", async () => {
  const res = await request(app).get(`/api/v1/sites/${siteId}`);
  assert.equal(res.body.data.reference, "TEST-1");
});

test("a site shows its pending queue count", async () => {
  const res = await request(app).get(`/api/v1/sites/${siteId}`);
  assert.equal(res.body.data.queue, 0);
});

test("admin updates a site", async () => {
  const res = await request(app).patch(`/api/v1/sites/${siteId}`).set("Authorization", `Bearer ${adminToken}`).send({ status: "inactive" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "inactive");
});

test("returns 404 for a missing site", async () => {
  const res = await request(app).get("/api/v1/sites/does-not-exist");
  assert.equal(res.status, 404);
});
