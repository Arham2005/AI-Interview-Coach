import React, { useState, useRef, useEffect } from 'react';

const orange = '#f97316';
const orangeDark = '#ea580c';

export default function VideoRecorder({ question, isAiGenerated, onResult }) {
  const [phase, setPhase]           = useState('ready');
  const [countdown, setCountdown]   = useState(5);
  const [recording, setRecording]   = useState(false);
  const [videoURL, setVideoURL]     = useState('');
  const [videoBlob, setVideoBlob]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [speaking, setSpeaking]     = useState(false);
  const [timeLeft, setTimeLeft]     = useState(120);

  const videoRef    = useRef(null);
  const mediaRecRef = useRef(null);
  const streamRef   = useRef(null);
  const timerRef    = useRef(null);

  useEffect(() => {
    return () => {
      stopStream();
      clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const speakQuestion = (text) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.onstart = () => setSpeaking(true);
    utter.onend   = () => { setSpeaking(false); startCountdown(); };
    window.speechSynthesis.speak(utter);
  };

  const startInterview = async () => {
    setError('');
    setVideoURL('');
    setVideoBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      setPhase('preview');
      if (question) speakQuestion(question);
      else startCountdown();
    } catch (err) {
      setError('Camera/microphone access denied. Please allow permissions.');
    }
  };

  const startCountdown = () => {
    setPhase('countdown');
    setCountdown(5);
    let count = 5;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const chunks = [];
    const mr = new MediaRecorder(streamRef.current);
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoBlob(blob);
      setVideoURL(URL.createObjectURL(blob));
      setPhase('review');
      stopStream();
    };
    mr.start();
    mediaRecRef.current = mr;
    setRecording(true);
    setPhase('recording');
    setTimeLeft(120);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
    setRecording(false);
  };

  const handleAnalyze = async () => {
    if (!videoBlob || !question) {
      setError('Please record your answer first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('question', question);
      fd.append('video', videoBlob, 'answer.webm');
      fd.append('use_groq', isAiGenerated ? 'true' : 'false');

      const res = await fetch('http://127.0.0.1:8000/api/analyze/video', {
        method: 'POST', body: fd,
      });
      if (!res.ok) throw new Error('Server error.');
      const data = await res.json();
      onResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    stopStream();
    clearInterval(timerRef.current);
    window.speechSynthesis.cancel();
    setPhase('ready');
    setVideoURL('');
    setVideoBlob(null);
    setError('');
    setTimeLeft(120);
  };

  const glowBtn = {
    background: `linear-gradient(135deg, ${orange}, ${orangeDark})`,
    color: '#000', fontWeight: 'bold', borderRadius: '10px',
    boxShadow: `0 0 20px rgba(249,115,22,0.4)`,
    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{
      background: '#111', border: '1px solid #222',
      borderRadius: '16px', padding: '24px', marginBottom: '20px',
    }}>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
        🎥 Video Interview
      </p>

      {/* Selected Question */}
      {question && (
        <div style={{
          background: 'rgba(249,115,22,0.08)', border: `1px solid ${orange}`,
          borderRadius: '10px', padding: '14px', marginBottom: '16px',
          color: orange, fontSize: '14px', lineHeight: '1.6',
        }}>
          <span style={{ color: '#555', fontSize: '12px', marginRight: '8px' }}>Question:</span>
          {question}
        </div>
      )}

      {/* Video Preview */}
      {(phase === 'preview' || phase === 'recording') && (
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{
            width: '100%', borderRadius: '12px',
            border: `2px solid ${phase === 'recording' ? '#ef4444' : '#333'}`,
            background: '#000',
          }} />
          {phase === 'recording' && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(0,0,0,0.7)', borderRadius: '8px',
              padding: '6px 12px',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#ef4444', animation: 'pulse 1s infinite',
              }} />
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
          {speaking && (
            <div style={{
              position: 'absolute', bottom: '12px', left: '12px',
              background: 'rgba(249,115,22,0.9)', borderRadius: '8px',
              padding: '6px 12px', color: '#000', fontSize: '13px', fontWeight: 'bold',
            }}>
              🔊 Listen to question...
            </div>
          )}
        </div>
      )}

      {/* Countdown */}
      {phase === 'countdown' && (
        <div style={{
          textAlign: 'center', padding: '40px',
          marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '80px', fontWeight: 'bold',
            color: orange, textShadow: `0 0 40px ${orange}66`,
            animation: 'pulse 1s infinite',
          }}>
            {countdown}
          </div>
          <p style={{ color: '#888', fontSize: '16px', marginTop: '8px' }}>
            Get ready to answer...
          </p>
        </div>
      )}

      {/* Video Review */}
      {phase === 'review' && videoURL && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#555', fontSize: '13px', marginBottom: '8px' }}>
            Review your recording:
          </p>
          <video controls src={videoURL} style={{
            width: '100%', borderRadius: '12px',
            border: '1px solid #333', background: '#000',
          }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#1a0a0a', border: '1px solid #ef4444',
          borderRadius: '10px', padding: '14px',
          color: '#ef4444', marginBottom: '16px', fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {phase === 'ready' && (
          <button onClick={startInterview} disabled={!question} style={{
            ...glowBtn, flex: 1, padding: '14px', fontSize: '15px',
            opacity: !question ? 0.5 : 1,
          }}>
            🎥 Start Video Interview
          </button>
        )}

        {phase === 'preview' && (
          <button onClick={startCountdown} style={{
            ...glowBtn, flex: 1, padding: '14px', fontSize: '15px',
          }}>
            ▶ Skip to Recording
          </button>
        )}

        {phase === 'recording' && (
          <button onClick={stopRecording} style={{
            flex: 1, padding: '14px', fontSize: '15px',
            background: '#1a0505', color: '#ef4444',
            border: '1px solid #ef4444', borderRadius: '10px',
            fontWeight: 'bold', cursor: 'pointer',
          }}>
            ■ Stop Recording
          </button>
        )}

        {phase === 'review' && (
          <>
            <button onClick={reset} style={{
              padding: '14px 20px', fontSize: '14px',
              background: '#1a1a1a', color: '#888',
              border: '1px solid #333', borderRadius: '10px',
              cursor: 'pointer', fontWeight: 'bold',
            }}>
              🔄 Retake
            </button>
            <button onClick={handleAnalyze} disabled={loading} style={{
              ...glowBtn, flex: 1, padding: '14px', fontSize: '15px',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? '🎥 Analyzing video...' : '⚡ Analyze Video'}
            </button>
          </>
        )}
      </div>

      {!question && phase === 'ready' && (
        <p style={{ color: '#333', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
          Select a question above to start the video interview.
        </p>
      )}
    </div>
  );
}