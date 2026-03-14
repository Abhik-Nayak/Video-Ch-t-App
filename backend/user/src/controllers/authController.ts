import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import { Request, Response } from "express";
import { jwtAuthToken } from "../config/jwt";
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

export const signin = tryCatch(
  async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body as { email: string };

    if (!email) {
      return res.status(400).json({ message: "email is required" });
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

    const otp = generateOtp();
    const otpKey = `otp:signin:${normalizedEmail}`;
    await redisClient.setEx(otpKey, OTP_EXPIRY_SECONDS, otp);
    await publishToQueue("send-otp", {
      to: normalizedEmail,
      subject: "Your OTP Code",
      body: `Your OTP is ${otp}. It will expire in ${Math.ceil(OTP_EXPIRY_SECONDS / 60)} minutes.`,
    });

    return res.status(200).json({ message: "OTP sent to your mail" });
  },
);

export const verifyUser = tryCatch(
  async (req: Request, res: Response): Promise<Response> => {
    const { email, otp } = req.body as { email?: string; otp?: string };

    if (!email || !otp) {
      return res.status(400).json({ message: "email and otp are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const otpKey = `otp:signin:${normalizedEmail}`;
    const storedOtp = await redisClient.get(otpKey);

    if (!storedOtp) {
      return res
        .status(400)
        .json({ message: "OTP expired or not requested for this email" });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const name = email.slice(0, 8);
      user = await User.create({ name, email });
    }

    await redisClient.del(otpKey);
    await redisClient.del(`rate-limit:signin:${normalizedEmail}`);

    const token = jwtAuthToken(user._id.toString());

    return res.status(200).json({
      message: "User verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  },
);

export const profile = tryCatch(
  async (_req: Request, res: Response): Promise<Response> => {
    const userId = res.locals.userId as string | undefined;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  },
);

export const updateProfile = tryCatch(
  async (req: Request, res: Response): Promise<Response> => {
    const userId = res.locals.userId as string | undefined;
    const { name, email } = req.body as {
      name?: string;
      email?: string;
    };

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name && !email) {
      return res
        .status(400)
        .json({ message: "name or email is required to update profile" });
    }

    const updateData: { name?: string; email?: string } = {};

    if (name) {
      updateData.name = name;
    }

    if (email) {
      const normalizedEmail = email.toLowerCase();
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      updateData.email = normalizedEmail;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  },
);

export const getAllUser = tryCatch(
  async (_req: Request, res: Response): Promise<Response> => {
    const users = await User.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  },
);

export const getUserById = tryCatch(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  },
);
