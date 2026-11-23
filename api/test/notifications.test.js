import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const emails = ["note-vendor1@example.com", "note-vendor2@example.com"];
const password = "password123";
let token1, token2, notificationId;

const login = async (email) => (await request(app).post("/api/v1/auth/login").send({ email, password })).body.token;

const cleanup = async () => {
  await prisma.notification.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash(password, 4);
  const user1 = await prisma.user.create({ data: { fullName: "One", email: emails[0], passwordHash } });
  await prisma.user.create({ data: { fullName: "Two", email: emails[1], passwordHash } });
  await prisma.notification.createMany({
    data: [
      { userId: user1.id, title: "First", body: "Hello" },
      { userId: user1.id, title: "Second", body: "Again" }
    ]
  });
  [token1, token2] = await Promise.all(emails.map(login));
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("rejects listing without a token", async () => {
  const res = await request(app).get("/api/v1/notifications");
  assert.equal(res.status, 401);
});

test("lists own notifications with an unread count", async () => {
  const res = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${token1}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 2);
  assert.equal(res.body.unread, 2);
  notificationId = res.body.data[0].id;
});

test("marks one notification read", async () => {
  const res = await request(app).patch(`/api/v1/notifications/${notificationId}/read`).set("Authorization", `Bearer ${token1}`);
  assert.equal(res.body.data.read, true);
});

test("cannot read another user's notification", async () => {
  const res = await request(app).patch(`/api/v1/notifications/${notificationId}/read`).set("Authorization", `Bearer ${token2}`);
  assert.equal(res.status, 404);
});

test("marks all notifications read", async () => {
  const res = await request(app).post("/api/v1/notifications/read-all").set("Authorization", `Bearer ${token1}`);
  assert.equal(res.status, 204);

  const list = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${token1}`);
  assert.equal(list.body.unread, 0);
});
