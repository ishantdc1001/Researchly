import React from 'react';
import { ExternalLink, Plus, MapPin, Calendar } from 'lucide-react';
import TrustScoreBadge from './TrustScoreBadge';

const ConferenceCard = ({ conference, onInspectEvidence, onAddToPipeline }) => {
  const deadlines = conference.deadlines || [];
  const nextDeadline = deadlines[0];

  const daysUntilDeadline = nextDeadline
    ? Math.ceil((new Date(nextDeadline.date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const isPredatory = conference.flags?.some(f => f.includes('PREDATORY') || f.includes('UNREALISTIC'));

  return (
    <div className={`ag-card p-5 flex flex-col justify-between relative ${
      isPredatory ? 'border-rose-900/30 hover:border-rose-800/50' : ''
    }`}>
      
      <div>
        {/* Header: Acronym + Publisher + Trust Badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-white tracking-wide">
              {conference.acronym}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {conference.publisher}
            </span>
          </div>

          <TrustScoreBadge
            score={conference.trust_score}
            onClick={() => onInspectEvidence(conference)}
          />
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-slate-100 mb-2 leading-snug">
          {conference.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-normal">
          {conference.description}
        </p>

        {/* Clean, quiet warning if flagged */}
        {isPredatory && (
          <div className="mb-3 py-1.5 px-2.5 rounded bg-rose-500/5 border border-rose-500/20 text-rose-400 text-[11px] flex items-center gap-1.5">
            <span className="font-mono font-bold">!</span>
            <span>Flagged for unverified peer review or predatory network pattern.</span>
          </div>
        )}

        {/* Clean Metadata Line (Location & Deadline) */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-4 pb-3 border-b border-[#161a22]">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{conference.location?.city || 'Online'}, {conference.location?.country || ''}</span>
          </div>

          {nextDeadline && (
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
              <span className={daysUntilDeadline <= 7 ? 'text-rose-400 font-medium' : 'text-slate-300'}>
                {daysUntilDeadline <= 0 ? 'Due today' : `${daysUntilDeadline}d left`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls: Minimal & Clean */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          onClick={() => onInspectEvidence(conference)}
          className="text-slate-400 hover:text-white transition-colors text-[11px]"
        >
          Audit Details
        </button>

        <div className="flex items-center gap-2">
          {conference.website_url && (
            <a
              href={conference.website_url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
              title="Official Site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={() => onAddToPipeline(conference)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-[#161b24] hover:bg-[#1e2430] border border-[#232938] text-slate-200 hover:text-white transition-colors"
          >
            <Plus className="w-3 h-3 text-slate-400" />
            <span>Track</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default ConferenceCard;
