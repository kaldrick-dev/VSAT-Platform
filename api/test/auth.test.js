import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const user = { fullName: "Test Vendor", email: "auth-test@example.com", password: "password123" };

before(() => prisma.user.deleteMany({ where: { email: user.email } }));
after(async () => {
  await prisma.user.deleteMany({ where: { email: user.email } });
  await prisma.$disconnect();
});

test("registers a vendor", async () => {
  const res = await request(app).post("/api/v1/auth/register").send(user);
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, "vendor");
  assert.equal(res.body.user.passwordHash, undefined);
});

test("rejects a duplicate email", async () => {
  const res = await request(app).post("/api/v1/auth/register").send(user);
  assert.equal(res.status, 409);
});

test("rejects a short password", async () => {
  const res = await request(app).post("/api/v1/auth/register").send({ ...user, email: "x@example.com", password: "123" });
  assert.equal(res.status, 400);
});

test("logs in and reads me", async () => {
  const login = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: user.password });
  assert.equal(login.status, 200);

  const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${login.body.token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, user.email);
});

test("rejects a wrong password", async () => {
  const res = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: "wrongpass1" });
  assert.equal(res.status, 401);
});
