import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const TITLES = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'Users',
  '/admin/stocks': 'Stock Management',
  '/admin/orders': 'All Orders'
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const title = TITLES[location.pathname] || 'Admin Panel';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <Sidebar variant="admin" onLogout={handleLogout} />
      <div className="app-main">
        <Header title={title} userName={user.name} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
