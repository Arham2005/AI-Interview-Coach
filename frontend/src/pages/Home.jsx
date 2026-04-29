import React, { useState, useEffect } from 'react';
import ScoreCard from '../components/ScoreCard';
import FeedbackCard from '../components/FeedbackCard';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const FIELDS = [
  "Artificial Intelligence", "Software Engineering", "Data Science",
  "Cybersecurity", "Cloud Computing", "Web Development",
  "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Business Analysis",
];

const orange = '#f97316';
const orangeDark = '#ea580c';
const card = '#111111';
const cardBorder = '#222222';

export default function Home({ user }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('behavioral');
  const [field, setField] = useState('Artificial Intelligence');
  const [customField, setCustomField] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [mode, setMode] = useState('text');
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState('');
  const [transcript, setTranscript] = useState('');
  const [speaking, setSpeaking] = useState(false);

  const isCustom = !FIELDS.includes(field);

  useEffect(() => { fetchQuestions(); }, [field, category, difficulty]); // eslint-disable-line

  const fetchQuestions = async () => {
    setLoadingQ(true);
    setQuestions([]);
    setQuestion('');
    setResult(null);
    try {
      const f = encodeURIComponent(field);
      const res = await fetch(`http://127.0.0.1:8000/api/questions/${f}/${category}/${difficulty}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuestions(data.questions);
      setIsAiGenerated(data.source === 'groq');
    } catch { setError('Could not load questions.'); }
    finally { setLoadingQ(false); }
  };

  const handleAnalyze = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Please select a question and write your answer.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('question', question);
      fd.append('answer', answer);
      // fd.append('use_groq', (isAiGenerated || category === 'technical') ? 'true' : 'false');
      fd.append('use_groq', 'true');
      const res = await fetch('http://127.0.0.1:8000/api/analyze/text', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Server error.');
      const data = await res.json();
      setResult(data);
      saveToHistory(data, question);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const speakQuestion = (text) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.volume = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
      setAudioBlob(null);
      setAudioURL('');
      setTranscript('');
      setResult(null);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  const saveToHistory = async (data, q) => {
    try {
      await addDoc(collection(db, 'users', user.uid, 'history'), {
        question: q,
        question_type: data.question_type,
        final_score: data.final_score,
        breakdown: data.breakdown,
        feedback: data.feedback,
        word_count: data.word_count,
        filler_count: data.filler_count,
        confidence_level: data.confidence_level,
        field: field,
        category: category,
        difficulty: difficulty,
        date: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to save to history:', err);
    }
  };

  const handleAudioAnalyze = async () => {
    if (!question.trim()) {
      setError('Please select a question first.');
      return;
    }
    if (!audioBlob) {
      setError('Please record your answer first.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('question', question);
      fd.append('audio', audioBlob, 'answer.webm');
      // fd.append('use_groq', (isAiGenerated || category === 'technical') ? 'true' : 'false');
      fd.append('use_groq', 'true');
      const res = await fetch('http://127.0.0.1:8000/api/analyze/audio', {
        method: 'POST', body: fd,
      });
      if (!res.ok) throw new Error('Server error.');
      const data = await res.json();
      if (data.transcript) setTranscript(data.transcript);
      setResult(data);
      saveToHistory(data, question);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const glowBtn = {
    background: `linear-gradient(135deg, ${orange}, ${orangeDark})`,
    color: '#000',
    fontWeight: 'bold',
    borderRadius: '10px',
    boxShadow: `0 0 20px rgba(249,115,22,0.4)`,
    transition: 'all 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Header
      <div style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        padding: '18px 40px',
        borderBottom: `1px solid ${cardBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>
            <span style={{ color: orange }}>⬡</span> AI Interview Coach
          </h1>
          <p style={{ color: '#555', fontSize: '13px', marginTop: '2px' }}>
            Behavioral + Technical Analysis
          </p>
        </div>
        <div style={{
          border: `1px solid ${orange}`,
          borderRadius: '8px',
          padding: '6px 14px',
          color: orange,
          fontSize: '13px',
          boxShadow: `0 0 12px rgba(249,115,22,0.2)`,
        }}>
          ● API Connected
        </div>
      </div> */}

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Field Selector */}
        <div style={{
          background: card, border: `1px solid ${cardBorder}`,
          borderRadius: '16px', padding: '24px', marginBottom: '20px',
        }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Select Your Field
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            {FIELDS.map(f => (
              <button key={f} onClick={() => { setField(f); setCustomField(''); setResult(null); }} style={{
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                fontWeight: field === f ? 'bold' : 'normal',
                background: field === f ? orange : '#1a1a1a',
                color: field === f ? '#000' : '#888',
                border: `1px solid ${field === f ? orange : '#333'}`,
                boxShadow: field === f ? `0 0 14px rgba(249,115,22,0.35)` : 'none',
                transition: 'all 0.2s',
              }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={customField}
              onChange={e => setCustomField(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && customField.trim() && (setField(customField.trim()), setResult(null))}
              placeholder="Custom field e.g. Biomedical Engineering..."
              style={{
                flex: 1, padding: '10px 14px',
                background: '#0a0a0a', color: '#fff',
                border: `1px solid ${isCustom ? orange : '#333'}`,
                borderRadius: '8px', fontSize: '14px',
              }}
            />
            <button onClick={() => customField.trim() && (setField(customField.trim()), setResult(null))} style={{
              ...glowBtn, padding: '10px 20px', fontSize: '14px',
            }}>
              Search
            </button>
          </div>
          {isCustom && (
            <p style={{ color: orange, fontSize: '12px', marginTop: '8px' }}>
              ✨ Groq AI will generate questions for "{field}"
            </p>
          )}
        </div>

        {/* Category + Difficulty */}
        <div style={{
          background: card, border: `1px solid ${cardBorder}`,
          borderRadius: '16px', padding: '24px', marginBottom: '20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
        }}>
          <div>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Category
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['behavioral', 'technical'].map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: category === cat ? 'bold' : 'normal',
                  background: category === cat ? orange : '#1a1a1a',
                  color: category === cat ? '#000' : '#888',
                  border: `1px solid ${category === cat ? orange : '#333'}`,
                  boxShadow: category === cat ? `0 0 14px rgba(249,115,22,0.35)` : 'none',
                  textTransform: 'capitalize', transition: 'all 0.2s',
                }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Difficulty
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { d: 'easy', color: '#16a34a' },
                { d: 'medium', color: '#d97706' },
                { d: 'hard', color: '#dc2626' },
                { d: 'advanced', color: orange },
              ].map(({ d, color }) => (
                <button key={d} onClick={() => setDifficulty(d)} style={{
                  flex: 1, padding: '10px 4px', borderRadius: '8px', fontSize: '12px',
                  fontWeight: difficulty === d ? 'bold' : 'normal',
                  background: difficulty === d ? color : '#1a1a1a',
                  color: difficulty === d ? '#fff' : '#888',
                  border: `1px solid ${difficulty === d ? color : '#333'}`,
                  boxShadow: difficulty === d ? `0 0 12px ${color}55` : 'none',
                  textTransform: 'capitalize', transition: 'all 0.2s',
                }}>
                  {d === 'advanced' ? '✨ AI' : d}
                </button>
              ))}
            </div>
            {difficulty === 'advanced' && (
              <p style={{ color: orange, fontSize: '12px', marginTop: '8px' }}>
                ✨ Questions generated by Groq AI
              </p>
            )}
          </div>
        </div>

        {/* Questions */}
        <div style={{
          background: card, border: `1px solid ${cardBorder}`,
          borderRadius: '16px', padding: '24px', marginBottom: '20px',
        }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Select a Question
            {isAiGenerated && <span style={{ color: orange, marginLeft: '10px' }}>✨ AI Generated</span>}
          </p>
          {loadingQ ? (
            <div style={{ color: '#555', textAlign: 'center', padding: '30px', fontSize: '14px' }}>
              {difficulty === 'advanced' || isCustom ? '✨ Generating with Groq AI...' : 'Loading...'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {questions.map((q, i) => (
                <div key={i} onClick={() => setQuestion(q)} style={{
                  padding: '14px 18px',
                  background: question === q ? 'rgba(249,115,22,0.1)' : '#0a0a0a',
                  border: `1px solid ${question === q ? orange : '#222'}`,
                  borderRadius: '10px',
                  color: question === q ? orange : '#aaa',
                  fontSize: '14px', lineHeight: '1.6', cursor: 'pointer',
                  boxShadow: question === q ? `0 0 16px rgba(249,115,22,0.2)` : 'none',
                  transition: 'all 0.2s',
                }}>
                  <span style={{ color: '#333', marginRight: '10px', fontSize: '12px' }}>Q{i + 1}</span>
                  {q}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Question */}
        {question && (
          <div style={{
            background: 'rgba(249,115,22,0.08)',
            border: `1px solid ${orange}`,
            borderRadius: '10px', padding: '14px 18px',
            marginBottom: '20px', color: orange, fontSize: '14px',
            boxShadow: `0 0 20px rgba(249,115,22,0.15)`,
          }}>
            <span style={{ color: '#555', marginRight: '8px', fontSize: '12px' }}>Selected:</span>
            {question}
          </div>
        )}

        {/* Mode Tabs */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '20px',
          background: '#111', border: '1px solid #222',
          borderRadius: '12px', padding: '4px',
        }}>
          {['text', 'audio'].map(m => (
            <button key={m} onClick={() => {
              setMode(m); setResult(null); setError('');
              window.speechSynthesis.cancel(); setSpeaking(false);
            }} style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              background: mode === m ? orange : 'transparent',
              color: mode === m ? '#000' : '#555',
              fontWeight: mode === m ? 'bold' : 'normal',
              fontSize: '14px',
              boxShadow: mode === m ? `0 0 14px rgba(249,115,22,0.4)` : 'none',
              transition: 'all 0.2s',
            }}>
              {m === 'text' ? '📝 Text Mode' : '🎤 Audio Mode'}
            </button>
          ))}
        </div>

        {/* TEXT MODE */}
        {mode === 'text' && (
          <div>
            <div style={{
              background: card, border: `1px solid ${cardBorder}`,
              borderRadius: '16px', padding: '24px', marginBottom: '20px',
            }}>
              <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Your Answer
              </p>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here... aim for at least 50 words."
                rows={7}
                style={{
                  width: '100%', padding: '14px',
                  background: '#0a0a0a', color: '#fff',
                  border: '1px solid #222', borderRadius: '10px',
                  fontSize: '15px', resize: 'vertical', lineHeight: '1.7',
                }}
              />
              <div style={{ color: '#333', fontSize: '13px', marginTop: '6px', textAlign: 'right' }}>
                {answer.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            {error && (
              <div style={{
                background: '#1a0a0a', border: '1px solid #dc2626',
                borderRadius: '10px', padding: '14px',
                color: '#ef4444', marginBottom: '20px', fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            <button onClick={handleAnalyze} disabled={loading} style={{
              ...glowBtn, width: '100%', padding: '16px',
              fontSize: '16px', marginBottom: '40px',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Analyzing...' : '⚡ Analyze My Answer'}
            </button>
          </div>
        )}

        {/* AUDIO MODE */}
        {mode === 'audio' && (
          <div>
            <div style={{
              background: card, border: `1px solid ${cardBorder}`,
              borderRadius: '16px', padding: '24px', marginBottom: '20px',
            }}>
              <p style={{ color: '#888', fontSize: '13px', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                🔊 Listen to Question
              </p>
              {question ? (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    background: 'rgba(249,115,22,0.08)', border: `1px solid ${orange}`,
                    borderRadius: '10px', padding: '14px 18px',
                    color: orange, fontSize: '14px', marginBottom: '12px', lineHeight: '1.6',
                  }}>
                    {question}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => speakQuestion(question)} disabled={speaking} style={{
                      ...glowBtn, flex: 1, padding: '12px',
                      fontSize: '14px', opacity: speaking ? 0.6 : 1,
                    }}>
                      {speaking ? '🔊 Speaking...' : '▶ Read Question Aloud'}
                    </button>
                    {speaking && (
                      <button onClick={stopSpeaking} style={{
                        padding: '12px 20px', background: '#1a0505',
                        color: '#ef4444', border: '1px solid #ef4444',
                        borderRadius: '10px', fontSize: '14px', fontWeight: 'bold',
                      }}>
                        ■ Stop
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#333', fontSize: '14px', marginBottom: '24px' }}>
                  Select a question above first.
                </p>
              )}

              <p style={{ color: '#888', fontSize: '13px', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                🎤 Record Your Answer
              </p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                {!recording ? (
                  <button onClick={startRecording} style={{
                    ...glowBtn, flex: 1, padding: '14px', fontSize: '15px',
                  }}>
                    ● Start Recording
                  </button>
                ) : (
                  <button onClick={stopRecording} style={{
                    flex: 1, padding: '14px', background: '#1a0505',
                    color: '#ef4444', border: '1px solid #ef4444',
                    borderRadius: '10px', fontSize: '15px', fontWeight: 'bold',
                  }}>
                    ■ Stop Recording
                  </button>
                )}
              </div>

              {recording && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  color: '#ef4444', fontSize: '14px', marginBottom: '16px',
                }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: '#ef4444', animation: 'pulse 1s infinite',
                  }} />
                  Recording in progress...
                </div>
              )}

              {audioURL && (
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ color: '#555', fontSize: '13px', marginBottom: '8px' }}>
                    Review your recording:
                  </p>
                  <audio controls src={audioURL} style={{ width: '100%', borderRadius: '8px' }} />
                </div>
              )}
            </div>

            {transcript && (
              <div style={{
                background: card, border: `1px solid ${cardBorder}`,
                borderRadius: '12px', padding: '16px', marginBottom: '20px',
                color: '#aaa', fontSize: '14px', lineHeight: '1.7',
              }}>
                <p style={{ color: '#555', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Whisper Transcript
                </p>
                {transcript}
              </div>
            )}

            {error && (
              <div style={{
                background: '#1a0a0a', border: '1px solid #dc2626',
                borderRadius: '10px', padding: '14px',
                color: '#ef4444', marginBottom: '20px', fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            <button onClick={handleAudioAnalyze} disabled={loading || !audioBlob} style={{
              ...glowBtn, width: '100%', padding: '16px',
              fontSize: '16px', marginBottom: '40px',
              opacity: (loading || !audioBlob) ? 0.5 : 1,
            }}>
              {loading ? '🎙 Transcribing & Analyzing...' : '⚡ Analyze My Recording'}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            <ScoreCard score={result.final_score} breakdown={result.breakdown} />
            <FeedbackCard
              feedback={result.feedback}
              structureDetected={result.structure_detected}
              questionType={result.question_type}
              confidenceLevel={result.confidence_level}
              wordCount={result.word_count}
              fillerCount={result.filler_count}
            />
          </div>
        )}

      </div>
    </div>
  );
}