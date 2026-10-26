import { useState } from 'react';
import { formatCurrency } from '../utils/format';

// Shared Buy/Sell dialog — works for any stock, driven purely by props.
export default function TradeModal({ stock, type, onClose, onSubmit }) {
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const qty = Number(quantity) || 0;
  const total = qty * stock.currentPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (qty <= 0 || !Number.isInteger(qty)) {
      setError('Enter a valid whole number of shares.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(qty);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {type === 'BUY' ? 'Buy' : 'Sell'} {stock.symbol}
        </h2>
        <p className="muted">{stock.companyName}</p>

        <div className="modal-row">
          <span>Current Price</span>
          <strong>{formatCurrency(stock.currentPrice)}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
            />
          </label>

          <div className="modal-row total-row">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={type === 'BUY' ? 'btn btn-buy' : 'btn btn-sell'}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : type === 'BUY' ? 'Buy' : 'Sell'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
