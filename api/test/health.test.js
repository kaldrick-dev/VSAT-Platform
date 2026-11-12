import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { app } from "../src/app.js";

test("GET /api/v1/health reports service health", async () => {
  const response = await request(app).get("/api/v1/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok", service: "vsat-api" });
});

test("unknown API routes use the standard error shape", async () => {
  const response = await request(app).get("/api/v1/missing");

  assert.equal(response.status, 404);
  assert.match(response.body.error.message, /Route not found/);
});

