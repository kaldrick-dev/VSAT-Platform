import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { validate } from "../src/middleware/validate.js";

const check = validate({ body: z.object({ name: z.string().min(1) }) });

test("accepts a valid body", () => {
  const req = { body: { name: "Kimironko" } };
  let error = "not called";
  check(req, {}, (e) => { error = e; });
  assert.equal(error, undefined);
});

test("rejects an invalid body with 400", () => {
  const req = { body: {} };
  let error;
  check(req, {}, (e) => { error = e; });
  assert.equal(error.status, 400);
  assert.equal(error.code, "validation_error");
});
