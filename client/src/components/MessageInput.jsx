import { useState, useRef, useCallback } from "react";

export default function MessageInput({ onSend, onTyping, onStopTyping }) {
  const [text, setText] = useState("");
  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  const handleChange = useCallback(
    (e) => {
      setText(e.target.value);

      if (!isTyping.current) {
        isTyping.current = true;
        onTyping();
      }

      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        isTyping.current = false;
        onStopTyping();
      }, 1000);
    },
    [onTyping, onStopTyping]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    clearTimeout(typingTimeout.current);
    if (isTyping.current) {
      isTyping.current = false;
      onStopTyping();
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={handleChange}
      />
      <button type="submit">Send</button>
    </form>
  );
}