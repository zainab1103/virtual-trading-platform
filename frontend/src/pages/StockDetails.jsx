import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatPct } from '../utils/format';
import PriceChart from '../components/PriceChart';
import TradeModal from '../components/TradeModal';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';

export default function StockDetails() {
  const { id } = useParams();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [tradeType, setTradeType] = useState(null);
  const { toast, showToast, clearToast } = useToast();

  const loadStock = useCallback(async () => {
    const { data } = await api.get(`/stocks/${id}`);
    setStock(data);
  }, [id]);

  const loadHistory = useCallback(async () => {
    const { data } = await api.get(`/stocks/${id}/prices`);
    setHistory(data);
  }, [id]);

  const loadWatchlist = useCallback(async () => {
    const { data } = await api.get('/watchlist');
    setInWatchlist(data.some((w) => w.stockId === Number(id)));
  }, [id]);

  useEffect(() => {
    loadStock();
    loadHistory();
    loadWatchlist();
  }, [loadStock, loadHistory, loadWatchlist]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadStock();
      loadHistory();
    }, 6000);
    return () => clearInterval(interval);
  }, [loadStock, loadHistory]);

  const toggleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${id}`);
        showToast(`Removed ${stock.symbol} from watchlist.`);
      } else {
        await api.post('/watchlist', { stockId: Number(id) });
        showToast(`⭐ Added ${stock.symbol} to watchlist.`);
      }
      loadWatchlist();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleTrade = async (quantity) => {
    const endpoint = tradeType === 'BUY' ? '/orders/buy' : '/orders/sell';
    const { data } = await api.post(endpoint, { stockId: Number(id), quantity });
    showToast(data.message);
    setTradeType(null);
    loadStock();
  };

  if (!stock) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />

      <div className="panel">
        <div className="stock-header">
          <div>
            <h2>{stock.companyName}</h2>
            <p className="muted">{stock.symbol}</p>
          </div>
          <div className="stock-price-block">
            <div className="stock-price">{formatCurrency(stock.currentPrice)}</div>
            <div className={stock.change >= 0 ? 'tone-positive' : 'tone-negative'}>
              {formatPct(stock.changePct)}
            </div>
          </div>
        </div>

        <div className="stock-actions">
          <button className="btn btn-buy" onClick={() => setTradeType('BUY')}>
            Buy
          </button>
          <button className="btn btn-sell" onClick={() => setTradeType('SELL')}>
            Sell
          </button>
          <button className="btn btn-secondary" onClick={toggleWatchlist}>
            {inWatchlist ? '★ Remove from Watchlist' : '☆ Add to Watchlist'}
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Price Chart</h3>
        <PriceChart data={history} />
      </div>

      <div className="panel">
        <h3>Stock Details</h3>
        <div className="details-grid">
          <Detail label="Open Price" value={formatCurrency(stock.openPrice)} />
          <Detail label="Day High" value={formatCurrency(stock.dayHigh)} />
          <Detail label="Day Low" value={formatCurrency(stock.dayLow)} />
          <Detail label="Previous Close" value={formatCurrency(stock.previousClose)} />
          <Detail label="Volume" value={stock.volume?.toLocaleString('en-IN')} />
        </div>
        {stock.description && <p className="stock-description">{stock.description}</p>}
      </div>

      {tradeType && (
        <TradeModal
          stock={stock}
          type={tradeType}
          onClose={() => setTradeType(null)}
          onSubmit={handleTrade}
        />
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}
