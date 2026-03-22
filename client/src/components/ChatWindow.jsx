import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages, currentUserId, isTyping, selectedUser }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (!selectedUser) {
    return (
      <div className="chat-window empty">
        <p>Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{selectedUser.name}</h3>
        <span className={`status-dot ${selectedUser.isOnline ? "online" : "offline"}`} />
      </div>
      <div className="messages-list">
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={(msg.sender._id || msg.sender) === currentUserId}
          />
        ))}
        {isTyping && <div className="typing-indicator">typing...</div>}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}