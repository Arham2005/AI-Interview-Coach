// import React from 'react';

// const ScoreCard = ({ score, breakdown }) => {
//   const getScoreColor = (s) => {
//     if (s >= 80) return '#22c55e';
//     if (s >= 60) return '#f59e0b';
//     return '#ef4444';
//   };

//   const metrics = [
//     { label: 'Structure',  value: breakdown?.structure },
//     { label: 'Content',    value: breakdown?.content },
//     { label: 'Confidence', value: breakdown?.confidence },
//     { label: 'Clarity',    value: breakdown?.clarity },
//   ];

//   return (
//     <div style={{
//       background: '#1e293b',
//       borderRadius: '16px',
//       padding: '32px',
//       textAlign: 'center',
//       marginBottom: '24px',
//     }}>
//       <h2 style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '16px' }}>
//         Overall Score
//       </h2>

//       <div style={{
//         fontSize: '80px',
//         fontWeight: 'bold',
//         color: getScoreColor(score),
//         lineHeight: 1,
//         marginBottom: '8px',
//       }}>
//         {score}
//       </div>

//       <div style={{ color: '#64748b', marginBottom: '32px' }}>out of 100</div>

//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: 'repeat(2, 1fr)',
//         gap: '16px',
//       }}>
//         {metrics.map((metric) => (
//           <div key={metric.label} style={{
//             background: '#0f172a',
//             borderRadius: '12px',
//             padding: '16px',
//           }}>
//             <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
//               {metric.label}
//             </div>
//             <div style={{
//               fontSize: '28px',
//               fontWeight: 'bold',
//               color: getScoreColor(metric.value),
//             }}>
//               {metric.value}
//             </div>
//             <div style={{
//               height: '4px',
//               background: '#1e293b',
//               borderRadius: '2px',
//               marginTop: '8px',
//             }}>
//               <div style={{
//                 height: '100%',
//                 width: `${metric.value}%`,
//                 background: getScoreColor(metric.value),
//                 borderRadius: '2px',
//                 transition: 'width 1s ease',
//               }} />
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ScoreCard;


import React from 'react';

const orange = '#f97316';
const orangeDark = '#ea580c';

const ScoreCard = ({ score, breakdown }) => {
  const getColor = (s) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return orange;
    return '#ef4444';
  };

  const metrics = [
    { label: 'Structure',  value: breakdown?.structure },
    { label: 'Content',    value: breakdown?.content },
    { label: 'Confidence', value: breakdown?.confidence },
    { label: 'Clarity',    value: breakdown?.clarity },
  ];

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #222',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '20px',
      boxShadow: `0 0 40px rgba(249,115,22,0.1)`,
      textAlign: 'center',
    }}>
      <p style={{ color: '#555', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
        Overall Score
      </p>
      <div style={{
        fontSize: '90px',
        fontWeight: 'bold',
        color: getColor(score),
        lineHeight: 1,
        marginBottom: '4px',
        textShadow: `0 0 30px ${getColor(score)}55`,
      }}>
        {score}
      </div>
      <div style={{ color: '#333', marginBottom: '32px' }}>out of 100</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ color: '#555', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {m.label}
            </div>
            <div style={{
              fontSize: '32px', fontWeight: 'bold',
              color: getColor(m.value),
              textShadow: `0 0 20px ${getColor(m.value)}44`,
            }}>
              {m.value}
            </div>
            <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '2px', marginTop: '10px' }}>
              <div style={{
                height: '100%',
                width: `${m.value}%`,
                background: `linear-gradient(90deg, ${orangeDark}, ${getColor(m.value)})`,
                borderRadius: '2px',
                boxShadow: `0 0 8px ${getColor(m.value)}66`,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreCard;