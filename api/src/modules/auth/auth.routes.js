import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { authLimiter } from "../../middleware/rate-limit.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export const authRoutes = Router();

authRoutes.post("/register", authLimiter, validate({ body: registerSchema }), controller.register);
authRoutes.post("/login", authLimiter, validate({ body: loginSchema }), controller.login);
authRoutes.get("/me", requireAuth, controller.me);
