import React from 'react';

const TrustScoreBadge = ({ score = 50, showLabel = true, onClick }) => {
  let dotColor = 'bg-emerald-400';
  let textColor = 'text-emerald-400';
  let statusText = 'Verified';
  let badgeBorder = 'border-emerald-500/20 bg-emerald-500/5';

  if (score >= 80) {
    dotColor = 'bg-emerald-400';
    textColor = 'text-emerald-400';
    statusText = 'Verified';
    badgeBorder = 'border-emerald-500/20 bg-emerald-500/5';
  } else if (score >= 50) {
    dotColor = 'bg-amber-400';
    textColor = 'text-amber-400';
    statusText = 'Standard';
    badgeBorder = 'border-amber-500/20 bg-amber-500/5';
  } else {
    dotColor = 'bg-rose-400';
    textColor = 'text-rose-400';
    statusText = 'Flagged';
    badgeBorder = 'border-rose-500/20 bg-rose-500/5';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${badgeBorder} ${
        onClick ? 'cursor-pointer hover:border-slate-500 transition-colors' : 'cursor-default'
      }`}
      title="Click to view Credibility Audit"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="font-semibold text-slate-200">{score}</span>
      {showLabel && (
        <span className={`text-[10px] ${textColor}`}>{statusText}</span>
      )}
    </button>
  );
};

export default TrustScoreBadge;
