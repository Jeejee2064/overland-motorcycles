'use client';

import { useState } from 'react';

export default function TestAuthPage() {
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/test-auth', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed');
        setLoading(false);
        return;
      }

      // 🔥 Redirect to PagueloFacil AUTH link
      window.location.href = data.url;
    } catch (err) {
      alert('Error creating AUTH link');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>Test $1000 Deposit Authorization</h1>

      <button
        onClick={handleAuth}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        {loading ? 'Creating link...' : 'Authorize $1000'}
      </button>
    </div>
  );
}