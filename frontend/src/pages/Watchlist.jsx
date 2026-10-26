import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatPct } from '../utils/format';
import TradeModal from '../components/TradeModal';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [tradeStock, setTradeStock] = useState(null);
  const { toast, showToast, clearToast } = useToast();

  const load = useCallback(async () => {
    const { data } = await api.get('/watchlist');
    setItems(data);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, [load]);

  const remove = async (stockId, symbol) => {
    await api.delete(`/watchlist/${stockId}`);
    showToast(`Removed ${symbol} from watchlist.`);
    load();
  };

  const handleTrade = async (quantity) => {
    const { data } = await api.post('/orders/buy', { stockId: tradeStock.stockId, quantity });
    showToast(data.message);
    setTradeStock(null);
    load();
  };

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />

      <table className="data-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.watchlistId}>
              <td>{s.companyName}</td>
              <td>
                <Link to={`/stocks/${s.stockId}`} className="symbol-link">
                  {s.symbol}
                </Link>
              </td>
              <td>{formatCurrency(s.currentPrice)}</td>
              <td className={s.change >= 0 ? 'tone-positive' : 'tone-negative'}>
                {formatPct(s.changePct)}
              </td>
              <td className="row-actions">
                <Link to={`/stocks/${s.stockId}`} className="btn btn-sm btn-secondary">
                  View
                </Link>
                <button
                  className="btn btn-sm btn-buy"
                  onClick={() =>
                    setTradeStock({ stockId: s.stockId, symbol: s.symbol, companyName: s.companyName, currentPrice: s.currentPrice })
                  }
                >
                  Buy
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => remove(s.stockId, s.symbol)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">
                Your watchlist is empty. Add stocks from the Stocks page.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {tradeStock && (
        <TradeModal
          stock={tradeStock}
          type="BUY"
          onClose={() => setTradeStock(null)}
          onSubmit={handleTrade}
        />
      )}
    </div>
  );
}
