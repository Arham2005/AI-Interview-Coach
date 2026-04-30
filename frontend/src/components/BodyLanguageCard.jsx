import React from 'react';

const orange = '#f97316';

export default function BodyLanguageCard({ bodyLanguageScore, breakdown, stats, feedback }) {
  const getScoreColor = (s) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return orange;
    return '#ef4444';
  };

  const typeStyles = {
    error:   { background: '#1a0505', border: '1px solid #ef4444', icon: '✗', color: '#ef4444' },
    warning: { background: '#1a0f00', border: `1px solid ${orange}`, icon: '⚠', color: orange },
    success: { background: '#051a0a', border: '1px solid #22c55e', icon: '✓', color: '#22c55e' },
  };

  return (
    <div style={{
      background: '#111', border: '1px solid #222',
      borderRadius: '16px', padding: '32px',
      marginBottom: '20px',
      boxShadow: '0 0 40px rgba(249,115,22,0.08)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ color: '#fff', fontSize: '20px' }}>Body Language Analysis</h2>
        <div style={{
          fontSize: '40px', fontWeight: 'bold',
          color: getScoreColor(bodyLanguageScore),
          textShadow: `0 0 20px ${getScoreColor(bodyLanguageScore)}44`,
        }}>
          {bodyLanguageScore}
        </div>
      </div>

      {/* Breakdown */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px', marginBottom: '24px',
      }}>
        {[
          { label: 'Eye Contact', value: breakdown?.eye_contact },
          { label: 'Posture',     value: breakdown?.posture },
          { label: 'Presence',    value: breakdown?.presence },
        ].map(m => (
          <div key={m.label} style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a',
            borderRadius: '12px', padding: '16px', textAlign: 'center',
          }}>
            <div style={{ color: '#555', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {m.label}
            </div>
            <div style={{
              fontSize: '28px', fontWeight: 'bold',
              color: getScoreColor(m.value),
              textShadow: `0 0 16px ${getScoreColor(m.value)}44`,
            }}>
              {m.value}
            </div>
            <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '2px', marginTop: '8px' }}>
              <div style={{
                height: '100%', width: `${m.value}%`,
                background: getScoreColor(m.value),
                borderRadius: '2px',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px', marginBottom: '24px',
      }}>
        {[
          { label: 'Eye Contact %',    value: `${stats?.eye_contact_pct}%` },
          { label: 'Good Posture %',   value: `${stats?.good_posture_pct}%` },
          { label: 'Face Detected %',  value: `${stats?.face_detected_pct}%` },
          { label: 'Nods Detected',    value: stats?.nod_count },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a',
            borderRadius: '8px', padding: '12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#555', fontSize: '13px' }}>{stat.label}</span>
            <span style={{ color: orange, fontSize: '15px', fontWeight: 'bold' }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Body Language Feedback
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {feedback?.map((item, i) => {
          const s = typeStyles[item.type] || typeStyles.warning;
          return (
            <div key={i} style={{
              background: s.background, border: s.border,
              borderRadius: '10px', padding: '14px 18px',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}>
              <span style={{ color: s.color, fontWeight: 'bold', fontSize: '16px' }}>
                {s.icon}
              </span>
              <span style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>
                {item.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}