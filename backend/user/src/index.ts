import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";
import { createClient } from "redis";

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not configured");
}

export const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient
  .connect()
  .then(() => console.log("connected to redis."))
  .catch(console.error);

const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () => {
      console.log(`User service running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start user service:", (error as Error).message);
    process.exit(1);
  }
};

void startServer();
