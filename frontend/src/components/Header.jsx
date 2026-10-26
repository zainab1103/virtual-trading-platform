export default function Header({ title, userName }) {
  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="topbar-user">
        <span className="avatar">{(userName || '?').charAt(0).toUpperCase()}</span>
        <span>{userName}</span>
      </div>
    </header>
  );
}
