import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { publishToQueue } from "../config/rabbitmq";
import { tryCatch } from "../config/tryCatch";
import User from "../models/User";
import { redisClient } from "../index";

const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = Number(
  process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || 1,
);
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = Number(
  process.env.LOGIN_RATE_LIMIT_WINDOW_SECONDS || 60,
);
const OTP_EXPIRY_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS || 300); // 5min

const generateOtp = (): string => {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
};

const jwtAuthToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
};

export const signup = tryCatch(
  async (req: Request, res: Response): Promise<Response> => {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = jwtAuthToken(user._id.toString());

    return res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  },
);

export const signin = tryCatch(
  async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const loginRateLimitKey = `rate-limit:signin:${normalizedEmail}`;
    const currentAttemptCount = await redisClient.incr(loginRateLimitKey);

    if (currentAttemptCount === 1) {
      await redisClient.expire(
        loginRateLimitKey,
        LOGIN_RATE_LIMIT_WINDOW_SECONDS,
      );
    }

    if (currentAttemptCount > LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
      const retryAfterSeconds = await redisClient.ttl(loginRateLimitKey);
      return res.status(429).json({
        message: "Too many signin attempts. Please wait a minute.",
        retryAfterSeconds:
          retryAfterSeconds > 0
            ? retryAfterSeconds
            : LOGIN_RATE_LIMIT_WINDOW_SECONDS,
      });
    }

    // const user = await User.findOne({ email: normalizedEmail });
    // if (!user) {
    //   return res.status(401).json({ message: "Invalid credentials" });
    // }

    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   return res.status(401).json({ message: "Invalid credentials" });
    // }

    const otp = generateOtp();
    const otpKey = `otp:signin:${normalizedEmail}`;
    await redisClient.setEx(otpKey, OTP_EXPIRY_SECONDS, otp);
    await publishToQueue("send-otp", {
      to: normalizedEmail,
      subject: "Your OTP Code",
      body: `Your OTP is ${otp}. It will expire in ${Math.ceil(OTP_EXPIRY_SECONDS / 60)} minutes.`,
    });

    await redisClient.del(loginRateLimitKey);

    return res.status(200).json({ message: "OTP sent to your mail" });
  },
);
