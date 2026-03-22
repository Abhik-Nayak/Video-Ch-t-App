import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const currentUserId = user?.id || user?._id;

  if (!user) return <Navigate to="/login" />;

  // Fetch users list
  useEffect(() => {
    api.get("/api/auth/users").then((res) => setUsers(res.data));
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const senderId = msg.sender._id || msg.sender;
      const receiverId = msg.receiver._id || msg.receiver;
      const selectedId = selectedUser?._id;
      if (senderId === selectedId || receiverId === selectedId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleMessageSent = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleStatusUpdated = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status } : m))
      );
    };

    const handleUserStatus = ({ userId, isOnline }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isOnline } : u))
      );
      if (selectedUser?._id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, isOnline } : prev));
      }
    };

    const handleTyping = ({ userId }) => {
      if (userId === selectedUser?._id) setIsTyping(true);
    };

    const handleStopTyping = ({ userId }) => {
      if (userId === selectedUser?._id) setIsTyping(false);
    };

    socket.on("new-message", handleNewMessage);
    socket.on("message-sent", handleMessageSent);
    socket.on("message-status-updated", handleStatusUpdated);
    socket.on("user-status-changed", handleUserStatus);
    socket.on("user-typing", handleTyping);
    socket.on("user-stop-typing", handleStopTyping);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("message-sent", handleMessageSent);
      socket.off("message-status-updated", handleStatusUpdated);
      socket.off("user-status-changed", handleUserStatus);
      socket.off("user-typing", handleTyping);
      socket.off("user-stop-typing", handleStopTyping);
    };
  }, [socket, selectedUser]);

  // Load messages when selecting a user
  const handleSelectUser = async (u) => {
    setSelectedUser(u);
    setMessages([]);
    setIsTyping(false);

    const res = await api.get(`/api/messages/${u._id}`);
    setMessages(res.data);

    // Mark unread messages as read
    if (socket) {
      res.data.forEach((msg) => {
        const senderId = msg.sender._id || msg.sender;
        if (senderId === u._id && msg.status !== "read") {
          socket.emit("message-read", { messageId: msg._id, senderId: u._id });
        }
      });
    }
  };

  const handleSend = useCallback(
    (content) => {
      if (!socket || !selectedUser) return;
      socket.emit("send-message", {
        senderId: currentUserId,
        receiverId: selectedUser._id,
        content,
      });
    },
    [socket, selectedUser, currentUserId]
  );

  const handleTyping = useCallback(() => {
    if (!socket || !selectedUser) return;
    socket.emit("typing", { senderId: currentUserId, receiverId: selectedUser._id });
  }, [socket, selectedUser, currentUserId]);

  const handleStopTyping = useCallback(() => {
    if (!socket || !selectedUser) return;
    socket.emit("stop-typing", { senderId: currentUserId, receiverId: selectedUser._id });
  }, [socket, selectedUser, currentUserId]);

  return (
    <div className="chat-page">
      <Sidebar users={users} selectedUser={selectedUser} onSelect={handleSelectUser} />
      <div className="chat-main">
        <ChatWindow
          messages={messages}
          currentUserId={currentUserId}
          isTyping={isTyping}
          selectedUser={selectedUser}
        />
        {selectedUser && (
          <MessageInput
            onSend={handleSend}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
          />
        )}
      </div>
    </div>
  );
}