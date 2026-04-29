import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';

const orange = '#f97316';
const card = '#111111';
const cardBorder = '#222222';

export default function History({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []); // eslint-disable-line

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users', user.uid, 'history'),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(items);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const q = query(collection(db, 'users', user.uid, 'history'));
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'history', d.id))));
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const getScoreColor = (s) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return orange;
    return '#ef4444';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: orange, fontSize: '18px' }}>Loading history...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>📭</div>
          <h2 style={{ color: '#555', fontSize: '20px', marginBottom: '8px' }}>No history yet</h2>
          <p style={{ color: '#333', fontSize: '14px' }}>Complete an interview analysis to see your history here.</p>
        </div>
      </div>
    );
  }

  const avgScore = Math.round(history.reduce((sum, h) => sum + h.final_score, 0) / history.length);
  const avgStructure = Math.round(history.reduce((sum, h) => sum + (h.breakdown?.structure || 0), 0) / history.length);
  const avgContent = Math.round(history.reduce((sum, h) => sum + (h.breakdown?.content || 0), 0) / history.length);
  const avgConfidence = Math.round(history.reduce((sum, h) => sum + (h.breakdown?.confidence || 0), 0) / history.length);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
              <span style={{ color: orange }}>📊</span> Interview History
            </h2>
            <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>
              {history.length} attempt{history.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <button onClick={clearHistory} style={{
            padding: '8px 16px',
            background: '#1a0505',
            color: '#ef4444',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
          }}>
            🗑 Clear All
          </button>
        </div>

        {/* Average Stats */}
        <div style={{
          background: card, border: `1px solid ${cardBorder}`,
          borderRadius: '16px', padding: '24px', marginBottom: '24px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
        }}>
          {[
            { label: 'Avg Score',      value: avgScore },
            { label: 'Avg Structure',  value: avgStructure },
            { label: 'Avg Content',    value: avgContent },
            { label: 'Avg Confidence', value: avgConfidence },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ color: '#555', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: getScoreColor(stat.value),
                textShadow: `0 0 20px ${getScoreColor(stat.value)}44` }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Score Trend */}
        <div style={{
          background: card, border: `1px solid ${cardBorder}`,
          borderRadius: '16px', padding: '24px', marginBottom: '24px',
        }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Score Trend
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
            {[...history].reverse().slice(-10).map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '100%',
                  height: `${h.final_score * 0.7}px`,
                  background: getScoreColor(h.final_score),
                  borderRadius: '4px 4px 0 0',
                  boxShadow: `0 0 8px ${getScoreColor(h.final_score)}44`,
                  transition: 'height 0.5s ease',
                }} />
                <div style={{ color: '#333', fontSize: '10px' }}>{h.final_score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* History List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((item, i) => (
            <div key={item.id} style={{
              background: card, border: `1px solid ${cardBorder}`,
              borderRadius: '16px', padding: '24px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(249,115,22,0.1)', border: `1px solid ${orange}`,
                      borderRadius: '6px', padding: '2px 10px',
                      color: orange, fontSize: '12px', textTransform: 'capitalize',
                    }}>
                      {item.question_type}
                    </span>
                    <span style={{
                      background: '#1a1a1a', border: '1px solid #333',
                      borderRadius: '6px', padding: '2px 10px',
                      color: '#555', fontSize: '12px', textTransform: 'capitalize',
                    }}>
                      {item.field}
                    </span>
                    <span style={{
                      background: '#1a1a1a', border: '1px solid #333',
                      borderRadius: '6px', padding: '2px 10px',
                      color: '#555', fontSize: '12px', textTransform: 'capitalize',
                    }}>
                      {item.difficulty}
                    </span>
                  </div>
                  <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.5' }}>
                    {item.question}
                  </p>
                </div>
                <div style={{
                  fontSize: '40px', fontWeight: 'bold',
                  color: getScoreColor(item.final_score),
                  marginLeft: '20px', minWidth: '60px', textAlign: 'right',
                  textShadow: `0 0 20px ${getScoreColor(item.final_score)}44`,
                }}>
                  {item.final_score}
                </div>
              </div>

              {/* Score Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {Object.entries(item.breakdown || {}).map(([key, val]) => (
                  <div key={key} style={{
                    background: '#0a0a0a', borderRadius: '8px', padding: '10px', textAlign: 'center',
                  }}>
                    <div style={{ color: '#444', fontSize: '11px', marginBottom: '4px', textTransform: 'capitalize' }}>
                      {key}
                    </div>
                    <div style={{ color: getScoreColor(val), fontSize: '18px', fontWeight: 'bold' }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback Preview */}
              {item.feedback?.slice(0, 2).map((f, fi) => {
                const colors = { error: '#ef4444', warning: orange, success: '#22c55e' };
                const icons = { error: '✗', warning: '⚠', success: '✓' };
                return (
                  <div key={fi} style={{
                    color: colors[f.type] || orange,
                    fontSize: '13px', marginBottom: '4px',
                  }}>
                    {icons[f.type]} {f.message}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}