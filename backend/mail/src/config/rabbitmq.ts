import amqp, { Channel, Connection, ConsumeMessage } from "amqplib";
import { sendMail } from "../services/mailer";

let connection: Connection | null = null;
let channel: Channel | null = null;

const getRabbitUrl = (): string => {
  return process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
};

const getQueueName = (): string => {
  return process.env.RABBITMQ_QUEUE || "user.signup";
};

export const connectRabbitMQ = async (): Promise<void> => {
  if (channel) {
    return;
  }

  connection = await amqp.connect(getRabbitUrl());
  channel = await connection.createChannel();
  await channel.assertQueue(getQueueName(), { durable: true });
  console.log("RabbitMQ connected");
};

const handleSignupMessage = async (msg: ConsumeMessage): Promise<void> => {
  const raw = msg.content.toString();
  const payload = JSON.parse(raw) as {
    email?: string;
    name?: string;
  };

  if (!payload.email) {
    throw new Error("Signup message missing email");
  }

  const userName = payload.name || "User";

  await sendMail({
    to: payload.email,
    subject: "Welcome to Video Chat App",
    text: `Hi ${userName}, your account was created successfully.`
  });
};

export const consumeSignupMessages = async (): Promise<void> => {
  if (!channel) {
    await connectRabbitMQ();
  }

  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  await channel.consume(getQueueName(), async (msg: ConsumeMessage | null) => {
    if (!msg) {
      return;
    }

    try {
      await handleSignupMessage(msg);
      channel?.ack(msg);
    } catch (error) {
      console.error("Failed to process signup message:", (error as Error).message);
      channel?.nack(msg, false, false);
    }
  });

  console.log(`Consuming queue: ${getQueueName()}`);
};
