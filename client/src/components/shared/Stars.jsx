import React from 'react';

function Stars({ count, max = 5 }) {
  return (
    <div className="stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`star ${i < count ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  );
}

export default Stars;
