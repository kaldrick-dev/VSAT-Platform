import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["app-admin@example.com", "app-vendor1@example.com", "app-vendor2@example.com"];
const password = "password123";
let adminToken, vendor1Token, vendor2Token, siteId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;

const cleanup = async () => {
  await prisma.application.deleteMany({ where: { vendor: { email: { in: emails } } } });
  await prisma.site.deleteMany({ where: { reference: "APP-TEST" } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  await prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash, role: "admin" } });
  await prisma.user.create({ data: { fullName: "Vendor One", email: emails[1], passwordHash } });
  await prisma.user.create({ data: { fullName: "Vendor Two", email: emails[2], passwordHash } });
  const site = await prisma.site.create({
    data: { reference: "APP-TEST", name: "App Test", district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none" }
  });
  siteId = site.id;
  [adminToken, vendor1Token, vendor2Token] = await Promise.all(emails.map(login));
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("vendor applies and is first in the queue", async () => {
  const res = await request(app).post(`/api/v1/sites/${siteId}/applications`).set("Authorization", `Bearer ${vendor1Token}`).send({ statement: "Please" });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.queuePosition, 1);
});

test("second vendor is second in the queue", async () => {
  const res = await request(app).post(`/api/v1/sites/${siteId}/applications`).set("Authorization", `Bearer ${vendor2Token}`).send({});
  assert.equal(res.body.data.queuePosition, 2);
});

test("rejects a duplicate application", async () => {
  const res = await request(app).post(`/api/v1/sites/${siteId}/applications`).set("Authorization", `Bearer ${vendor1Token}`).send({});
  assert.equal(res.status, 409);
});

test("admin cannot apply", async () => {
  const res = await request(app).post(`/api/v1/sites/${siteId}/applications`).set("Authorization", `Bearer ${adminToken}`).send({});
  assert.equal(res.status, 403);
});

test("returns 404 for a missing site", async () => {
  const res = await request(app).post("/api/v1/sites/nope/applications").set("Authorization", `Bearer ${vendor1Token}`).send({});
  assert.equal(res.status, 404);
});

test("vendor lists only their own applications", async () => {
  const res = await request(app).get("/api/v1/applications/me").set("Authorization", `Bearer ${vendor2Token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].queuePosition, 2);
});

test("admin cannot read vendor applications", async () => {
  const res = await request(app).get("/api/v1/applications/me").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 403);
});

test("another vendor cannot withdraw my application", async () => {
  const mine = (await request(app).get("/api/v1/applications/me").set("Authorization", `Bearer ${vendor1Token}`)).body.data[0];
  const res = await request(app).patch(`/api/v1/applications/${mine.id}/withdraw`).set("Authorization", `Bearer ${vendor2Token}`);
  assert.equal(res.status, 404);
});

test("admin cannot withdraw an application", async () => {
  const mine = (await request(app).get("/api/v1/applications/me").set("Authorization", `Bearer ${vendor1Token}`)).body.data[0];
  const res = await request(app).patch(`/api/v1/applications/${mine.id}/withdraw`).set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 403);
});

test("vendor withdraws and the queue closes up", async () => {
  const mine = (await request(app).get("/api/v1/applications/me").set("Authorization", `Bearer ${vendor1Token}`)).body.data[0];
  const res = await request(app).patch(`/api/v1/applications/${mine.id}/withdraw`).set("Authorization", `Bearer ${vendor1Token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "withdrawn");

  const other = await request(app).get("/api/v1/applications/me").set("Authorization", `Bearer ${vendor2Token}`);
  assert.equal(other.body.data[0].queuePosition, 1);
});

test("rejects withdrawing twice", async () => {
  const mine = (await request(app).get("/api/v1/applications/me").set("Authorization", `Bearer ${vendor1Token}`)).body.data[0];
  const res = await request(app).patch(`/api/v1/applications/${mine.id}/withdraw`).set("Authorization", `Bearer ${vendor1Token}`);
  assert.equal(res.status, 409);
});

test("vendor can apply again after withdrawing and goes to the back", async () => {
  const res = await request(app).post(`/api/v1/sites/${siteId}/applications`).set("Authorization", `Bearer ${vendor1Token}`).send({ statement: "Back again" });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.queuePosition, 2);
});
