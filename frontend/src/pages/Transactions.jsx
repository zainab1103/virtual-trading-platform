import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatSigned, formatDate } from '../utils/format';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    api.get('/transactions').then(({ data }) => setTransactions(data));
  }, []);

  return (
    <div className="panel">
      <table className="data-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Type</th>
            <th>Stock</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Date/Time</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>#{t.id}</td>
              <td>
                <span className={`badge badge-${t.type.toLowerCase()}`}>{t.type}</span>
              </td>
              <td>{t.symbol || '-'}</td>
              <td className={t.amount >= 0 ? 'tone-positive' : 'tone-negative'}>
                {formatSigned(t.amount)}
              </td>
              <td>{t.description}</td>
              <td>{formatDate(t.createdAt)}</td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={6} className="empty-state">
                No transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
