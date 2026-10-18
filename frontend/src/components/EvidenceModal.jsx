import React from 'react';
import { X, Check, AlertOctagon, ExternalLink, Mail } from 'lucide-react';
import TrustScoreBadge from './TrustScoreBadge';

const EvidenceModal = ({ conference, isOpen, onClose, onAddToPipeline }) => {
  if (!isOpen || !conference) return null;

  const evidence = conference.evidence_log || [];
  const indexing = conference.verified_indexing || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#090b0f] border border-[#1a1e27] rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#161a22]">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-white">
                {conference.acronym}
              </span>
              <span className="text-slate-600">•</span>
              <TrustScoreBadge score={conference.trust_score} />
            </div>
            <h2 className="text-base font-medium text-white leading-snug">
              {conference.name}
            </h2>
            <p className="text-xs text-slate-400">
              {conference.publisher} &bull; {conference.location?.city || 'Online'}, {conference.location?.country || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-[#151922] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          
          {/* Indexing Claims Table */}
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-2">
              Verified Digital Indexing
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Scopus', status: indexing.scopus },
                { name: 'IEEE Xplore', status: indexing.ieee_xplore },
                { name: 'ACM DL', status: indexing.acm_dl },
                { name: 'Web of Science', status: indexing.wos },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`p-2 rounded border text-xs flex items-center justify-between font-mono ${
                    item.status
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                      : 'bg-[#0d0f14] border-[#161a22] text-slate-500'
                  }`}
                >
                  <span>{item.name}</span>
                  {item.status ? (
                    <span className="text-[10px] font-bold">Yes</span>
                  ) : (
                    <span className="text-[10px]">No</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Audit Trail */}
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-2">
              Heuristic Audit Log ({evidence.length} Rules Evaluated)
            </div>
            <div className="space-y-2">
              {evidence.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border flex items-start gap-3 ${
                    item.passed
                      ? 'bg-[#0d0f14] border-[#161a22]'
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="mt-0.5">
                    {item.passed ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 block" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">{item.rule}</span>
                      <span
                        className={`font-mono text-[11px] ${
                          item.scoreImpact > 0
                            ? 'text-emerald-400'
                            : item.scoreImpact < 0
                            ? 'text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.scoreImpact > 0 ? `+${item.scoreImpact}` : item.scoreImpact} pts
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="pt-2 border-t border-[#161a22] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
            {conference.contact_email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-500" />
                <span>Contact: {conference.contact_email}</span>
              </div>
            )}
            {conference.website_url && (
              <div className="flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3 text-slate-500" />
                <a
                  href={conference.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:underline truncate"
                >
                  {conference.website_url}
                </a>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#161a22] flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            Close
          </button>
          {onAddToPipeline && (
            <button
              onClick={() => {
                onClose();
                onAddToPipeline(conference);
              }}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2d3748]"
            >
              Add to Pipeline &rarr;
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default EvidenceModal;
