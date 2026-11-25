import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["prof-admin@example.com", "prof-vendor@example.com"];
const password = "password123";
let adminToken, vendorToken, vendorId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;

const cleanup = async () => {
  await prisma.document.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  await prisma.user.create({ data: { fullName: "Admin", email: emails[0], passwordHash, role: "admin" } });
  const vendor = await prisma.user.create({ data: { fullName: "Vendor", email: emails[1], passwordHash } });
  vendorId = vendor.id;
  adminToken = await login(emails[0]);
  vendorToken = await login(emails[1]);
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("vendor reads their profile", async () => {
  const res = await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${vendorToken}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.email, emails[1]);
});

test("vendor updates their profile", async () => {
  const res = await request(app).patch("/api/v1/profile").set("Authorization", `Bearer ${vendorToken}`).send({ trade: "Tailoring" });
  assert.equal(res.body.data.trade, "Tailoring");
});

test("admin cannot use the vendor profile", async () => {
  const res = await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 403);
});
