import { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatPct, formatSigned } from '../utils/format';
import TradeModal from '../components/TradeModal';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6'];

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tradeState, setTradeState] = useState(null); // { holding, type }
  const { toast, showToast, clearToast } = useToast();

  const load = useCallback(async () => {
    const [holdingsRes, summaryRes] = await Promise.all([
      api.get('/portfolio'),
      api.get('/portfolio/summary')
    ]);
    setHoldings(holdingsRes.data);
    setSummary(summaryRes.data);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000); // reflects simulated price movement
    return () => clearInterval(interval);
  }, [load]);

  const handleTrade = async (quantity) => {
    const { holding, type } = tradeState;
    const endpoint = type === 'BUY' ? '/orders/buy' : '/orders/sell';
    const { data } = await api.post(endpoint, { stockId: holding.stockId, quantity });
    showToast(data.message);
    setTradeState(null);
    load();
  };

  if (!summary) return <div className="empty-state">Loading portfolio...</div>;

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />

      <div className="cards-grid">
        <SummaryCard label="Invested Value" value={formatCurrency(summary.investedValue)} />
        <SummaryCard label="Current Value" value={formatCurrency(summary.portfolioValue)} />
        <SummaryCard
          label="Unrealized P&L"
          value={formatSigned(summary.unrealizedPnl)}
          tone={summary.unrealizedPnl >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="panel">
        <h3>Portfolio Allocation</h3>
        {summary.allocation.length === 0 ? (
          <div className="empty-state">You don't own any stocks yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={summary.allocation}
                dataKey="percentage"
                nameKey="symbol"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ symbol, percentage }) => `${symbol} ${percentage.toFixed(0)}%`}
              >
                {summary.allocation.map((entry, i) => (
                  <Cell key={entry.symbol} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="panel">
        <h3>Holdings</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Stock</th>
              <th>Qty</th>
              <th>Avg Buy Price</th>
              <th>Current Price</th>
              <th>Invested</th>
              <th>Current Value</th>
              <th>P&L</th>
              <th>P&L %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.id}>
                <td>
                  <Link to={`/stocks/${h.stockId}`} className="symbol-link">
                    {h.symbol}
                  </Link>
                </td>
                <td>{h.quantity}</td>
                <td>{formatCurrency(h.averageBuyPrice)}</td>
                <td>{formatCurrency(h.currentPrice)}</td>
                <td>{formatCurrency(h.investedValue)}</td>
                <td>{formatCurrency(h.currentValue)}</td>
                <td className={h.pnl >= 0 ? 'tone-positive' : 'tone-negative'}>
                  {formatSigned(h.pnl)}
                </td>
                <td className={h.pnlPct >= 0 ? 'tone-positive' : 'tone-negative'}>
                  {formatPct(h.pnlPct)}
                </td>
                <td className="row-actions">
                  <button
                    className="btn btn-sm btn-buy"
                    onClick={() => setTradeState({ holding: h, type: 'BUY' })}
                  >
                    Buy
                  </button>
                  <button
                    className="btn btn-sm btn-sell"
                    onClick={() => setTradeState({ holding: h, type: 'SELL' })}
                  >
                    Sell
                  </button>
                </td>
              </tr>
            ))}
            {holdings.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-state">
                  No holdings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {tradeState && (
        <TradeModal
          stock={{
            symbol: tradeState.holding.symbol,
            companyName: tradeState.holding.companyName,
            currentPrice: tradeState.holding.currentPrice
          }}
          type={tradeState.type}
          onClose={() => setTradeState(null)}
          onSubmit={handleTrade}
        />
      )}
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
