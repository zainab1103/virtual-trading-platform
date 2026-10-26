import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';
import { formatCurrency, formatSigned, formatDate } from '../utils/format';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setData(data);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
    const interval = setInterval(load, 8000); // reflect simulated price movement
    return () => clearInterval(interval);
  }, []);

  if (error) return <div className="form-error">{error}</div>;
  if (!data) return <div className="empty-state">Loading dashboard...</div>;

  const chartData = data.chart.map((c) => ({
    date: new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    value: c.totalValue
  }));

  return (
    <div>
      <div className="cards-grid">
        <SummaryCard label="Available Balance" value={formatCurrency(data.availableBalance)} />
        <SummaryCard label="Invested Amount" value={formatCurrency(data.investedValue)} />
        <SummaryCard label="Portfolio Value" value={formatCurrency(data.portfolioValue)} />
        <SummaryCard
          label="Today's P&L"
          value={formatSigned(data.todaysPnl)}
          tone={data.todaysPnl >= 0 ? 'positive' : 'negative'}
        />
        <SummaryCard
          label="Overall P&L"
          value={formatSigned(data.overallPnl)}
          tone={data.overallPnl >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="panel">
        <h3>Portfolio Value Over Time</h3>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">
            Daily snapshots build up over time — check back after a day of activity to see this chart.
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Recent Orders</h3>
        {data.recentOrders.length === 0 ? (
          <div className="empty-state">No orders yet. Head to the Stocks page to place your first trade.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o, i) => (
                <tr key={i}>
                  <td>{o.symbol}</td>
                  <td>
                    <span className={`badge badge-${o.orderType.toLowerCase()}`}>{o.orderType}</span>
                  </td>
                  <td>{o.quantity}</td>
                  <td>{formatCurrency(o.totalAmount)}</td>
                  <td>{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className="summary-card">
      <div className="summary-label">{label}</div>
      <div className={`summary-value ${tone ? 'tone-' + tone : ''}`}>{value}</div>
    </div>
  );
}
