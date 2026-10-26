import { NavLink } from 'react-router-dom';

const USER_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/stocks', label: 'Stocks', icon: '📈' },
  { to: '/watchlist', label: 'Watchlist', icon: '⭐' },
  { to: '/portfolio', label: 'Portfolio', icon: '💼' },
  { to: '/orders', label: 'Orders', icon: '🧾' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/pnl', label: 'P&L', icon: '📉' },
  { to: '/profile', label: 'Profile', icon: '👤' }
];

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/stocks', label: 'Stocks', icon: '📈' },
  { to: '/admin/orders', label: 'Orders', icon: '🧾' }
];

export default function Sidebar({ variant = 'user', onLogout }) {
  const links = variant === 'admin' ? ADMIN_LINKS : USER_LINKS;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">💹</span>
        <span>VTP {variant === 'admin' ? 'Admin' : ''}</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
        <button className="sidebar-link logout-btn" onClick={onLogout}>
          <span className="sidebar-icon">🚪</span>
          Logout
        </button>
      </nav>
    </aside>
  );
}
