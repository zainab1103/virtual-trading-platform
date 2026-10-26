import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setData(data));
  }, []);

  if (!data) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="cards-grid">
        <SummaryCard label="Total Users" value={data.totalUsers} />
        <SummaryCard label="Total Stocks" value={data.totalStocks} />
        <SummaryCard label="Total Orders" value={data.totalOrders} />
        <SummaryCard label="Total Trading Volume" value={formatCurrency(data.totalVolume)} />
      </div>

      <div className="panel">
        <h3>Recent Activity</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Stock</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.userName}</td>
                <td>{o.symbol}</td>
                <td>
                  <span className={`badge badge-${o.orderType.toLowerCase()}`}>{o.orderType}</span>
                </td>
                <td>{o.quantity}</td>
                <td>{formatCurrency(o.totalAmount)}</td>
                <td>{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {data.recentOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="summary-card">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
    </div>
  );
}
