import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
// import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin: allowedOrigin === "*" ? true : allowedOrigin,
    credentials: true,
  }),
);

const port = Number(process.env.PORT) || 4002;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not configured");
}

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "chat-service" });
});


const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoUri);

    server.listen(port, () => {
      console.log(`Chat service running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start chat service:", (error as Error).message);
    process.exit(1);
  }
};

void startServer();
