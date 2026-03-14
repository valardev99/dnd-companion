import React from 'react';

function ConditionTag({ condition }) {
  const typeClass = condition.type === 'buff' ? 'buff' : condition.type === 'debuff' ? 'debuff' : 'neutral-tag';
  return <span className={`condition-tag ${typeClass}`}>{condition.icon} {condition.name}</span>;
}

export default ConditionTag;
