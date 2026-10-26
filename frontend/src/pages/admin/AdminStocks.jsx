import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';

const emptyForm = { companyName: '', symbol: '', initialPrice: '', description: '' };

export default function AdminStocks() {
  const [stocks, setStocks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const { toast, showToast, clearToast } = useToast();

  const load = useCallback(async () => {
    const { data } = await api.get('/admin/stocks');
    setStocks(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/stocks', form);
      showToast(`✅ ${form.symbol.toUpperCase()} added — it will appear on the user Stocks page and join the automatic price simulation immediately.`);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (stock) => {
    setEditingId(stock.id);
  };

  const saveEdit = async (id, companyName, description, status) => {
    try {
      await api.put(`/admin/stocks/${id}`, { companyName, description, status });
      showToast('Stock updated successfully.');
      setEditingId(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id, symbol) => {
    if (!window.confirm(`Deactivate ${symbol}? Users will no longer be able to trade it.`)) return;
    try {
      await api.delete(`/admin/stocks/${id}`);
      showToast(`${symbol} deactivated.`);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />

      <div className="panel">
        <h3>Add Stock</h3>
        <form className="inline-form" onSubmit={handleAdd}>
          <input name="companyName" placeholder="Company Name" value={form.companyName} onChange={handleChange} required />
          <input name="symbol" placeholder="Symbol" value={form.symbol} onChange={handleChange} required />
          <input
            name="initialPrice"
            type="number"
            step="0.01"
            placeholder="Initial Price"
            value={form.initialPrice}
            onChange={handleChange}
            required
          />
          <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
          <button type="submit" className="btn btn-primary">
            Add Stock
          </button>
        </form>
        {error && <div className="form-error">{error}</div>}
      </div>

      <div className="panel">
        <h3>All Stocks</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Symbol</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) =>
              editingId === s.id ? (
                <EditRow key={s.id} stock={s} onSave={saveEdit} onCancel={() => setEditingId(null)} />
              ) : (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td>{s.companyName}</td>
                  <td>{s.symbol}</td>
                  <td>{formatCurrency(s.currentPrice)}</td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-completed' : 'badge-sell'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>{formatDate(s.createdAt)}</td>
                  <td className="row-actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => startEdit(s)}>
                      Edit
                    </button>
                    {s.status === 'active' && (
                      <button className="btn btn-sm btn-sell" onClick={() => handleDelete(s.id, s.symbol)}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              )
            )}
            {stocks.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  No stocks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditRow({ stock, onSave, onCancel }) {
  const [companyName, setCompanyName] = useState(stock.companyName);
  const [description, setDescription] = useState(stock.description || '');
  const [status, setStatus] = useState(stock.status);

  return (
    <tr>
      <td>#{stock.id}</td>
      <td>
        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      </td>
      <td>{stock.symbol}</td>
      <td>{formatCurrency(stock.currentPrice)}</td>
      <td>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </td>
      <td>{formatDate(stock.createdAt)}</td>
      <td className="row-actions">
        <button
          className="btn btn-sm btn-buy"
          onClick={() => onSave(stock.id, companyName, description, status)}
        >
          Save
        </button>
        <button className="btn btn-sm btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </td>
    </tr>
  );
}
