import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';

const orange = '#f97316';
const orangeDark = '#ea580c';

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#111',
        border: '1px solid #222',
        borderRadius: '24px',
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        boxShadow: `0 0 60px rgba(249,115,22,0.1)`,
      }}>
        {/* Logo */}
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⬡</div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '8px' }}>
          AI Interview Coach
        </h1>
        <p style={{ color: '#555', fontSize: '14px', marginBottom: '40px', lineHeight: '1.6' }}>
          Practice behavioral and technical interviews with AI-powered feedback
        </p>

        {/* Features */}
        <div style={{ marginBottom: '40px', textAlign: 'left' }}>
          {[
            { icon: '🎯', text: 'STAR method detection and scoring' },
            { icon: '🎤', text: 'Audio recording with Whisper transcription' },
            { icon: '✨', text: 'AI-generated questions with Groq' },
            { icon: '📊', text: 'Personal history and improvement tracking' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 0',
              borderBottom: i < 3 ? '1px solid #1a1a1a' : 'none',
            }}>
              <span style={{ fontSize: '18px' }}>{f.icon}</span>
              <span style={{ color: '#888', fontSize: '14px' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#1a0505', border: '1px solid #ef4444',
            borderRadius: '8px', padding: '12px',
            color: '#ef4444', fontSize: '13px', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Google Login Button */}
        <button onClick={handleGoogleLogin} disabled={loading} style={{
          width: '100%', padding: '14px',
          background: loading ? '#1a1a1a' : `linear-gradient(135deg, ${orange}, ${orangeDark})`,
          color: loading ? '#555' : '#000',
          border: 'none', borderRadius: '12px',
          fontSize: '15px', fontWeight: 'bold',
          boxShadow: loading ? 'none' : `0 0 24px rgba(249,115,22,0.4)`,
          transition: 'all 0.2s', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '10px',
        }}>
          {loading ? 'Signing in...' : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p style={{ color: '#333', fontSize: '12px', marginTop: '20px' }}>
          Your data is private and secure. Only you can see your interview history.
        </p>
      </div>
    </div>
  );
}