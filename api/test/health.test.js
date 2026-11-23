import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { app } from "../src/app.js";

test("reads health", async () => {
  const res = await request(app).get("/api/v1/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
});

test("returns 404 for an unknown route", async () => {
  const res = await request(app).get("/api/v1/missing");
  assert.equal(res.status, 404);
  assert.equal(res.body.code, "not_found");
});

test("returns 401 without a token", async () => {
  const res = await request(app).get("/api/v1/auth/me");
  assert.equal(res.status, 401);
});
