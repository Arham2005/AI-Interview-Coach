import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';

const orange = '#f97316';
const card = '#111111';
const cardBorder = '#222222';

function RadarChart({ data }) {
  const size = 200;
  const center = size / 2;
  const radius = 75;
  const levels = 5;
  const metrics = ['Structure', 'Content', 'Confidence', 'Clarity'];
  const values = [
    data.structure / 100,
    data.content / 100,
    data.confidence / 100,
    data.clarity / 100,
  ];

  const angleStep = (Math.PI * 2) / metrics.length;

  const getPoint = (angle, r) => ({
    x: center + r * Math.sin(angle),
    y: center - r * Math.cos(angle),
  });

  const gridLines = Array.from({ length: levels }, (_, i) => {
    const r = (radius / levels) * (i + 1);
    const points = metrics.map((_, j) => {
      const p = getPoint(angleStep * j, r);
      return `${p.x},${p.y}`;
    }).join(' ');
    return <polygon key={i} points={points} fill="none" stroke="#222" strokeWidth="1" />;
  });

  const axisLines = metrics.map((_, i) => {
    const p = getPoint(angleStep * i, radius);
    return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#333" strokeWidth="1" />;
  });

  const dataPoints = values.map((v, i) => {
    const p = getPoint(angleStep * i, radius * v);
    return `${p.x},${p.y}`;
  }).join(' ');

  const labels = metrics.map((label, i) => {
    const p = getPoint(angleStep * i, radius + 18);
    return (
      <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
        fill="#888" fontSize="10" fontFamily="Arial">
        {label}
      </text>
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLines}
      {axisLines}
      <polygon points={dataPoints} fill="rgba(249,115,22,0.2)" stroke={orange} strokeWidth="2" />
      {values.map((v, i) => {
        const p = getPoint(angleStep * i, radius * v);
        return <circle key={i} cx={p.x} cy={p.y} r="3" fill={orange} />;
      })}
      {labels}
    </svg>
  );
}

function ScoreTrendChart({ scores }) {
  const maxScore = 100;
  const chartH = 100;
  const chartW = 400;
  const padding = 10;

  if (scores.length < 2) return (
    <div style={{ color: '#333', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
      Complete more attempts to see your trend.
    </div>
  );

  const pts = scores.map((s, i) => ({
    x: padding + (i / (scores.length - 1)) * (chartW - padding * 2),
    y: chartH - padding - ((s / maxScore) * (chartH - padding * 2)),
    score: s,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaD = `M ${pts[0].x} ${chartH} ` +
    pts.map(p => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${pts[pts.length-1].x} ${chartH} Z`;

  const getColor = (s) => s >= 80 ? '#22c55e' : s >= 60 ? orange : '#ef4444';

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
      {/* Grid lines */}
      {[25, 50, 75].map(y => {
        const cy = chartH - padding - ((y / maxScore) * (chartH - padding * 2));
        return (
          <g key={y}>
            <line x1={padding} y1={cy} x2={chartW - padding} y2={cy} stroke="#1a1a1a" strokeWidth="1" strokeDasharray="4,4" />
            <text x={padding - 2} y={cy} textAnchor="end" fill="#333" fontSize="8" dominantBaseline="middle">{y}</text>
          </g>
        );
      })}
      {/* Area fill */}
      <path d={areaD} fill="rgba(249,115,22,0.08)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke={orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={getColor(p.score)} stroke="#000" strokeWidth="1" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fill={getColor(p.score)} fontSize="9">{p.score}</text>
        </g>
      ))}
    </svg>
  );
}

export default function History({ user }) {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchHistory(); }, []); // eslint-disable-line

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users', user.uid, 'history'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
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
    } catch (err) { console.error(err); }
  };

  const getScoreColor = (s) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return orange;
    return '#ef4444';
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: orange, fontSize: '18px' }}>Loading history...</div>
    </div>
  );

  if (history.length === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>📭</div>
        <h2 style={{ color: '#555', fontSize: '20px', marginBottom: '8px' }}>No history yet</h2>
        <p style={{ color: '#333', fontSize: '14px' }}>Complete an interview analysis to see your history here.</p>
      </div>
    </div>
  );

  // Analytics
  const scores        = [...history].reverse().map(h => h.final_score);
  const avgScore      = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const avgStructure  = Math.round(history.reduce((s, h) => s + (h.breakdown?.structure || 0), 0) / history.length);
  const avgContent    = Math.round(history.reduce((s, h) => s + (h.breakdown?.content || 0), 0) / history.length);
  const avgConfidence = Math.round(history.reduce((s, h) => s + (h.breakdown?.confidence || 0), 0) / history.length);
  const avgClarity    = Math.round(history.reduce((s, h) => s + (h.breakdown?.clarity || 0), 0) / history.length);

  // Streak
  let streak = 0;
  for (let i = 0; i < scores.length - 1; i++) {
    if (scores[i] > scores[i + 1]) streak++;
    else break;
  }

  // Best and worst
  const bestScore  = Math.max(...scores);
  const worstScore = Math.min(...scores);

  // Most common mistakes
  const mistakeCount = {};
  history.forEach(h => {
    h.feedback?.filter(f => f.type === 'error' || f.type === 'warning').forEach(f => {
      const key = f.message.substring(0, 50);
      mistakeCount[key] = (mistakeCount[key] || 0) + 1;
    });
  });
  const topMistakes = Object.entries(mistakeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Field performance
  const fieldScores = {};
  history.forEach(h => {
    if (h.field) {
      if (!fieldScores[h.field]) fieldScores[h.field] = [];
      fieldScores[h.field].push(h.final_score);
    }
  });
  const fieldAvg = Object.entries(fieldScores).map(([field, scores]) => ({
    field,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    count: scores.length,
  })).sort((a, b) => b.avg - a.avg);

  const tabs = ['overview', 'attempts'];

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
              <span style={{ color: orange }}>📊</span> Interview History
            </h2>
            <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>
              {history.length} attempt{history.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <button onClick={clearHistory} style={{
            padding: '8px 16px', background: '#1a0505',
            color: '#ef4444', border: '1px solid #ef4444',
            borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
          }}>
            🗑 Clear All
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '24px',
          background: '#111', border: '1px solid #222',
          borderRadius: '12px', padding: '4px',
        }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              background: activeTab === t ? orange : 'transparent',
              color: activeTab === t ? '#000' : '#555',
              fontWeight: activeTab === t ? 'bold' : 'normal',
              fontSize: '14px', textTransform: 'capitalize',
              border: 'none', cursor: 'pointer',
              boxShadow: activeTab === t ? `0 0 14px rgba(249,115,22,0.4)` : 'none',
              transition: 'all 0.2s',
            }}>
              {t === 'overview' ? '📈 Overview' : '📋 All Attempts'}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>

            {/* Key Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px', marginBottom: '20px',
            }}>
              {[
                { label: 'Avg Score',   value: avgScore,   icon: '🎯' },
                { label: 'Best Score',  value: bestScore,  icon: '🏆' },
                { label: 'Worst Score', value: worstScore, icon: '📉' },
                { label: 'Imp. Streak', value: streak,     icon: '🔥' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: card, border: `1px solid ${cardBorder}`,
                  borderRadius: '12px', padding: '16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                  <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: getScoreColor(stat.value) }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Score Trend + Radar */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              gap: '16px', marginBottom: '20px',
            }}>
              <div style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '24px',
              }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Score Trend
                </p>
                <ScoreTrendChart scores={scores.slice(-10)} />
              </div>

              <div style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Avg Performance
                </p>
                <RadarChart data={{
                  structure: avgStructure, content: avgContent,
                  confidence: avgConfidence, clarity: avgClarity,
                }} />
              </div>
            </div>

            {/* Top Mistakes */}
            {topMistakes.length > 0 && (
              <div style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '24px', marginBottom: '20px',
              }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  🔁 Most Common Mistakes
                </p>
                {topMistakes.map(([mistake, count], i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 0',
                    borderBottom: i < topMistakes.length - 1 ? '1px solid #1a1a1a' : 'none',
                  }}>
                    <div style={{
                      minWidth: '24px', height: '24px', borderRadius: '50%',
                      background: 'rgba(249,115,22,0.2)', border: `1px solid ${orange}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: orange, fontSize: '12px', fontWeight: 'bold',
                    }}>
                      {count}
                    </div>
                    <span style={{ color: '#aaa', fontSize: '13px' }}>{mistake}...</span>
                  </div>
                ))}
              </div>
            )}

            {/* Field Performance */}
            {fieldAvg.length > 0 && (
              <div style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '24px',
              }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  🏅 Performance by Field
                </p>
                {fieldAvg.map(({ field, avg, count }) => (
                  <div key={field} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#aaa', fontSize: '13px' }}>{field}</span>
                      <span style={{ color: getScoreColor(avg), fontSize: '13px', fontWeight: 'bold' }}>
                        {avg} <span style={{ color: '#333', fontWeight: 'normal' }}>({count} attempt{count !== 1 ? 's' : ''})</span>
                      </span>
                    </div>
                    <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px' }}>
                      <div style={{
                        height: '100%', width: `${avg}%`,
                        background: getScoreColor(avg), borderRadius: '3px',
                        transition: 'width 1s ease',
                        boxShadow: `0 0 8px ${getScoreColor(avg)}44`,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ATTEMPTS TAB */}
        {activeTab === 'attempts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {history.map((item) => (
              <div key={item.id} style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {[item.question_type, item.field, item.difficulty].filter(Boolean).map((tag, i) => (
                        <span key={i} style={{
                          background: i === 0 ? 'rgba(249,115,22,0.1)' : '#1a1a1a',
                          border: `1px solid ${i === 0 ? orange : '#333'}`,
                          borderRadius: '6px', padding: '2px 10px',
                          color: i === 0 ? orange : '#555',
                          fontSize: '12px', textTransform: 'capitalize',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.5' }}>{item.question}</p>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  {Object.entries(item.breakdown || {}).map(([key, val]) => (
                    <div key={key} style={{
                      background: '#0a0a0a', borderRadius: '8px', padding: '10px', textAlign: 'center',
                    }}>
                      <div style={{ color: '#444', fontSize: '11px', marginBottom: '4px', textTransform: 'capitalize' }}>{key}</div>
                      <div style={{ color: getScoreColor(val), fontSize: '18px', fontWeight: 'bold' }}>{val}</div>
                    </div>
                  ))}
                </div>

                {item.feedback?.slice(0, 2).map((f, fi) => {
                  const colors = { error: '#ef4444', warning: orange, success: '#22c55e' };
                  const icons  = { error: '✗', warning: '⚠', success: '✓' };
                  return (
                    <div key={fi} style={{ color: colors[f.type] || orange, fontSize: '13px', marginBottom: '4px' }}>
                      {icons[f.type]} {f.message}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}