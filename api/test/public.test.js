import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import test, { after, before } from "node:test";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const email = "pub-vendor@example.com";

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
  const site = await prisma.site.create({
    data: { reference: "PUB-TEST", name: "Public Test", district: "Gasabo", sector: "Remera", type: "Produce", size: "5 m²", fee: 1000, latitude: -1.9, longitude: 30.1, terms: "none" }
  });
  const application = await prisma.application.create({ data: { siteId: site.id, vendorId: vendor.id, status: "approved" } });
  const allocation = await prisma.allocation.create({
    data: { siteId: site.id, applicationId: application.id, outcome: "approved", reason: "private reason", reasonCategory: "override", queuePosition: 3, waitingCount: 5, outOfOrder: true, decidedById: vendor.id }
  });
  await prisma.flag.create({ data: { allocationId: allocation.id, vendorId: vendor.id, category: "Queue order", note: "private note" } });
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("anyone reads the spaces", async () => {
  const res = await request(app).get("/api/v1/public/spaces");
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((s) => s.reference === "PUB-TEST"));
});

test("anyone reads the activity log", async () => {
  const res = await request(app).get("/api/v1/public/activity");
  assert.ok(res.body.data.some((a) => a.site === "Public Test" && a.event === "Allocated"));
});

test("the activity log shows queue context without reasons", async () => {
  const res = await request(app).get("/api/v1/public/activity");
  const entry = res.body.data.find((a) => a.site === "Public Test");
  assert.equal(entry.queuePosition, 3);
  assert.equal(entry.waitingCount, 5);
  assert.equal(entry.outOfOrder, true);
  assert.equal(entry.reasonCategory, "Queue override");
});

test("filters the activity log by date", async () => {
  const future = await request(app).get("/api/v1/public/activity?from=2999-01-01");
  assert.ok(!future.body.data.some((a) => a.site === "Public Test"));
  const today = new Date().toISOString().slice(0, 10);
  const current = await request(app).get(`/api/v1/public/activity?from=${today}&to=${today}`);
  assert.ok(current.body.data.some((a) => a.site === "Public Test"));
});

test("rejects a badly formatted date", async () => {
  const res = await request(app).get("/api/v1/public/activity?from=yesterday");
  assert.equal(res.status, 400);
});

test("anyone reads the flag log", async () => {
  const res = await request(app).get("/api/v1/public/flags");
  assert.ok(res.body.data.some((f) => f.category === "Queue order"));
});

test("public data never contains personal details", async () => {
  const paths = ["spaces", "activity", "flags"];
  for (const path of paths) {
    const res = await request(app).get(`/api/v1/public/${path}`);
    const text = JSON.stringify(res.body);
    assert.ok(!text.includes("Secret Vendor"));
    assert.ok(!text.includes(email));
    assert.ok(!text.includes("private"));
  }
});

test("downloads a CSV", async () => {
  const res = await request(app).get("/api/v1/public/spaces?format=csv");
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /text\/csv/);
  assert.match(res.text, /"reference"/);
});

test("downloads JSON when the format is asked for", async () => {
  const res = await request(app).get("/api/v1/public/flags?format=json");
  assert.match(res.headers["content-disposition"], /flags\.json/);
});

test("rejects an unknown format", async () => {
  const res = await request(app).get("/api/v1/public/spaces?format=xml");
  assert.equal(res.status, 400);
});
