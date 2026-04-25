// import React from 'react';

// const structureLabels = {
//   star: {
//     situation: 'Situation',
//     task: 'Task',
//     action: 'Action',
//     result: 'Result',
//   },
//   intro: {
//     background: 'Background',
//     skills: 'Skills',
//     goals: 'Goals',
//   },
//   strength: {
//     trait: 'Trait',
//     example: 'Example',
//     weakness: 'Weakness',
//   },
//   technical: {
//     definition: 'Definition',
//     explanation: 'Explanation',
//     example: 'Example',
//   },
// };

// const questionTypeLabels = {
//   star:      'STAR Method Breakdown',
//   intro:     'Intro Structure Breakdown',
//   strength:  'Strength/Weakness Breakdown',
//   technical: 'Technical Answer Breakdown',
// };

// const FeedbackCard = ({ feedback, structureDetected, questionType, confidenceLevel, wordCount, fillerCount }) => {
//   const typeStyles = {
//     error: {
//       background: '#450a0a',
//       border: '1px solid #ef4444',
//       icon: '✗',
//       iconColor: '#ef4444',
//     },
//     warning: {
//       background: '#431407',
//       border: '1px solid #f59e0b',
//       icon: '⚠',
//       iconColor: '#f59e0b',
//     },
//     success: {
//       background: '#052e16',
//       border: '1px solid #22c55e',
//       icon: '✓',
//       iconColor: '#22c55e',
//     },
//   };

//   const labels = structureLabels[questionType] || structureLabels.star;
//   const breakdownTitle = questionTypeLabels[questionType] || 'Structure Breakdown';

//   return (
//     <div style={{
//       background: '#1e293b',
//       borderRadius: '16px',
//       padding: '32px',
//       marginBottom: '24px',
//     }}>

//       {/* Question Type Badge */}
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
//         <h2 style={{ color: '#e2e8f0', fontSize: '20px' }}>Feedback</h2>
//         <span style={{
//           background: '#1d4ed820',
//           border: '1px solid #3b82f6',
//           borderRadius: '8px',
//           padding: '4px 12px',
//           color: '#3b82f6',
//           fontSize: '12px',
//           textTransform: 'capitalize',
//         }}>
//           {questionType} question
//         </span>
//       </div>

//       {/* Feedback Messages */}
//       <div style={{ marginBottom: '32px' }}>
//         {feedback?.map((item, index) => {
//           const style = typeStyles[item.type] || typeStyles.warning;
//           return (
//             <div key={index} style={{
//               background: style.background,
//               border: style.border,
//               borderRadius: '10px',
//               padding: '14px 18px',
//               marginBottom: '12px',
//               display: 'flex',
//               alignItems: 'flex-start',
//               gap: '12px',
//             }}>
//               <span style={{
//                 color: style.iconColor,
//                 fontWeight: 'bold',
//                 fontSize: '16px',
//                 marginTop: '1px',
//               }}>
//                 {style.icon}
//               </span>
//               <span style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6' }}>
//                 {item.message}
//               </span>
//             </div>
//           );
//         })}
//       </div>

//       {/* Structure Breakdown */}
//       <h3 style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '15px' }}>
//         {breakdownTitle}
//       </h3>
//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: `repeat(${Object.keys(labels).length}, 1fr)`,
//         gap: '12px',
//         marginBottom: '32px',
//       }}>
//         {structureDetected && Object.entries(labels).map(([key, label]) => {
//           const detected = structureDetected[key];
//           return (
//             <div key={key} style={{
//               background: detected ? '#052e16' : '#1a0a0a',
//               border: `1px solid ${detected ? '#22c55e' : '#ef4444'}`,
//               borderRadius: '10px',
//               padding: '12px',
//               textAlign: 'center',
//             }}>
//               <div style={{ fontSize: '20px', marginBottom: '4px' }}>
//                 {detected ? '✓' : '✗'}
//               </div>
//               <div style={{
//                 color: detected ? '#22c55e' : '#ef4444',
//                 fontSize: '13px',
//                 fontWeight: 'bold',
//               }}>
//                 {label}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Stats Row */}
//       <h3 style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '15px' }}>
//         Answer Stats
//       </h3>
//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: 'repeat(3, 1fr)',
//         gap: '12px',
//       }}>
//         {[
//           { label: 'Word Count',   value: wordCount },
//           { label: 'Filler Words', value: fillerCount },
//           { label: 'Confidence',   value: confidenceLevel },
//         ].map((stat) => (
//           <div key={stat.label} style={{
//             background: '#0f172a',
//             borderRadius: '10px',
//             padding: '16px',
//             textAlign: 'center',
//           }}>
//             <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>
//               {stat.label}
//             </div>
//             <div style={{ color: '#e2e8f0', fontSize: '20px', fontWeight: 'bold' }}>
//               {stat.value}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default FeedbackCard;


import React from 'react';

const orange = '#f97316';

const structureLabels = {
  star:      { situation: 'Situation', task: 'Task', action: 'Action', result: 'Result' },
  intro:     { background: 'Background', skills: 'Skills', goals: 'Goals' },
  strength:  { trait: 'Trait', example: 'Example', weakness: 'Weakness' },
  technical: { definition: 'Definition', explanation: 'Explanation', example: 'Example' },
};

const questionTypeLabels = {
  star:      'STAR Method Breakdown',
  intro:     'Intro Structure Breakdown',
  strength:  'Strength/Weakness Breakdown',
  technical: 'Technical Answer Breakdown',
};

const FeedbackCard = ({ feedback, structureDetected, questionType, confidenceLevel, wordCount, fillerCount }) => {
  const typeStyles = {
    error:   { background: '#1a0505', border: '1px solid #ef4444', icon: '✗', color: '#ef4444' },
    warning: { background: '#1a0f00', border: `1px solid ${orange}`, icon: '⚠', color: orange },
    success: { background: '#051a0a', border: '1px solid #22c55e', icon: '✓', color: '#22c55e' },
  };

  const labels = structureLabels[questionType] || structureLabels.star;
  const breakdownTitle = questionTypeLabels[questionType] || 'Structure Breakdown';

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #222',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px',
      boxShadow: `0 0 40px rgba(249,115,22,0.08)`,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ color: '#fff', fontSize: '20px' }}>Feedback</h2>
        <span style={{
          background: 'rgba(249,115,22,0.1)',
          border: `1px solid ${orange}`,
          borderRadius: '8px',
          padding: '4px 12px',
          color: orange,
          fontSize: '12px',
          textTransform: 'capitalize',
        }}>
          {questionType} question
        </span>
      </div>

      {/* Feedback Messages */}
      <div style={{ marginBottom: '32px' }}>
        {feedback?.map((item, i) => {
          const s = typeStyles[item.type] || typeStyles.warning;
          return (
            <div key={i} style={{
              background: s.background,
              border: s.border,
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}>
              <span style={{ color: s.color, fontWeight: 'bold', fontSize: '16px', marginTop: '1px' }}>
                {s.icon}
              </span>
              <span style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>
                {item.message}
              </span>
            </div>
          );
        })}
      </div>

      {/* Structure Breakdown */}
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {breakdownTitle}
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Object.keys(labels).length}, 1fr)`,
        gap: '12px',
        marginBottom: '32px',
      }}>
        {structureDetected && Object.entries(labels).map(([key, label]) => {
          const detected = structureDetected[key];
          return (
            <div key={key} style={{
              background: detected ? '#051a0a' : '#1a0505',
              border: `1px solid ${detected ? '#22c55e' : '#ef4444'}`,
              borderRadius: '10px',
              padding: '14px',
              textAlign: 'center',
              boxShadow: detected ? '0 0 12px rgba(34,197,94,0.15)' : '0 0 12px rgba(239,68,68,0.1)',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>
                {detected ? '✓' : '✗'}
              </div>
              <div style={{
                color: detected ? '#22c55e' : '#ef4444',
                fontSize: '13px',
                fontWeight: 'bold',
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Answer Stats
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Word Count',   value: wordCount },
          { label: 'Filler Words', value: fillerCount },
          { label: 'Confidence',   value: confidenceLevel },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: '10px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#444', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {stat.label}
            </div>
            <div style={{ color: orange, fontSize: '22px', fontWeight: 'bold' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackCard;