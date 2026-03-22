import { Router } from "express";
import auth from "../middleware/auth.js";
import Message from "../models/Message.js";

const router = Router();

// GET /api/messages/:userId — get conversation between current user and :userId
router.get("/:userId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
