export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusIcon = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case "read":
        return <span className="status-icon read">✓✓</span>;
      case "delivered":
        return <span className="status-icon delivered">✓✓</span>;
      default:
        return <span className="status-icon sent">✓</span>;
    }
  };

  return (
    <div className={`message-bubble ${isOwn ? "own" : "other"}`}>
      <p className="message-content">{message.content}</p>
      <div className="message-meta">
        <span className="message-time">{time}</span>
        {statusIcon()}
      </div>
    </div>
  );
}