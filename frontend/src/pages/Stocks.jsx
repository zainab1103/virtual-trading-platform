import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatPct } from '../utils/format';
import TradeModal from '../components/TradeModal';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';

export default function Stocks() {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [tradeState, setTradeState] = useState(null); // { stock, type }
  const { toast, showToast, clearToast } = useToast();

  const loadStocks = useCallback(async () => {
    const params = {};
    if (search) params.search = search;
    if (sort) params.sort = sort;
    const { data } = await api.get('/stocks', { params });
    setStocks(data);
  }, [search, sort]);

  const loadWatchlist = useCallback(async () => {
    const { data } = await api.get('/watchlist');
    setWatchlistIds(new Set(data.map((w) => w.stockId)));
  }, []);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  useEffect(() => {
    const interval = setInterval(loadStocks, 6000); // reflect simulated price movement
    return () => clearInterval(interval);
  }, [loadStocks]);

  const toggleWatchlist = async (stock) => {
    try {
      if (watchlistIds.has(stock.id)) {
        await api.delete(`/watchlist/${stock.id}`);
        showToast(`Removed ${stock.symbol} from watchlist.`);
      } else {
        await api.post('/watchlist', { stockId: stock.id });
        showToast(`⭐ Added ${stock.symbol} to watchlist.`);
      }
      loadWatchlist();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleTrade = async (quantity) => {
    const { stock, type } = tradeState;
    const endpoint = type === 'BUY' ? '/orders/buy' : '/orders/sell';
    const { data } = await api.post(endpoint, { stockId: stock.id, quantity });
    showToast(data.message);
    setTradeState(null);
    loadStocks();
  };

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name or symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

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
          {stocks.map((s) => (
            <tr key={s.id}>
              <td>{s.companyName}</td>
              <td>
                <Link to={`/stocks/${s.id}`} className="symbol-link">
                  {s.symbol}
                </Link>
              </td>
              <td>{formatCurrency(s.currentPrice)}</td>
              <td className={s.change >= 0 ? 'tone-positive' : 'tone-negative'}>
                {formatPct(s.changePct)}
              </td>
              <td className="row-actions">
                <Link to={`/stocks/${s.id}`} className="btn btn-sm btn-secondary">
                  View
                </Link>
                <button className="btn btn-sm btn-buy" onClick={() => setTradeState({ stock: s, type: 'BUY' })}>
                  Buy
                </button>
                <button className="btn btn-sm btn-sell" onClick={() => setTradeState({ stock: s, type: 'SELL' })}>
                  Sell
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => toggleWatchlist(s)}>
                  {watchlistIds.has(s.id) ? '★' : '☆'}
                </button>
              </td>
            </tr>
          ))}
          {stocks.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">
                No stocks found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {tradeState && (
        <TradeModal
          stock={tradeState.stock}
          type={tradeState.type}
          onClose={() => setTradeState(null)}
          onSubmit={handleTrade}
        />
      )}
    </div>
  );
}
