import cors from "cors";
import express from "express";
import { errorHandler } from "./config/errorHandler";
import authRoutes from "./routes/authRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use(errorHandler);

export default app;
