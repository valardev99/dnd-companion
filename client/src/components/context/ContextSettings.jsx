import React from 'react';

function ContextSettings() {
  return (
    <div>
      <h3>Help</h3>
      <div className="card">
        <p style={{fontSize:'0.78rem',color:'var(--silver)',lineHeight:1.6}}>
          This companion app runs alongside Claude as your AI Dungeon Master. Configure your API key, then chat with the DM in the left panel. The companion panels update automatically.
        </p>
      </div>
    </div>
  );
}

export default ContextSettings;
