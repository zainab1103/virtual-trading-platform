import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/format';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/admin/users').then(({ data }) => setUsers(data));
  }, []);

  return (
    <div className="panel">
      <table className="data-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Registration Date</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>#{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className={`badge ${u.status === 'active' ? 'badge-completed' : 'badge-sell'}`}>
                  {u.status}
                </span>
              </td>
              <td>{formatDate(u.registeredAt)}</td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">
                No registered users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
