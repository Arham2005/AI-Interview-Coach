import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const orange = '#f97316';
const card = '#111111';
const cardBorder = '#222222';

export default function Tips({ user }) {
  const [history, setHistory]   = useState([]);
  const [tips, setTips]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]       = useState('');

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
      if (items.length >= 3) generateTips(items);
      else setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const generateTips = async (items) => {
    setGenerating(true);
    try {
      const summary = {
        total_attempts: items.length,
        avg_score: Math.round(items.reduce((s, h) => s + h.final_score, 0) / items.length),
        avg_structure: Math.round(items.reduce((s, h) => s + (h.breakdown?.structure || 0), 0) / items.length),
        avg_content: Math.round(items.reduce((s, h) => s + (h.breakdown?.content || 0), 0) / items.length),
        avg_confidence: Math.round(items.reduce((s, h) => s + (h.breakdown?.confidence || 0), 0) / items.length),
        avg_clarity: Math.round(items.reduce((s, h) => s + (h.breakdown?.clarity || 0), 0) / items.length),
        avg_fillers: Math.round(items.reduce((s, h) => s + (h.filler_count || 0), 0) / items.length),
        question_types: items.map(h => h.question_type),
        recent_scores: items.slice(0, 5).map(h => h.final_score),
        common_feedback: items.flatMap(h => h.feedback || [])
          .filter(f => f.type === 'error')
          .map(f => f.message)
          .slice(0, 10),
      };

      const response = await fetch('http://127.0.0.1:8000/api/tips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
      });

      const data = await response.json();
      setTips(data);
    } catch (err) {
      setError('Failed to generate tips. Please try again.');
      console.error(err);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const getScoreColor = (s) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return orange;
    return '#ef4444';
  };

  const getLevel = (s) => {
    if (s >= 80) return { label: 'Strong', color: '#22c55e' };
    if (s >= 60) return { label: 'Average', color: orange };
    return { label: 'Needs Work', color: '#ef4444' };
  };

  if (loading || generating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✨</div>
          <div style={{ color: orange, fontSize: '18px', marginBottom: '8px' }}>
            {generating ? 'Analyzing your performance...' : 'Loading...'}
          </div>
          <div style={{ color: '#333', fontSize: '14px' }}>
            {generating ? 'Groq AI is reviewing your interview history' : ''}
          </div>
        </div>
      </div>
    );
  }

  if (history.length < 3) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>📝</div>
          <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
            Not enough data yet
          </h2>
          <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
            Complete at least <span style={{ color: orange }}>3 interview attempts</span> to get personalized tips based on your performance patterns.
          </p>
          <p style={{ color: '#333', fontSize: '13px', marginTop: '12px' }}>
            You have {history.length} attempt{history.length !== 1 ? 's' : ''} so far.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
            <span style={{ color: orange }}>💡</span> Personalized Tips
          </h2>
          <p style={{ color: '#555', fontSize: '13px' }}>
            Based on your {history.length} interview attempts
          </p>
        </div>

        {/* Performance Overview */}
        <div style={{
          background: card, border: `1px solid ${cardBorder}`,
          borderRadius: '16px', padding: '24px', marginBottom: '20px',
        }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Your Performance Overview
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Structure',  value: Math.round(history.reduce((s, h) => s + (h.breakdown?.structure || 0), 0) / history.length) },
              { label: 'Content',    value: Math.round(history.reduce((s, h) => s + (h.breakdown?.content || 0), 0) / history.length) },
              { label: 'Confidence', value: Math.round(history.reduce((s, h) => s + (h.breakdown?.confidence || 0), 0) / history.length) },
              { label: 'Clarity',    value: Math.round(history.reduce((s, h) => s + (h.breakdown?.clarity || 0), 0) / history.length) },
            ].map(m => {
              const level = getLevel(m.value);
              return (
                <div key={m.label} style={{
                  background: '#0a0a0a', borderRadius: '12px', padding: '16px', textAlign: 'center',
                }}>
                  <div style={{ color: '#555', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: getScoreColor(m.value), marginBottom: '4px' }}>
                    {m.value}
                  </div>
                  <div style={{
                    fontSize: '11px', color: level.color,
                    background: `${level.color}15`,
                    borderRadius: '4px', padding: '2px 8px',
                    display: 'inline-block',
                  }}>
                    {level.label}
                  </div>
                  <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '2px', marginTop: '10px' }}>
                    <div style={{
                      height: '100%', width: `${m.value}%`,
                      background: getScoreColor(m.value),
                      borderRadius: '2px',
                      boxShadow: `0 0 6px ${getScoreColor(m.value)}66`,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#1a0a0a', border: '1px solid #ef4444',
            borderRadius: '10px', padding: '14px',
            color: '#ef4444', marginBottom: '20px', fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* AI Generated Tips */}
        {tips && (
          <div>
            {/* Overall Assessment */}
            <div style={{
              background: 'rgba(249,115,22,0.08)',
              border: `1px solid ${orange}`,
              borderRadius: '16px', padding: '24px', marginBottom: '20px',
            }}>
              <p style={{ color: orange, fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                ✨ AI Assessment
              </p>
              <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.7' }}>
                {tips.overall_assessment}
              </p>
            </div>

            {/* Weak Areas */}
            {tips.weak_areas?.length > 0 && (
              <div style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '24px', marginBottom: '20px',
              }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  🎯 Areas to Improve
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tips.weak_areas.map((area, i) => (
                    <div key={i} style={{
                      background: '#1a0505', border: '1px solid #ef444444',
                      borderRadius: '10px', padding: '16px',
                    }}>
                      <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
                        ✗ {area.area}
                      </div>
                      <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.6' }}>
                        {area.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Tips */}
            {tips.action_tips?.length > 0 && (
              <div style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '24px', marginBottom: '20px',
              }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  ⚡ Action Tips
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tips.action_tips.map((tip, i) => (
                    <div key={i} style={{
                      background: '#0a0a0a', border: '1px solid #222',
                      borderRadius: '10px', padding: '14px 18px',
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                    }}>
                      <span style={{
                        color: '#000', background: orange,
                        borderRadius: '50%', width: '22px', height: '22px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 'bold', flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>
                        {tip}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {tips.strengths?.length > 0 && (
              <div style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '24px', marginBottom: '20px',
              }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  ✅ Your Strengths
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tips.strengths.map((s, i) => (
                    <div key={i} style={{
                      background: '#051a0a', border: '1px solid #22c55e44',
                      borderRadius: '10px', padding: '14px 18px',
                      color: '#22c55e', fontSize: '14px', lineHeight: '1.6',
                    }}>
                      ✓ {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice Recommendation */}
            {tips.practice_recommendation && (
              <div style={{
                background: '#0a0a1a', border: '1px solid #3b82f6',
                borderRadius: '16px', padding: '24px', marginBottom: '20px',
              }}>
                <p style={{ color: '#3b82f6', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  📚 Practice Recommendation
                </p>
                <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.7' }}>
                  {tips.practice_recommendation}
                </p>
              </div>
            )}

            {/* Regenerate Button */}
            <button onClick={() => generateTips(history)} style={{
              width: '100%', padding: '14px',
              background: `linear-gradient(135deg, ${orange}, #ea580c)`,
              color: '#000', fontWeight: 'bold',
              borderRadius: '10px', fontSize: '15px',
              boxShadow: `0 0 20px rgba(249,115,22,0.4)`,
              border: 'none', cursor: 'pointer',
            }}>
              ✨ Regenerate Tips
            </button>
          </div>
        )}

      </div>
    </div>
  );
}