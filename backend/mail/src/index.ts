import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./rabbitmqConsumer";
const app = express();

dotenv.config();

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`Mail service running on port ${port} ${port}`);
});
startSendOtpConsumer();

// const startServer = async (): Promise<void> => {
//   try {
//     await connectRabbitMQ();
//     await consumeSignupMessages();

//     app.listen(port, () => {
//       console.log(`Mail service running on port ${port}`);
//     });
//   } catch (error) {
//     console.error("Failed to start mail service:", (error as Error).message);
//     process.exit(1);
//   }
// };

// void startServer();
