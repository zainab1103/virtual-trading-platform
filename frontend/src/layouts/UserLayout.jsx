import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/stocks': 'Stocks',
  '/watchlist': 'Watchlist',
  '/portfolio': 'Portfolio',
  '/orders': 'Orders',
  '/transactions': 'Transactions',
  '/pnl': 'Profit & Loss',
  '/profile': 'Profile'
};

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;

  const title = TITLES[location.pathname] || 'Virtual Trading Platform';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <Sidebar variant="user" onLogout={handleLogout} />
      <div className="app-main">
        <Header title={title} userName={user.name} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
