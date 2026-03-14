import cors from "cors";
import express from "express";
import { errorHandler } from "./config/errorHandler";
import authRoutes from "./routes/authRoutes";

const app = express();

const allowedOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin: allowedOrigin === "*" ? true : allowedOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use(errorHandler);

export default app;
