import User from "../models/User.js";
import Message from "../models/Message.js";

const onlineUsers = new Map();

const chatHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("user-online", async (userId) => {
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("user-status-changed", { userId, isOnline: true });
    });

    socket.on("send-message", async ({ senderId, receiverId, content }) => {
      try {
        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          status: "sent",
        });

        socket.emit("message-sent", message);

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new-message", message);
          message.status = "delivered";
          await message.save();
          socket.emit("message-status-updated", {
            messageId: message._id,
            status: "delivered",
          });
        }
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("message-read", async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: "read" });
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message-status-updated", {
            messageId,
            status: "read",
          });
        }
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-typing", { userId: senderId });
      }
    });

    socket.on("stop-typing", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-stop-typing", { userId: senderId });
      }
    });

    socket.on("disconnect", async () => {
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }

      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId);
        await User.findByIdAndUpdate(disconnectedUserId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit("user-status-changed", {
          userId: disconnectedUserId,
          isOnline: false,
        });
      }

      console.log("User disconnected:", socket.id);
    });
  });
};

export default chatHandler;