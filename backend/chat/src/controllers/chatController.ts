import { Request, Response } from "express";
import mongoose from "mongoose";
import Chat from "../models/Chat";

export const createNewChat = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const loggedInUserId = res.locals.userId as string | undefined;
    const { userId } = req.body as { userId?: string };

    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(loggedInUserId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (loggedInUserId === userId) {
      return res
        .status(400)
        .json({ message: "You cannot create chat with yourself" });
    }

    const existingChat = await Chat.findOne({
      users: { $all: [loggedInUserId, userId] },
    });

    if (existingChat) {
      return res.status(200).json({
        message: "Chat already exists",
        chat: existingChat,
      });
    }

    const chat = await Chat.create({
      users: [loggedInUserId, userId],
    });

    return res.status(201).json({
      message: "Chat created successfully",
      chat,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getAllChats = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const chats = await Chat.find({
      users: userId,
    }).sort({ updatedAt: -1 });

    return res.status(200).json({
      message: "Chats fetched successfully",
      chats,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getChatById = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    return res.status(200).json({
      message: "Chat fetched successfully",
      chat,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
