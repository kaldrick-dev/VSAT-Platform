import { HttpError } from "../utils/http-error.js";

// Parses body, query and params with a zod schema object like { body: z.object({...}) }.
export const validate = (schemas) => (req, _res, next) => {
  for (const part of ["body", "query", "params"]) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part]);
    if (!result.success) {
      return next(new HttpError(400, "validation_error", "Invalid request", result.error.issues));
    }
    Object.defineProperty(req, part, { value: result.data, writable: true });
  }
  next();
};
