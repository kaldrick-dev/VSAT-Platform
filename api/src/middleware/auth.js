import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export const requireAuth = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "unauthenticated", "Authentication required"));
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    next(new HttpError(401, "unauthenticated", "Invalid or expired token"));
  }
};

export const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new HttpError(403, "forbidden", "You do not have access to this resource"));
  }
  next();
};
