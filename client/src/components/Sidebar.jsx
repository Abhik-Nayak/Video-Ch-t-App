export default function Sidebar({ users, selectedUser, onSelect }) {
  return (
    <div className="sidebar">
      <h3>Chats</h3>
      <ul className="user-list">
        {users.map((u) => (
          <li
            key={u._id}
            className={`user-item ${selectedUser?._id === u._id ? "active" : ""}`}
            onClick={() => onSelect(u)}
          >
            <span className={`status-dot ${u.isOnline ? "online" : "offline"}`} />
            <span className="user-name">{u.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}