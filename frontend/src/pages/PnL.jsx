import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api from '../services/api';
import { formatSigned } from '../utils/format';

export default function PnL() {
  const [pnl, setPnl] = useState(null);

  useEffect(() => {
    const load = () => api.get('/pnl').then(({ data }) => setPnl(data));
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!pnl) return <div className="empty-state">Loading P&L...</div>;

  const chartData = [
    { label: "Today's P&L", value: pnl.todaysPnl },
    { label: 'Realized P&L', value: pnl.realizedPnl },
    { label: 'Unrealized P&L', value: pnl.unrealizedPnl },
    { label: 'Overall P&L', value: pnl.overallPnl }
  ];

  return (
    <div>
      <div className="cards-grid">
        <SummaryCard label="Today's P&L" value={formatSigned(pnl.todaysPnl)} tone={pnl.todaysPnl >= 0 ? 'positive' : 'negative'} />
        <SummaryCard label="Overall P&L" value={formatSigned(pnl.overallPnl)} tone={pnl.overallPnl >= 0 ? 'positive' : 'negative'} />
        <SummaryCard label="Realized P&L" value={formatSigned(pnl.realizedPnl)} tone={pnl.realizedPnl >= 0 ? 'positive' : 'negative'} />
        <SummaryCard label="Unrealized P&L" value={formatSigned(pnl.unrealizedPnl)} tone={pnl.unrealizedPnl >= 0 ? 'positive' : 'negative'} />
      </div>

      <div className="panel">
        <h3>P&L Breakdown</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={80} />
            <Tooltip formatter={(v) => formatSigned(v)} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.value >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
