// import React, { useState, useEffect } from 'react';
// import ScoreCard from '../components/ScoreCard';
// import FeedbackCard from '../components/FeedbackCard';

// const FIELDS = [
//   "Artificial Intelligence",
//   "Software Engineering",
//   "Data Science",
//   "Cybersecurity",
//   "Cloud Computing",
//   "Web Development",
//   "Electrical Engineering",
//   "Mechanical Engineering",
//   "Civil Engineering",
//   "Business Analysis",
// ];

// const Home = () => {
//   const [question, setQuestion]             = useState('');
//   const [answer, setAnswer]                 = useState('');
//   const [result, setResult]                 = useState(null);
//   const [loading, setLoading]               = useState(false);
//   const [error, setError]                   = useState('');
//   const [category, setCategory]             = useState('behavioral');
//   const [field, setField]                   = useState('Artificial Intelligence');
//   const [customField, setCustomField]       = useState('');
//   const [difficulty, setDifficulty]         = useState('easy');
//   const [questions, setQuestions]           = useState([]);
//   const [loadingQuestions, setLoadingQuestions] = useState(false);
//   const [isAiGenerated, setIsAiGenerated]   = useState(false);

//   const isCustomField = !FIELDS.includes(field);

//   useEffect(() => {
//     fetchQuestions();
//   }, [field, category, difficulty]);

//   const fetchQuestions = async () => {
//     setLoadingQuestions(true);
//     setQuestions([]);
//     setQuestion('');
//     setResult(null);
//     try {
//       const f = encodeURIComponent(field);
//       const response = await fetch(
//         `http://127.0.0.1:8000/api/questions/${f}/${category}/${difficulty}`
//       );
//       const data = await response.json();
//       if (data.error) throw new Error(data.error);
//       setQuestions(data.questions);
//       setIsAiGenerated(data.source === 'groq');
//     } catch (err) {
//       setError('Could not load questions. Please try again.');
//     } finally {
//       setLoadingQuestions(false);
//     }
//   };

//   const handleFieldChange = (f) => {
//     setField(f);
//     setCustomField('');
//     setResult(null);
//   };

//   const handleCustomField = () => {
//     if (customField.trim()) {
//       setField(customField.trim());
//       setResult(null);
//     }
//   };

//   const handleAnalyze = async () => {
//     if (!question.trim() || !answer.trim()) {
//       setError('Please select a question and write your answer.');
//       return;
//     }
//     setLoading(true);
//     setError('');
//     setResult(null);
//     try {
//       const formData = new FormData();
//       formData.append('question', question);
//       formData.append('answer', answer);
//       formData.append('use_groq', isAiGenerated ? 'true' : 'false');

//       const response = await fetch('http://127.0.0.1:8000/api/analyze/text', {
//         method: 'POST',
//         body: formData,
//       });
//       if (!response.ok) throw new Error('Server error. Please try again.');
//       const data = await response.json();
//       setResult(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ minHeight: '100vh', background: '#0f172a' }}>

//       {/* Header */}
//       <div style={{
//         background: '#1e293b',
//         padding: '20px 40px',
//         borderBottom: '1px solid #334155',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//       }}>
//         <div>
//           <h1 style={{ color: '#e2e8f0', fontSize: '24px', fontWeight: 'bold' }}>
//             🎯 AI Interview Coach
//           </h1>
//           <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
//             Behavioral + Technical Analysis
//           </p>
//         </div>
//         <div style={{
//           background: '#22c55e20',
//           border: '1px solid #22c55e',
//           borderRadius: '8px',
//           padding: '6px 14px',
//           color: '#22c55e',
//           fontSize: '13px',
//         }}>
//           ● API Connected
//         </div>
//       </div>

//       <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>

//         {/* Field Selector */}
//         <div style={{ marginBottom: '24px' }}>
//           <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
//             Select Your Field
//           </label>
//           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
//             {FIELDS.map((f) => (
//               <button key={f} onClick={() => handleFieldChange(f)} style={{
//                 padding: '8px 16px',
//                 borderRadius: '8px',
//                 background: field === f ? '#3b82f6' : '#1e293b',
//                 color: field === f ? '#fff' : '#64748b',
//                 border: `1px solid ${field === f ? '#3b82f6' : '#334155'}`,
//                 fontSize: '13px',
//                 fontWeight: field === f ? 'bold' : 'normal',
//                 transition: 'all 0.2s',
//               }}>
//                 {f}
//               </button>
//             ))}
//           </div>

//           {/* Custom Field */}
//           <div style={{ display: 'flex', gap: '10px' }}>
//             <input
//               type="text"
//               value={customField}
//               onChange={(e) => setCustomField(e.target.value)}
//               placeholder="Or type a custom field e.g. Biomedical Engineering..."
//               style={{
//                 flex: 1,
//                 padding: '10px 14px',
//                 background: '#1e293b',
//                 color: '#e2e8f0',
//                 border: `1px solid ${isCustomField ? '#6366f1' : '#334155'}`,
//                 borderRadius: '8px',
//                 fontSize: '14px',
//               }}
//             />
//             <button onClick={handleCustomField} style={{
//               padding: '10px 20px',
//               background: '#6366f1',
//               color: '#fff',
//               borderRadius: '8px',
//               fontSize: '14px',
//               fontWeight: 'bold',
//             }}>
//               Search
//             </button>
//           </div>
//           {isCustomField && (
//             <p style={{ color: '#6366f1', fontSize: '12px', marginTop: '6px' }}>
//               ✨ Using Groq AI to generate questions for "{field}"
//             </p>
//           )}
//         </div>

//         {/* Category + Difficulty */}
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
//           <div>
//             <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
//               Category
//             </label>
//             <div style={{ display: 'flex', gap: '10px' }}>
//               {['behavioral', 'technical'].map((cat) => (
//                 <button key={cat} onClick={() => setCategory(cat)} style={{
//                   flex: 1,
//                   padding: '10px',
//                   borderRadius: '8px',
//                   background: category === cat ? '#3b82f6' : '#1e293b',
//                   color: category === cat ? '#fff' : '#64748b',
//                   border: `1px solid ${category === cat ? '#3b82f6' : '#334155'}`,
//                   fontSize: '13px',
//                   fontWeight: category === cat ? 'bold' : 'normal',
//                   textTransform: 'capitalize',
//                   transition: 'all 0.2s',
//                 }}>
//                   {cat}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div>
//             <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
//               Difficulty
//             </label>
//             <div style={{ display: 'flex', gap: '8px' }}>
//               {['easy', 'medium', 'hard', 'advanced'].map((d) => (
//                 <button key={d} onClick={() => setDifficulty(d)} style={{
//                   flex: 1,
//                   padding: '10px 4px',
//                   borderRadius: '8px',
//                   background: difficulty === d ? (
//                     d === 'easy' ? '#16a34a' :
//                     d === 'medium' ? '#d97706' :
//                     d === 'hard' ? '#dc2626' : '#7c3aed'
//                   ) : '#1e293b',
//                   color: difficulty === d ? '#fff' : '#64748b',
//                   border: `1px solid ${difficulty === d ? 'transparent' : '#334155'}`,
//                   fontSize: '12px',
//                   fontWeight: difficulty === d ? 'bold' : 'normal',
//                   textTransform: 'capitalize',
//                   transition: 'all 0.2s',
//                 }}>
//                   {d === 'advanced' ? '✨ AI' : d}
//                 </button>
//               ))}
//             </div>
//             {difficulty === 'advanced' && (
//               <p style={{ color: '#7c3aed', fontSize: '12px', marginTop: '6px' }}>
//                 ✨ Advanced questions are generated by Groq AI
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Questions List */}
//         <div style={{ marginBottom: '24px' }}>
//           <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
//             Select a Question
//             {isAiGenerated && (
//               <span style={{ color: '#6366f1', fontSize: '12px', marginLeft: '8px' }}>
//                 ✨ AI Generated
//               </span>
//             )}
//           </label>

//           {loadingQuestions ? (
//             <div style={{ color: '#475569', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
//               {difficulty === 'advanced' || isCustomField
//                 ? '✨ Generating questions with Groq AI...'
//                 : 'Loading questions...'}
//             </div>
//           ) : (
//             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//               {questions.map((q, i) => (
//                 <div key={i} onClick={() => setQuestion(q)} style={{
//                   padding: '14px 18px',
//                   background: question === q ? '#1d4ed820' : '#1e293b',
//                   border: `1px solid ${question === q ? '#3b82f6' : '#334155'}`,
//                   borderRadius: '10px',
//                   color: question === q ? '#93c5fd' : '#cbd5e1',
//                   fontSize: '14px',
//                   lineHeight: '1.6',
//                   cursor: 'pointer',
//                   transition: 'all 0.2s',
//                 }}>
//                   <span style={{ color: '#475569', marginRight: '10px', fontSize: '12px' }}>
//                     Q{i + 1}
//                   </span>
//                   {q}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Selected Question Display */}
//         {question && (
//           <div style={{
//             background: '#1e3a5f',
//             border: '1px solid #3b82f6',
//             borderRadius: '10px',
//             padding: '14px 18px',
//             marginBottom: '20px',
//             color: '#93c5fd',
//             fontSize: '14px',
//           }}>
//             <span style={{ color: '#475569', marginRight: '8px', fontSize: '12px' }}>Selected:</span>
//             {question}
//           </div>
//         )}

//         {/* Answer Input */}
//         <div style={{ marginBottom: '20px' }}>
//           <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
//             Your Answer
//           </label>
//           <textarea
//             value={answer}
//             onChange={(e) => setAnswer(e.target.value)}
//             placeholder="Type your answer here... aim for at least 50 words."
//             rows={8}
//             style={{
//               width: '100%',
//               padding: '14px',
//               background: '#1e293b',
//               color: '#e2e8f0',
//               border: '1px solid #334155',
//               borderRadius: '10px',
//               fontSize: '15px',
//               resize: 'vertical',
//               lineHeight: '1.6',
//             }}
//           />
//           <div style={{ color: '#475569', fontSize: '13px', marginTop: '6px', textAlign: 'right' }}>
//             {answer.trim().split(/\s+/).filter(Boolean).length} words
//           </div>
//         </div>

//         {/* Error */}
//         {error && (
//           <div style={{
//             background: '#450a0a',
//             border: '1px solid #ef4444',
//             borderRadius: '10px',
//             padding: '14px',
//             color: '#ef4444',
//             marginBottom: '20px',
//             fontSize: '14px',
//           }}>
//             {error}
//           </div>
//         )}

//         {/* Analyze Button */}
//         <button onClick={handleAnalyze} disabled={loading} style={{
//           width: '100%',
//           padding: '16px',
//           background: loading ? '#1e3a5f' : '#3b82f6',
//           color: '#fff',
//           borderRadius: '10px',
//           fontSize: '16px',
//           fontWeight: 'bold',
//           transition: 'background 0.2s',
//           marginBottom: '40px',
//         }}>
//           {loading ? 'Analyzing...' : 'Analyze My Answer'}
//         </button>

//         {/* Results */}
//         {result && (
//           <div>
//             <ScoreCard score={result.final_score} breakdown={result.breakdown} />
//             <FeedbackCard
//               feedback={result.feedback}
//               structureDetected={result.structure_detected}
//               questionType={result.question_type}
//               confidenceLevel={result.confidence_level}
//               wordCount={result.word_count}
//               fillerCount={result.filler_count}
//             />
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default Home;


import React, { useState, useEffect } from 'react';
import ScoreCard from '../components/ScoreCard';
import FeedbackCard from '../components/FeedbackCard';

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
const cardHover = '#1a1a1a';

export default function Home() {
  const [question, setQuestion]         = useState('');
  const [answer, setAnswer]             = useState('');
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [category, setCategory]         = useState('behavioral');
  const [field, setField]               = useState('Artificial Intelligence');
  const [customField, setCustomField]   = useState('');
  const [difficulty, setDifficulty]     = useState('easy');
  const [questions, setQuestions]       = useState([]);
  const [loadingQ, setLoadingQ]         = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

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
      fd.append('use_groq', isAiGenerated ? 'true' : 'false');
      const res = await fetch('http://127.0.0.1:8000/api/analyze/text', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Server error.');
      setResult(await res.json());
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

      {/* Header */}
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
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Field Selector */}
        <div style={{
          background: card,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Select Your Field
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            {FIELDS.map(f => (
              <button key={f} onClick={() => { setField(f); setCustomField(''); setResult(null); }} style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
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
          background: card,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}>
          <div>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Category</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['behavioral', 'technical'].map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  flex: 1, padding: '10px',
                  borderRadius: '8px', fontSize: '13px',
                  fontWeight: category === cat ? 'bold' : 'normal',
                  background: category === cat ? orange : '#1a1a1a',
                  color: category === cat ? '#000' : '#888',
                  border: `1px solid ${category === cat ? orange : '#333'}`,
                  boxShadow: category === cat ? `0 0 14px rgba(249,115,22,0.35)` : 'none',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Difficulty</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { d: 'easy',     color: '#16a34a' },
                { d: 'medium',   color: '#d97706' },
                { d: 'hard',     color: '#dc2626' },
                { d: 'advanced', color: orange    },
              ].map(({ d, color }) => (
                <button key={d} onClick={() => setDifficulty(d)} style={{
                  flex: 1, padding: '10px 4px',
                  borderRadius: '8px', fontSize: '12px',
                  fontWeight: difficulty === d ? 'bold' : 'normal',
                  background: difficulty === d ? color : '#1a1a1a',
                  color: difficulty === d ? '#fff' : '#888',
                  border: `1px solid ${difficulty === d ? color : '#333'}`,
                  boxShadow: difficulty === d ? `0 0 12px ${color}55` : 'none',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}>
                  {d === 'advanced' ? 'advanced (✨AI)' : d}
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
          background: card,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
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
                  fontSize: '14px',
                  lineHeight: '1.6',
                  cursor: 'pointer',
                  boxShadow: question === q ? `0 0 16px rgba(249,115,22,0.2)` : 'none',
                  transition: 'all 0.2s',
                }}>
                  <span style={{ color: '#333', marginRight: '10px', fontSize: '12px' }}>Q{i+1}</span>
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
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            color: orange,
            fontSize: '14px',
            boxShadow: `0 0 20px rgba(249,115,22,0.15)`,
          }}>
            <span style={{ color: '#555', marginRight: '8px', fontSize: '12px' }}>Selected:</span>
            {question}
          </div>
        )}

        {/* Answer */}
        <div style={{
          background: card,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
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
              border: '1px solid #222',
              borderRadius: '10px', fontSize: '15px',
              resize: 'vertical', lineHeight: '1.7',
            }}
          />
          <div style={{ color: '#333', fontSize: '13px', marginTop: '6px', textAlign: 'right' }}>
            {answer.trim().split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#1a0a0a',
            border: '1px solid #dc2626',
            borderRadius: '10px',
            padding: '14px',
            color: '#ef4444',
            marginBottom: '20px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Analyze Button */}
        <button onClick={handleAnalyze} disabled={loading} style={{
          ...glowBtn,
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          marginBottom: '40px',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Analyzing...' : '⚡ Analyze My Answer'}
        </button>

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