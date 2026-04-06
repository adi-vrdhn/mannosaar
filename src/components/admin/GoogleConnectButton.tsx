'use client';

import { useState, useEffect } from 'react';

interface GoogleConnectButtonProps {
  onSuccess?: () => void;
}

export default function GoogleConnectButton({ onSuccess }: GoogleConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if Google is already connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/google-auth/check-status', {
          credentials: 'include',
        });
        const data = await response.json();
        setConnected(data.connected);
      } catch (err) {
        console.error('Error checking connection:', err);
      } finally {
        setChecking(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/google-auth/get-url', {
        credentials: 'include', // IMPORTANT: Send session cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Parse detailed error from API
        const errMsg = data.error || 'Failed to get Google auth URL';
        const details = data.details ? ` (${data.details})` : '';
        throw new Error(errMsg + details);
      }

      if (!data.authUrl) {
        throw new Error('No authentication URL returned from server');
      }
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect Google account';
      setError(errorMsg);
      console.error('Google connect error:', err);
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/google-auth/disconnect', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect');
      }

      setConnected(false);
      setLoading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to disconnect Google account';
      setError(errorMsg);
      console.error('Google disconnect error:', err);
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="text-gray-500">Checking connection status...</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Calendar Integration</h3>
          <p className="text-sm text-gray-600 mb-4">
            {connected 
              ? '✅ Your Google account is connected' 
              : 'Connect your Google account to automatically create Google Meet meetings for therapy sessions.'}
            Confirmation emails will be sent to both you and your clients with the meeting link.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
          <p className="font-semibold mb-2">❌ Error: {error}</p>
          {error.includes('GOOGLE_CLIENT_ID') && (
            <div className="text-xs mt-2 bg-white p-2 rounded border border-red-300">
              <p className="font-semibold mb-1">How to Fix:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Follow the setup guide in <code className="bg-gray-200 px-1 rounded">GOOGLE_CALENDAR_SETUP.md</code></li>
                <li>Create Google OAuth credentials</li>
                <li>Add to <code className="bg-gray-200 px-1 rounded">.env.local</code>:
                  <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto">
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
                  </pre>
                </li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          )}
          {error.includes('Unauthorized') && (
            <p className="text-xs mt-2">Please log in as an admin first.</p>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        {!connected ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Connecting...' : '🔗 Connect Google Account'}
          </button>
        ) : (
          <>
            <button
              disabled={true}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg flex items-center gap-2"
            >
              ✅ Connected
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Disconnecting...' : '🔌 Disconnect'}
            </button>
          </>
        )}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">✓ Benefits of Google Calendar:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Automatic Google Meet links for every session</li>
          <li>Confirmation emails sent automatically</li>
          <li>Events added to both calendars</li>
          <li>Clients can add more participants</li>
          <li>No need for Zoom or other video platforms</li>
        </ul>
      </div>
    </div>
  );
}
