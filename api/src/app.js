import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) }));
app.use(express.json({ limit: "100kb" }));
app.use(morgan(env.NODE_ENV === "test" ? "tiny" : "dev", {
  skip: () => env.NODE_ENV === "test"
}));

app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);

