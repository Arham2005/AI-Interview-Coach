import React, { useState, useEffect } from 'react';
import FeedbackCard from '../components/FeedbackCard';
import BodyLanguageCard from '../components/BodyLanguageCard';
import VideoRecorder from '../components/VideoRecorder';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const orange = '#f97316';
const orangeDark = '#ea580c';
const card = '#111111';
const cardBorder = '#222222';

const glowBtn = {
  background: `linear-gradient(135deg, ${orange}, ${orangeDark})`,
  color: '#000', fontWeight: 'bold', borderRadius: '10px',
  boxShadow: `0 0 20px rgba(249,115,22,0.4)`,
  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
};

function ScoreRing({ score, size = 80 }) {
  const getColor = (s) => s >= 80 ? '#22c55e' : s >= 60 ? orange : '#ef4444';
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={getColor(score)} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill={getColor(score)} fontSize={size * 0.22} fontWeight="bold" fontFamily="Arial">
        {score}
      </text>
    </svg>
  );
}

export default function Session({ user, questions, field, category, difficulty, onExit }) {
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [mode, setMode]               = useState('text');
  const [answer, setAnswer]           = useState('');
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [sessionResults, setSessionResults] = useState([]);
  const [phase, setPhase]             = useState('answering'); // answering | feedback | summary
  const [speaking, setSpeaking]       = useState(false);
  const [recording, setRecording]     = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob]     = useState(null);
  const [audioURL, setAudioURL]       = useState('');
  const [transcript, setTranscript]   = useState('');

  const currentQuestion = questions[currentIdx];
  const totalQuestions  = questions.length;
  const isLastQuestion  = currentIdx === totalQuestions - 1;

  const getScoreColor = (s) => s >= 80 ? '#22c55e' : s >= 60 ? orange : '#ef4444';

  const saveToHistory = async (data, q) => {
    try {
      await addDoc(collection(db, 'users', user.uid, 'history'), {
        question: q, question_type: data.question_type,
        final_score: data.final_score, breakdown: data.breakdown,
        feedback: data.feedback, word_count: data.word_count,
        filler_count: data.filler_count, confidence_level: data.confidence_level,
        field, category, difficulty, date: serverTimestamp(),
      });
    } catch (err) { console.error(err); }
  };

  const speakQuestion = (text) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.onstart = () => setSpeaking(true);
    utter.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setSpeaking(false); };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob); setAudioURL(URL.createObjectURL(blob));
      };
      mr.start();
      setMediaRecorder(mr); setRecording(true);
      setAudioBlob(null); setAudioURL(''); setTranscript('');
    } catch { setError('Microphone access denied.'); }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  const handleAnalyze = async () => {
    if (mode === 'text' && !answer.trim()) { setError('Please write your answer first.'); return; }
    if (mode === 'audio' && !audioBlob)    { setError('Please record your answer first.'); return; }

    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('question', currentQuestion);
      fd.append('use_groq', 'true');

      let endpoint = '/api/analyze/text';
      if (mode === 'text')  { fd.append('answer', answer); }
      if (mode === 'audio') { fd.append('audio', audioBlob, 'answer.webm'); endpoint = '/api/analyze/audio'; }

      const res  = await fetch(`http://127.0.0.1:8000${endpoint}`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.transcript) setTranscript(data.transcript);
      setResult(data);
      setPhase('feedback');
      saveToHistory(data, currentQuestion);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleNext = () => {
    setSessionResults(prev => [...prev, { question: currentQuestion, result }]);
    if (isLastQuestion) {
      setSessionResults(prev => [...prev, { question: currentQuestion, result }]);
      setPhase('summary');
    } else {
      setCurrentIdx(prev => prev + 1);
      setAnswer(''); setResult(null); setAudioBlob(null);
      setAudioURL(''); setTranscript(''); setError('');
      setPhase('answering');
      window.speechSynthesis.cancel();
    }
  };

  const handleVideoResult = (data) => {
    setResult(data);
    setPhase('feedback');
    saveToHistory(data, currentQuestion);
  };

  // Summary calculations
  const allResults = phase === 'summary' ? sessionResults : [];
  const avgScore   = allResults.length > 0
    ? Math.round(allResults.reduce((s, r) => s + r.result.final_score, 0) / allResults.length)
    : 0;
  const bestQ  = allResults.length > 0 ? allResults.reduce((a, b) => a.result.final_score > b.result.final_score ? a : b) : null;
  const worstQ = allResults.length > 0 ? allResults.reduce((a, b) => a.result.final_score < b.result.final_score ? a : b) : null;

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              Session Complete!
            </h2>
            <p style={{ color: '#555', fontSize: '14px' }}>
              {field} · {category} · {difficulty} · {totalQuestions} questions
            </p>
          </div>

          {/* Overall Score */}
          <div style={{
            background: card, border: `1px solid ${cardBorder}`,
            borderRadius: '16px', padding: '32px', marginBottom: '20px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#555', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Session Score
            </p>
            <ScoreRing score={avgScore} size={120} />
            <p style={{ color: '#555', fontSize: '14px', marginTop: '12px' }}>
              Average across {totalQuestions} questions
            </p>
          </div>

          {/* Best + Worst */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: '🏆 Best Answer',  item: bestQ,  color: '#22c55e' },
              { label: '📉 Needs Work',   item: worstQ, color: '#ef4444' },
            ].map(({ label, item, color }) => item && (
              <div key={label} style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '20px',
              }}>
                <p style={{ color, fontSize: '13px', marginBottom: '8px', fontWeight: 'bold' }}>{label}</p>
                <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>
                  {item.question.substring(0, 60)}...
                </p>
                <ScoreRing score={item.result.final_score} size={60} />
              </div>
            ))}
          </div>

          {/* Per Question Breakdown */}
          <div style={{
            background: card, border: `1px solid ${cardBorder}`,
            borderRadius: '16px', padding: '24px', marginBottom: '20px',
          }}>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Question Breakdown
            </p>
            {allResults.map(({ question, result }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 0',
                borderBottom: i < allResults.length - 1 ? '1px solid #1a1a1a' : 'none',
              }}>
                <div style={{
                  minWidth: '28px', height: '28px', borderRadius: '50%',
                  background: 'rgba(249,115,22,0.1)', border: `1px solid ${orange}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: orange, fontSize: '12px', fontWeight: 'bold',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.4' }}>
                    {question.substring(0, 70)}...
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {Object.entries(result.breakdown || {}).map(([k, v]) => (
                      <span key={k} style={{ color: getScoreColor(v), fontSize: '11px' }}>
                        {k.charAt(0).toUpperCase() + k.slice(1)}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <ScoreRing score={result.final_score} size={50} />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onExit} style={{
              flex: 1, padding: '14px', fontSize: '15px',
              background: '#1a1a1a', color: '#888',
              border: '1px solid #333', borderRadius: '10px',
              cursor: 'pointer', fontWeight: 'bold',
            }}>
              ← Back to Practice
            </button>
            <button onClick={() => {
              setCurrentIdx(0); setSessionResults([]);
              setAnswer(''); setResult(null);
              setAudioBlob(null); setAudioURL('');
              setTranscript(''); setError('');
              setPhase('answering');
            }} style={{
              ...glowBtn, flex: 1, padding: '14px', fontSize: '15px',
            }}>
              🔄 Retry Session
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── ANSWERING / FEEDBACK ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '30px 20px' }}>

        {/* Session Progress Bar */}
        <div style={{
          background: card, border: `1px solid ${cardBorder}`,
          borderRadius: '16px', padding: '20px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <span style={{ color: orange, fontWeight: 'bold', fontSize: '16px' }}>
                Question {currentIdx + 1}
              </span>
              <span style={{ color: '#555', fontSize: '14px' }}> of {totalQuestions}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#555', fontSize: '13px', textTransform: 'capitalize' }}>
                {field} · {category} · {difficulty}
              </span>
              <button onClick={onExit} style={{
                padding: '6px 12px', background: 'transparent',
                color: '#555', border: '1px solid #333',
                borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              }}>
                ✕ Exit
              </button>
            </div>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: '6px', borderRadius: '3px',
                background: i < currentIdx ? '#22c55e'
                  : i === currentIdx ? orange
                  : '#1a1a1a',
                boxShadow: i === currentIdx ? `0 0 8px ${orange}66` : 'none',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {/* Previous scores */}
          {sessionResults.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {sessionResults.map((r, i) => (
                <div key={i} style={{
                  fontSize: '11px', color: getScoreColor(r.result.final_score),
                  background: '#0a0a0a', borderRadius: '4px', padding: '2px 8px',
                }}>
                  Q{i+1}: {r.result.final_score}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Question */}
        <div style={{
          background: 'rgba(249,115,22,0.06)', border: `1px solid ${orange}`,
          borderRadius: '12px', padding: '20px', marginBottom: '20px',
          boxShadow: `0 0 24px rgba(249,115,22,0.1)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#555', fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Question {currentIdx + 1}
              </p>
              <p style={{ color: orange, fontSize: '16px', lineHeight: '1.6', fontWeight: '500' }}>
                {currentQuestion}
              </p>
            </div>
            <button onClick={() => speakQuestion(currentQuestion)} style={{
              ...glowBtn, padding: '8px 14px', fontSize: '13px', marginLeft: '12px', flexShrink: 0,
              opacity: speaking ? 0.6 : 1,
            }}>
              {speaking ? '🔊' : '▶'}
            </button>
          </div>
        </div>

        {/* Mode Tabs — only show during answering */}
        {phase === 'answering' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px', marginBottom: '16px',
          }}>
            {[
              { id: 'text',  icon: '📝', label: 'Text',  desc: 'Type your answer' },
              { id: 'audio', icon: '🎤', label: 'Audio', desc: 'Record your voice' },
              { id: 'video', icon: '🎥', label: 'Video', desc: 'Full interview sim' },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                padding: '12px 8px',
                background: mode === m.id ? `linear-gradient(135deg, ${orange}, ${orangeDark})` : card,
                color: mode === m.id ? '#000' : '#555',
                border: `1px solid ${mode === m.id ? orange : cardBorder}`,
                borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                boxShadow: mode === m.id ? `0 0 20px rgba(249,115,22,0.3)` : 'none',
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '18px', marginBottom: '2px' }}>{m.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{m.label}</div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Answer Input */}
        {phase === 'answering' && mode === 'text' && (
          <div style={{
            background: card, border: `1px solid ${cardBorder}`,
            borderRadius: '16px', padding: '24px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ color: '#888', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>Your Answer</p>
              <span style={{ color: answer.split(/\s+/).filter(Boolean).length >= 50 ? '#22c55e' : '#ef4444', fontSize: '12px' }}>
                {answer.trim().split(/\s+/).filter(Boolean).length} / 50 words
              </span>
            </div>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={7}
              style={{
                width: '100%', padding: '14px',
                background: '#0a0a0a', color: '#fff',
                border: '1px solid #222', borderRadius: '10px',
                fontSize: '15px', resize: 'vertical', lineHeight: '1.7',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {phase === 'answering' && mode === 'audio' && (
          <div style={{
            background: card, border: `1px solid ${cardBorder}`,
            borderRadius: '16px', padding: '24px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              {!recording ? (
                <button onClick={startRecording} style={{ ...glowBtn, flex: 1, padding: '14px', fontSize: '14px' }}>
                  ● Start Recording
                </button>
              ) : (
                <button onClick={stopRecording} style={{
                  flex: 1, padding: '14px', background: '#1a0505',
                  color: '#ef4444', border: '1px solid #ef4444',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                }}>
                  ■ Stop Recording
                </button>
              )}
            </div>
            {recording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', marginBottom: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                Recording...
              </div>
            )}
            {audioURL && <audio controls src={audioURL} style={{ width: '100%', borderRadius: '8px' }} />}
          </div>
        )}

        {phase === 'answering' && mode === 'video' && (
          <VideoRecorder
            question={currentQuestion}
            isAiGenerated={false}
            onResult={handleVideoResult}
          />
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#1a0a0a', border: '1px solid #dc2626',
            borderRadius: '10px', padding: '14px',
            color: '#ef4444', marginBottom: '16px', fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Analyze Button */}
        {phase === 'answering' && mode !== 'video' && (
          <button onClick={handleAnalyze} disabled={loading} style={{
            ...glowBtn, width: '100%', padding: '16px',
            fontSize: '16px', marginBottom: '20px',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? '⏳ Analyzing...' : '⚡ Analyze Answer'}
          </button>
        )}

        {/* Feedback */}
        {phase === 'feedback' && result && (
          <div>
            {/* Score */}
            <div style={{
              background: card, border: `1px solid ${cardBorder}`,
              borderRadius: '16px', padding: '24px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '24px',
            }}>
              <ScoreRing score={result.final_score} size={90} />
              <div>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '4px' }}>Question {currentIdx + 1} Score</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '8px' }}>
                  {Object.entries(result.breakdown || {}).map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'center' }}>
                      <div style={{ color: '#444', fontSize: '10px', textTransform: 'capitalize', marginBottom: '2px' }}>{k}</div>
                      <div style={{ color: getScoreColor(v), fontSize: '16px', fontWeight: 'bold' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {result.body_language_score !== undefined && (
              <BodyLanguageCard
                bodyLanguageScore={result.body_language_score}
                breakdown={result.body_language_breakdown}
                stats={result.body_language_stats}
                feedback={result.body_language_feedback}
              />
            )}

            <FeedbackCard
              feedback={result.feedback}
              structureDetected={result.structure_detected}
              questionType={result.question_type}
              confidenceLevel={result.confidence_level}
              wordCount={result.word_count}
              fillerCount={result.filler_count}
            />

            {/* Next Button */}
            <button onClick={handleNext} style={{
              ...glowBtn, width: '100%', padding: '16px', fontSize: '16px',
            }}>
              {isLastQuestion ? '🎉 View Session Summary' : `→ Next Question (${currentIdx + 2}/${totalQuestions})`}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}