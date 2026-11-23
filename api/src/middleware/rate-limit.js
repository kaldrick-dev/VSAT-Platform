import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === "test" ? 1000 : 20,
  message: { code: "rate_limited", message: "Too many attempts, try again later" }
});
