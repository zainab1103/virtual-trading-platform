import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach the logged-in user's id to every request (simple, JWT-free auth
// appropriate for a localhost college project).
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('vtp_user');
  if (stored) {
    const user = JSON.parse(stored);
    config.headers['x-user-id'] = user.id;
  }
  return config;
});

// Normalize error messages so components can just read err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
