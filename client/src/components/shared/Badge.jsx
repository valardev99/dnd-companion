import React from 'react';

function Badge({ rarity, children }) {
  return <span className={`badge ${rarity}`}>{children || rarity}</span>;
}

export default Badge;
