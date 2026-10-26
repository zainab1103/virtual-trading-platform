import { useEffect } from 'react';

// Simple temporary success/error message, per project spec (no dedicated
// notifications module — just a toast after Buy/Sell/etc actions).
export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="alert">
      {message}
    </div>
  );
}
