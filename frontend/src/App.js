import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Home from './pages/Home';
import History from './pages/History';
import Login from './pages/Login';
import './index.css';
import Tips from './pages/Tips';

const orange = '#f97316';

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      orange: Math.random() > 0.5,
    }));
    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.orange
          ? `rgba(249, 115, 22, ${p.alpha})`
          : `rgba(255, 255, 255, ${p.alpha * 0.4})`;
        ctx.fill();
        if (p.orange && p.r > 1.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(249, 115, 22, 0.03)`;
          ctx.fill();
        }
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

function App() {
  const [user, setUser]   = useState(null);
  const [page, setPage]   = useState('home');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setPage('home');
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#000',
      }}>
        <div style={{ color: orange, fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <ParticleCanvas />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {!user ? (
          <Login onLogin={setUser} />
        ) : (
          <>
            {/* Navigation */}
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid #222',
              padding: '12px 40px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 200,
            }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  <span style={{ color: orange }}>⬡</span> AI Interview Coach
                </h1>
                <p style={{ color: '#555', fontSize: '12px', marginTop: '2px' }}>
                  Behavioral + Technical Analysis
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {[
                  { id: 'home',    label: '🎯 Practice' },
                  { id: 'history', label: '📊 History'  },
                  { id: 'tips',    label: '💡 Tips'     },
                ].map(({ id, label }) => (
                  <button key={id} onClick={() => setPage(id)} style={{
                    padding: '8px 18px', borderRadius: '8px',
                    background: page === id ? orange : 'transparent',
                    color: page === id ? '#000' : '#555',
                    border: `1px solid ${page === id ? orange : '#333'}`,
                    fontWeight: page === id ? 'bold' : 'normal',
                    fontSize: '13px',
                    boxShadow: page === id ? `0 0 12px rgba(249,115,22,0.3)` : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {label}
                  </button>
                ))}

                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${orange}` }}
                  />
                  <span style={{ color: '#888', fontSize: '13px' }}>
                    {user.displayName?.split(' ')[0]}
                  </span>
                </div>

                <button onClick={handleLogout} style={{
                  padding: '8px 14px', borderRadius: '8px',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef444444',
                  fontSize: '13px',
                  transition: 'all 0.2s',
                }}>
                  Logout
                </button>
              </div>
            </div>

            {/* Page Content */}
            <div style={{ paddingTop: '70px' }}>
              {page === 'home'    && <Home user={user} />}
              {page === 'history' && <History user={user} />}
              {page === 'tips'    && <Tips user={user} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;