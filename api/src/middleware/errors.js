import { HttpError } from "../utils/http-error.js";

export const notFound = (req, _res, next) => {
  next(new HttpError(404, "not_found", `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error, _req, res, _next) => {
  const status = error.status ?? 500;
  if (status >= 500) console.error(error);

  res.status(status).json({
    code: error.code ?? "server_error",
    message: status >= 500 ? "An unexpected error occurred" : error.message,
    details: error.details
  });
};
