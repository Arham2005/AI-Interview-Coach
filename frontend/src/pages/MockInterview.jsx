import React, { useState, useEffect, useRef } from 'react';
import BodyLanguageCard from '../components/BodyLanguageCard';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const orange = '#f97316';
const orangeDark = '#ea580c';
const card = '#111111';
const cardBorder = '#222222';

const FIELDS = [
  { name: "Artificial Intelligence", icon: "🤖" },
  { name: "Software Engineering",    icon: "💻" },
  { name: "Data Science",            icon: "📊" },
  { name: "Cybersecurity",           icon: "🔐" },
  { name: "Cloud Computing",         icon: "☁️" },
  { name: "Web Development",         icon: "🌐" },
  { name: "Electrical Engineering",  icon: "⚡" },
  { name: "Mechanical Engineering",  icon: "⚙️" },
  { name: "Civil Engineering",       icon: "🏗️" },
  { name: "Business Analysis",       icon: "📈" },
];

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
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={getColor(score)} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill={getColor(score)} fontSize={size*0.22} fontWeight="bold" fontFamily="Arial">
        {score}
      </text>
    </svg>
  );
}

// ── PHASES ─────────────────────────────────────────────────────────────────
// setup → countdown → interview → processing → results

export default function MockInterview({ user }) {
  const [phase, setPhase]             = useState('setup');
  const [field, setField]             = useState('Artificial Intelligence');
  const [category, setCategory]       = useState('behavioral');
  const [difficulty, setDifficulty]   = useState('easy');
  const [questions, setQuestions]     = useState([]);
  const [loadingQ, setLoadingQ]       = useState(false);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [countdown, setCountdown]     = useState(3);
  const [timeLeft, setTimeLeft]       = useState(120);
  const [recording, setRecording]     = useState(false);
  const [results, setResults]         = useState([]);
  const [processing, setProcessing]   = useState(false);
  const [processingIdx, setProcessingIdx] = useState(0);

  const videoRef    = useRef(null);
  const mediaRecRef = useRef(null);
  const streamRef   = useRef(null);
  const timerRef    = useRef(null);
  const chunksRef   = useRef([]);
  const recordingsRef = useRef([]); // stores {question, blob} for each answer

  const getScoreColor = (s) => s >= 80 ? '#22c55e' : s >= 60 ? orange : '#ef4444';

  useEffect(() => {
    return () => {
      stopStream();
      clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Attach stream to video when recording starts
  useEffect(() => {
    if (recording && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [recording]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const fetchQuestions = async () => {
    setLoadingQ(true);
    try {
      const f = encodeURIComponent(field);
      const res = await fetch(`http://127.0.0.1:8000/api/questions/${f}/${category}/${difficulty}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.questions;
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      setLoadingQ(false);
    }
  };

  const speakText = (text, onEnd) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.pitch = 1;
    utter.volume = 1;
    if (onEnd) utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
  };

  const startInterview = async () => {
    const qs = await fetchQuestions();
    if (!qs.length) return;
    setQuestions(qs);
    recordingsRef.current = [];

    // Request camera + mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
    } catch {
      alert('Camera and microphone access required for Mock Interview.');
      return;
    }

    setPhase('countdown');
    setCurrentIdx(0);
    startCountdown(qs, 0);
  };

  const startCountdown = (qs, idx) => {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        askQuestion(qs, idx);
      }
    }, 1000);
  };

  const askQuestion = (qs, idx) => {
    setPhase('interview');
    setCurrentIdx(idx);
    setTimeLeft(120);

    // Speak the question then auto start recording
    speakText(`Question ${idx + 1}. ${qs[idx]}`, () => {
      setTimeout(() => startRecording(qs, idx), 500);
    });
  };

  const startRecording = (qs, idx) => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current);
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      recordingsRef.current[idx] = { question: qs[idx], blob };
    };
    mr.start();
    mediaRecRef.current = mr;
    setRecording(true);

    // Timer
    let t = 120;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        stopRecordingAndNext(qs, idx);
      }
    }, 1000);
  };

  const stopRecordingAndNext = (qs, idx) => {
    clearInterval(timerRef.current);
    setRecording(false);

    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }

    // Wait for blob to be saved then move on
    setTimeout(() => {
      const nextIdx = idx + 1;
      if (nextIdx < qs.length) {
        speakText('Good. Next question.', () => {
          setPhase('countdown');
          startCountdown(qs, nextIdx);
        });
      } else {
        speakText('Interview complete. Processing your results.', () => {
          stopStream();
          processAllAnswers(qs);
        });
      }
    }, 800);
  };

  const handleStopRecording = () => {
    stopRecordingAndNext(questions, currentIdx);
  };

  const processAllAnswers = async (qs) => {
    setPhase('processing');
    const allResults = [];

    for (let i = 0; i < recordingsRef.current.length; i++) {
      setProcessingIdx(i);
      const { question, blob } = recordingsRef.current[i] || {};
      if (!blob) continue;

      try {
        const fd = new FormData();
        fd.append('question', question);
        fd.append('video', blob, `answer_${i}.webm`);
        fd.append('use_groq', 'true');

        const res  = await fetch('http://127.0.0.1:8000/api/analyze/video', { method: 'POST', body: fd });
        const data = await res.json();

        allResults.push({ question, result: data });

        // Save to history
        try {
          await addDoc(collection(db, 'users', user.uid, 'history'), {
            question, question_type: data.question_type,
            final_score: data.final_score, breakdown: data.breakdown,
            feedback: data.feedback, word_count: data.word_count,
            filler_count: data.filler_count, confidence_level: data.confidence_level,
            field, category, difficulty,
            session: 'mock', date: serverTimestamp(),
          });
        } catch (e) { console.error(e); }

      } catch (e) {
        console.error(`Failed to analyze answer ${i}:`, e);
      }
    }

    setResults(allResults);
    setPhase('results');
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.result.final_score, 0) / results.length)
    : 0;

  // ── SETUP ────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎙️</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              Mock Interview
            </h2>
            <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.6' }}>
              A real interview simulation. Questions are asked one by one.<br />
              No feedback during the interview — just like the real thing.
            </p>
          </div>

          {/* How it works */}
          <div style={{
            background: card, border: `1px solid ${cardBorder}`,
            borderRadius: '16px', padding: '24px', marginBottom: '20px',
          }}>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              How It Works
            </p>
            {[
              { icon: '🎯', text: 'Select your field and difficulty' },
              { icon: '📷', text: 'Camera and mic turn on automatically' },
              { icon: '🔊', text: 'Each question is read aloud to you' },
              { icon: '🎤', text: 'Recording starts automatically after the question' },
              { icon: '⏭️', text: 'Click Stop when done — next question plays immediately' },
              { icon: '📊', text: 'Full results shown after all questions' },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '10px 0',
                borderBottom: i < 5 ? '1px solid #1a1a1a' : 'none',
              }}>
                <span style={{ fontSize: '20px' }}>{step.icon}</span>
                <span style={{ color: '#aaa', fontSize: '14px' }}>{step.text}</span>
              </div>
            ))}
          </div>

          {/* Field */}
          <div style={{
            background: card, border: `1px solid ${cardBorder}`,
            borderRadius: '16px', padding: '24px', marginBottom: '16px',
          }}>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Select Field
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {FIELDS.map(f => (
                <button key={f.name} onClick={() => setField(f.name)} style={{
                  padding: '8px 14px', borderRadius: '10px', fontSize: '13px',
                  fontWeight: field === f.name ? 'bold' : 'normal',
                  background: field === f.name ? orange : '#1a1a1a',
                  color: field === f.name ? '#000' : '#888',
                  border: `1px solid ${field === f.name ? orange : '#333'}`,
                  boxShadow: field === f.name ? `0 0 14px rgba(249,115,22,0.35)` : 'none',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span>{f.icon}</span><span>{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category + Difficulty */}
          <div style={{
            background: card, border: `1px solid ${cardBorder}`,
            borderRadius: '16px', padding: '24px', marginBottom: '24px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
          }}>
            <div>
              <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Category</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[{ id: 'behavioral', icon: '🗣️' }, { id: 'technical', icon: '🔧' }].map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                    flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: category === cat.id ? 'bold' : 'normal',
                    background: category === cat.id ? orange : '#1a1a1a',
                    color: category === cat.id ? '#000' : '#888',
                    border: `1px solid ${category === cat.id ? orange : '#333'}`,
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}>
                    <span>{cat.icon}</span><span style={{ textTransform: 'capitalize' }}>{cat.id}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Difficulty</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { d: 'easy',   color: '#16a34a', label: 'Easy'   },
                  { d: 'medium', color: '#d97706', label: 'Medium' },
                  { d: 'hard',   color: '#dc2626', label: 'Hard'   },
                ].map(({ d, color, label }) => (
                  <button key={d} onClick={() => setDifficulty(d)} style={{
                    flex: 1, padding: '10px 4px', borderRadius: '8px', fontSize: '12px',
                    fontWeight: difficulty === d ? 'bold' : 'normal',
                    background: difficulty === d ? color : '#1a1a1a',
                    color: difficulty === d ? '#fff' : '#888',
                    border: `1px solid ${difficulty === d ? color : '#333'}`,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={startInterview} disabled={loadingQ} style={{
            ...glowBtn, width: '100%', padding: '18px', fontSize: '17px',
            opacity: loadingQ ? 0.7 : 1,
          }}>
            {loadingQ ? 'Loading questions...' : '🎙️ Start Mock Interview'}
          </button>

        </div>
      </div>
    );
  }

  // ── COUNTDOWN ────────────────────────────────────────────────────────────
  if (phase === 'countdown') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#555', fontSize: '16px', marginBottom: '16px' }}>
            {currentIdx === 0 ? 'Interview starting in...' : `Question ${currentIdx + 1} of ${questions.length} coming up...`}
          </p>
          <div style={{
            fontSize: '120px', fontWeight: 'bold',
            color: orange, textShadow: `0 0 60px ${orange}66`,
            animation: 'pulse 1s infinite',
            lineHeight: 1,
          }}>
            {countdown}
          </div>
          <p style={{ color: '#333', fontSize: '14px', marginTop: '16px' }}>
            Get ready to answer
          </p>
        </div>
      </div>
    );
  }

  // ── INTERVIEW ────────────────────────────────────────────────────────────
  if (phase === 'interview') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '20px' }}>

          {/* Top bar */}
          <div style={{
            background: card, border: `1px solid ${cardBorder}`,
            borderRadius: '16px', padding: '16px 24px',
            marginBottom: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ color: orange, fontWeight: 'bold', fontSize: '16px' }}>
                Question {currentIdx + 1}
              </span>
              <span style={{ color: '#555', fontSize: '14px' }}> of {questions.length}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {questions.map((_, i) => (
                <div key={i} style={{
                  width: '32px', height: '6px', borderRadius: '3px',
                  background: i < currentIdx ? '#22c55e'
                    : i === currentIdx ? orange : '#1a1a1a',
                  boxShadow: i === currentIdx ? `0 0 8px ${orange}66` : 'none',
                }} />
              ))}
            </div>
            <div style={{
              color: timeLeft <= 30 ? '#ef4444' : orange,
              fontWeight: 'bold', fontSize: '20px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>

          {/* Question */}
          <div style={{
            background: 'rgba(249,115,22,0.06)', border: `1px solid ${orange}`,
            borderRadius: '16px', padding: '24px', marginBottom: '16px',
            boxShadow: `0 0 30px rgba(249,115,22,0.1)`,
          }}>
            <p style={{ color: '#555', fontSize: '12px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Question {currentIdx + 1}
            </p>
            <p style={{ color: orange, fontSize: '18px', lineHeight: '1.6', fontWeight: '500' }}>
              {questions[currentIdx]}
            </p>
          </div>

          {/* Video */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{
              width: '100%', borderRadius: '16px',
              border: recording ? '2px solid #ef4444' : '2px solid #333',
              background: '#000', maxHeight: '450px', objectFit: 'cover',
              transform: 'scaleX(-1)',
            }} />

            {/* Recording indicator */}
            {recording && (
              <div style={{
                position: 'absolute', top: '16px', left: '16px',
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(0,0,0,0.7)', borderRadius: '8px',
                padding: '6px 14px',
              }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: '#ef4444', animation: 'pulse 1s infinite',
                }} />
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
                  REC
                </span>
              </div>
            )}

            {/* Timer overlay */}
            <div style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(0,0,0,0.7)', borderRadius: '8px',
              padding: '6px 14px',
              color: timeLeft <= 30 ? '#ef4444' : '#fff',
              fontSize: '16px', fontWeight: 'bold',
            }}>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Stop Button */}
          <button onClick={handleStopRecording} disabled={!recording} style={{
            width: '100%', padding: '16px',
            background: recording ? '#1a0505' : '#0a0a0a',
            color: recording ? '#ef4444' : '#333',
            border: `2px solid ${recording ? '#ef4444' : '#222'}`,
            borderRadius: '12px', fontSize: '16px',
            fontWeight: 'bold', cursor: recording ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            {recording ? '■ Done Answering — Next Question' : '⏳ Waiting for question...'}
          </button>

        </div>
      </div>
    );
  }

  // ── PROCESSING ───────────────────────────────────────────────────────────
  if (phase === 'processing') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
            Analyzing Your Interview
          </h2>
          <p style={{ color: '#555', fontSize: '14px', marginBottom: '24px' }}>
            Processing answer {processingIdx + 1} of {recordingsRef.current.length}...
          </p>
          <div style={{ background: '#1a1a1a', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((processingIdx + 1) / recordingsRef.current.length) * 100}%`,
              background: orange,
              borderRadius: '8px',
              transition: 'width 0.5s ease',
              boxShadow: `0 0 12px ${orange}66`,
            }} />
          </div>
          <p style={{ color: '#333', fontSize: '12px', marginTop: '12px' }}>
            Transcribing audio + analyzing body language...
          </p>
        </div>
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const bestQ  = results.reduce((a, b) => a.result.final_score > b.result.final_score ? a : b, results[0]);
    const worstQ = results.reduce((a, b) => a.result.final_score < b.result.final_score ? a : b, results[0]);

    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '56px', marginBottom: '8px' }}>
              {avgScore >= 80 ? '🏆' : avgScore >= 60 ? '👍' : '📈'}
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              Mock Interview Complete!
            </h2>
            <p style={{ color: '#555', fontSize: '14px' }}>
              {field} · {category} · {difficulty}
            </p>
          </div>

          {/* Overall Score */}
          <div style={{
            background: card, border: `1px solid ${cardBorder}`,
            borderRadius: '16px', padding: '32px', marginBottom: '20px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#555', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Overall Interview Score
            </p>
            <ScoreRing score={avgScore} size={140} />
            <p style={{ color: '#333', fontSize: '14px', marginTop: '12px' }}>
              Average across {results.length} questions
            </p>
          </div>

          {/* Best + Worst */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: '🏆 Best Answer',  item: bestQ,  color: '#22c55e' },
              { label: '📉 Needs Most Work', item: worstQ, color: '#ef4444' },
            ].map(({ label, item, color }) => item && (
              <div key={label} style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '16px', padding: '20px',
              }}>
                <p style={{ color, fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>{label}</p>
                <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.5', marginBottom: '12px' }}>
                  {item.question.substring(0, 65)}...
                </p>
                <ScoreRing score={item.result.final_score} size={60} />
              </div>
            ))}
          </div>

          {/* Per Question Results */}
          {results.map(({ question, result }, i) => (
            <div key={i} style={{
              background: card, border: `1px solid ${cardBorder}`,
              borderRadius: '16px', padding: '24px', marginBottom: '16px',
            }}>
              {/* Question header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#555', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Question {i + 1}
                  </p>
                  <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.5' }}>{question}</p>
                </div>
                <ScoreRing score={result.final_score} size={60} />
              </div>

              {/* Score breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {Object.entries(result.breakdown || {}).map(([k, v]) => (
                  <div key={k} style={{
                    background: '#0a0a0a', borderRadius: '8px', padding: '10px', textAlign: 'center',
                  }}>
                    <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px', textTransform: 'capitalize' }}>{k}</div>
                    <div style={{ color: getScoreColor(v), fontSize: '16px', fontWeight: 'bold' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Body language */}
              {result.body_language_score !== undefined && (
                <div style={{
                  background: '#0a0a0a', borderRadius: '10px', padding: '12px',
                  display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>Body Language</div>
                    <ScoreRing score={result.body_language_score} size={44} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {Object.entries(result.body_language_breakdown || {}).map(([k, v]) => (
                      <div key={k} style={{ textAlign: 'center' }}>
                        <div style={{ color: '#333', fontSize: '10px', textTransform: 'capitalize', marginBottom: '2px' }}>{k}</div>
                        <div style={{ color: getScoreColor(v), fontSize: '14px', fontWeight: 'bold' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript */}
              {result.transcript && (
                <div style={{
                  background: '#0a0a0a', borderRadius: '8px', padding: '12px',
                  marginBottom: '12px',
                }}>
                  <p style={{ color: '#333', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Transcript</p>
                  <p style={{ color: '#666', fontSize: '13px', lineHeight: '1.6' }}>{result.transcript}</p>
                </div>
              )}

              {/* Top feedback */}
              {result.feedback?.slice(0, 3).map((f, fi) => {
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

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button onClick={() => setPhase('setup')} style={{
              flex: 1, padding: '14px', fontSize: '15px',
              background: '#1a1a1a', color: '#888',
              border: '1px solid #333', borderRadius: '10px',
              cursor: 'pointer', fontWeight: 'bold',
            }}>
              🔄 New Mock Interview
            </button>
          </div>

        </div>
      </div>
    );
  }

  return null;
}