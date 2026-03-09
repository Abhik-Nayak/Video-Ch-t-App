import dotenv from "dotenv";
import app from "./app";
import { connectRabbitMQ, consumeSignupMessages } from "./config/rabbitmq";

dotenv.config();

const port = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectRabbitMQ();
    await consumeSignupMessages();

    app.listen(port, () => {
      console.log(`Mail service running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start mail service:", (error as Error).message);
    process.exit(1);
  }
};

void startServer();
