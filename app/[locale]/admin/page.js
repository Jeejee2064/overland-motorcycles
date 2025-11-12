'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const correctPassword = 'RoyaleMotoPanama!'; // 🔒 change this

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === correctPassword) {
      router.push('/admin/ok');
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-80 text-center"
      >
        <h1 className="text-xl font-semibold mb-4">Enter Password</h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 mb-3 text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Password"
        />

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 rounded-lg"
        >
          Submit
        </button>
      </form>
    </main>
  );
}
