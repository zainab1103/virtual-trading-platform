import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/profile').then(({ data }) => setProfile(data));
  }, []);

  if (!profile) return <div className="empty-state">Loading profile...</div>;

  return (
    <div className="panel profile-panel">
      <div className="profile-avatar">{profile.name.charAt(0).toUpperCase()}</div>
      <h2>{profile.name}</h2>

      <div className="details-grid">
        <Detail label="Email" value={profile.email} />
        <Detail label="Account Status" value={profile.status} />
        <Detail label="Virtual Starting Balance" value={formatCurrency(profile.startingBalance)} />
        <Detail label="Registration Date" value={formatDate(profile.registeredAt)} />
      </div>
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
