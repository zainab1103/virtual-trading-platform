import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Generic chart driven entirely by the stock_prices history passed in —
// works for any stock, including ones the admin just added, with no
// stock-specific code.
export default function PriceChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">No price history yet.</div>;
  }

  const chartData = data.map((d) => ({
    time: new Date(d.recordedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    price: d.price
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={20} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={70} />
        <Tooltip formatter={(v) => `₹${v}`} />
        <Line type="monotone" dataKey="price" stroke="var(--accent)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
