import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const email = "pub-vendor@example.com";
let token;

const cleanup = async () => {
  await prisma.flag.deleteMany({ where: { vendor: { email } } });
  await prisma.$executeRaw`ALTER TABLE allocations DISABLE TRIGGER allocations_no_update_delete`;
  await prisma.allocation.deleteMany({ where: { site: { reference: "PUB-TEST" } } });
  await prisma.$executeRaw`ALTER TABLE allocations ENABLE TRIGGER allocations_no_update_delete`;
  await prisma.application.deleteMany({ where: { site: { reference: "PUB-TEST" } } });
  await prisma.site.deleteMany({ where: { reference: "PUB-TEST" } });
  await prisma.user.deleteMany({ where: { email } });
};

before(async () => {
  await cleanup();
  const passwordHash = await bcrypt.hash("password123", 4);
  const vendor = await prisma.user.create({ data: { fullName: "Secret Vendor", email, passwordHash } });
  token = (await request(app).post("/api/v1/auth/login").send({ email, password: "password123" })).body.token;
  const site = await prisma.site.create({
    data: { reference: "PUB-TEST", name: "Public Test", district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none" }
  });
  const application = await prisma.application.create({ data: { siteId: site.id, vendorId: vendor.id, status: "approved" } });
  const allocation = await prisma.allocation.create({
    data: { siteId: site.id, applicationId: application.id, outcome: "approved", reason: "private reason", reasonCategory: "override", queuePosition: 3, waitingCount: 5, outOfOrder: true, decidedById: vendor.id }
  });
  await prisma.flag.create({ data: { allocationId: allocation.id, vendorId: vendor.id, category: "Queue order", note: "private note", dueAt: new Date(Date.now() - 86400000) } });
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("rejects public data without a token", async () => {
  for (const path of ["spaces", "activity", "flags", "summary"]) {
    const res = await request(app).get(`/api/v1/public/${path}`);
    assert.equal(res.status, 401);
  }
  const csv = await request(app).get("/api/v1/public/spaces?format=csv");
  assert.equal(csv.status, 401);
});

test("a signed-in user reads the spaces", async () => {
  const res = await request(app).get("/api/v1/public/spaces").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((s) => s.reference === "PUB-TEST"));
});

test("a signed-in user reads the activity log", async () => {
  const res = await request(app).get("/api/v1/public/activity").set("Authorization", `Bearer ${token}`);
  assert.ok(res.body.data.some((a) => a.site === "Public Test" && a.event === "Allocated"));
});

test("the activity log shows queue context without reasons", async () => {
  const res = await request(app).get("/api/v1/public/activity").set("Authorization", `Bearer ${token}`);
  const entry = res.body.data.find((a) => a.site === "Public Test");
  assert.equal(entry.reference, "PUB-TEST");
  assert.equal(entry.queuePosition, 3);
  assert.equal(entry.waitingCount, 5);
  assert.equal(entry.outOfOrder, true);
  assert.equal(entry.reasonCategory, "Queue override");
});

test("filters the activity log by date", async () => {
  const future = await request(app).get("/api/v1/public/activity?from=2999-01-01").set("Authorization", `Bearer ${token}`);
  assert.ok(!future.body.data.some((a) => a.site === "Public Test"));
  const today = new Date().toISOString().slice(0, 10);
  const current = await request(app).get(`/api/v1/public/activity?from=${today}&to=${today}`).set("Authorization", `Bearer ${token}`);
  assert.ok(current.body.data.some((a) => a.site === "Public Test"));
});

test("rejects a badly formatted date", async () => {
  const res = await request(app).get("/api/v1/public/activity?from=yesterday").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 400);
});

test("a signed-in user reads the flag log", async () => {
  const res = await request(app).get("/api/v1/public/flags").set("Authorization", `Bearer ${token}`);
  assert.ok(res.body.data.some((f) => f.category === "Queue order"));
});

test("public data never contains personal details", async () => {
  const paths = ["spaces", "activity", "flags"];
  for (const path of paths) {
    const res = await request(app).get(`/api/v1/public/${path}`).set("Authorization", `Bearer ${token}`);
    const text = JSON.stringify(res.body);
    assert.ok(!text.includes("Secret Vendor"));
    assert.ok(!text.includes(email));
    assert.ok(!text.includes("private"));
  }
});

test("the flag log shows an overdue open flag", async () => {
  const res = await request(app).get("/api/v1/public/flags").set("Authorization", `Bearer ${token}`);
  const flag = res.body.data.find((f) => f.category === "Queue order");
  assert.equal(flag.overdue, true);
  assert.equal(flag.daysToAnswer, null);
});

test("a signed-in user reads the accountability summary", async () => {
  const res = await request(app).get("/api/v1/public/summary").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.allocations.total >= 1);
  assert.ok(res.body.data.allocations.outOfOrder >= 1);
  assert.ok(res.body.data.flags.overdue >= 1);
  assert.ok(res.body.data.allocations.byDistrict.some((d) => d.district === "Gasabo"));
});

test("the summary never contains personal details", async () => {
  const text = JSON.stringify((await request(app).get("/api/v1/public/summary").set("Authorization", `Bearer ${token}`)).body);
  assert.ok(!text.includes("Secret Vendor") && !text.includes(email));
});

test("downloads a CSV", async () => {
  const res = await request(app).get("/api/v1/public/spaces?format=csv").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /text\/csv/);
  assert.match(res.text, /"reference"/);
});

test("downloads JSON when the format is asked for", async () => {
  const res = await request(app).get("/api/v1/public/flags?format=json").set("Authorization", `Bearer ${token}`);
  assert.match(res.headers["content-disposition"], /flags\.json/);
});

test("rejects an unknown format", async () => {
  const res = await request(app).get("/api/v1/public/spaces?format=xml").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 400);
});
