import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./errors.js";

export function requireAuth(req, _res, next) {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have access to this resource"));
    }
    next();
  };
}

