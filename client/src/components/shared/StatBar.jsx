import React from 'react';

function StatBar({ label, current, max, type, showNumbers = true }) {
  const pct = Math.round((current / max) * 100);
  return (
    <div className="stat-bar-container">
      <div className="stat-bar-label">
        <span className="name">{label}</span>
        {showNumbers && <span className="value">{current}/{max}</span>}
      </div>
      <div className="stat-bar">
        <div className={`stat-bar-fill ${type}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default StatBar;
