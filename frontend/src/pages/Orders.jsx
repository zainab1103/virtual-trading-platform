import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders').then(({ data }) => setOrders(data));
  }, []);

  return (
    <div className="panel">
      <table className="data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Stock</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date/Time</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{o.symbol}</td>
              <td>
                <span className={`badge badge-${o.orderType.toLowerCase()}`}>{o.orderType}</span>
              </td>
              <td>{o.quantity}</td>
              <td>{formatCurrency(o.price)}</td>
              <td>{formatCurrency(o.totalAmount)}</td>
              <td>
                <span className="badge badge-completed">{o.status}</span>
              </td>
              <td>{formatDate(o.createdAt)}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={8} className="empty-state">
                No orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
