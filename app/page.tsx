"use client";
import React, { useState } from 'react';
export default function Home() {
  const [name, setName] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch('/api/vercfunctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unknown error');
      } else {
        setResponse(data);
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div>Hello World.</div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border rounded px-3 py-2 text-black"
          />
          <button
            onClick={handleStart}
            disabled={loading || !name}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Start'}
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          {response && (
            <div className="mt-2 bg-gray-100 p-2 rounded text-black">
              {JSON.stringify(response)}
            </div>
          )}
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <div>Footer</div>
      </footer>
    </div>
  );
}
