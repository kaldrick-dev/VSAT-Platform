export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status ?? 500;
  const body = {
    error: {
      message: status >= 500 ? "An unexpected error occurred" : error.message
    }
  };

  if (error.details) body.error.details = error.details;
  if (process.env.NODE_ENV !== "test" && status >= 500) console.error(error);

  res.status(status).json(body);
}

