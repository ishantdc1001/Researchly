import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EvidenceModal from '../components/EvidenceModal';
import AddToPipelineModal from '../components/AddToPipelineModal';
import AgentConfigModal from '../components/AgentConfigModal';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { useAuth } from '../context/AuthContext';
import { agentApi } from '../lib/api';
import {
  Bookmark,
  Trash2,
  Plus,
  Play,
  Loader2,
  Sliders,
  Calendar,
  MapPin
} from 'lucide-react';

const AgentInbox = () => {
  const { mongoUser, updatePreferences } = useAuth();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('unread');
  const [scanning, setScanning] = useState(false);

  // Modals
  const [selectedConference, setSelectedConference] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await agentApi.getMatches({ status: statusFilter });
      setMatches(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [statusFilter]);

  const handleUpdateStatus = async (matchId, newStatus) => {
    try {
      await agentApi.updateMatchStatus(matchId, newStatus);
      setMatches(prev => prev.filter(m => m._id !== matchId));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    try {
      await agentApi.triggerScan();
      setStatusFilter('unread');
      await fetchMatches();
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleOpenEvidence = (conf) => {
    setSelectedConference(conf);
    setIsEvidenceOpen(true);
  };

  const handleOpenPipeline = (conf) => {
    setSelectedConference(conf);
    setIsPipelineOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col font-sans">
      <Navbar unreadCount={statusFilter === 'unread' ? matches.length : 0} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#161a22]">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Agent Match Inbox
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Conferences selected based on your research constraints
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAgentConfigOpen(true)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-[#0e1117] hover:bg-[#151922] border border-[#1e232d] flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3 h-3 text-slate-400" />
              <span>Criteria</span>
            </button>

            <button
              onClick={handleRunScan}
              disabled={scanning}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2d3748] flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current text-slate-300" />
                  <span>Scan Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 text-xs border-b border-[#161a22] pb-2">
          {[
            { id: 'unread', label: 'Unread' },
            { id: 'saved', label: 'Saved' },
            { id: 'dismissed', label: 'Dismissed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === tab.id
                  ? 'bg-[#141822] text-white border border-[#212736]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Matches Feed */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-xs">Evaluating matching records...</p>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((match) => {
              const conf = match.conference_id;
              if (!conf) return null;
              const nextDeadline = conf.deadlines?.[0];

              return (
                <div
                  key={match._id}
                  className="ag-card p-4 sm:p-5 border border-[#161a22] space-y-3"
                >
                  {/* Top Bar: Acronym, Publisher, Match percentage, Trust Score */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-white">
                        {conf.acronym}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {conf.publisher}
                      </span>
                      <span className="text-slate-700">•</span>
                      <TrustScoreBadge
                        score={conf.trust_score}
                        onClick={() => handleOpenEvidence(conf)}
                      />
                    </div>

                    <div className="font-mono text-xs text-blue-400 font-medium">
                      {match.match_score || 85}% match
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-100">
                      {conf.name}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>{conf.location?.city || 'Online'}, {conf.location?.country || ''}</span>
                      {nextDeadline && (
                        <>
                          <span className="text-slate-700">•</span>
                          <span>Deadline: {new Date(nextDeadline.date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Clean Advisor Rationale Quote */}
                  <div className="border-l-2 border-[#2b3342] pl-3 py-1 text-xs text-slate-300 leading-relaxed font-normal bg-[#0a0c10]/60 rounded-r">
                    {match.match_reasoning}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#161a22] text-xs">
                    <button
                      onClick={() => handleOpenEvidence(conf)}
                      className="text-slate-400 hover:text-white transition-colors text-[11px]"
                    >
                      Audit Trail
                    </button>

                    <div className="flex items-center gap-2">
                      {statusFilter === 'unread' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(match._id, 'saved')}
                            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Save"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(match._id, 'dismissed')}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Dismiss"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {statusFilter !== 'unread' && (
                        <button
                          onClick={() => handleUpdateStatus(match._id, 'unread')}
                          className="text-[11px] text-slate-400 hover:text-white px-2 py-1"
                        >
                          Restore
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenPipeline(conf)}
                        className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-[#161b24] hover:bg-[#1e2430] border border-[#232938] text-slate-200 hover:text-white transition-colors"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                        <span>Track</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 ag-panel border border-[#161a22]">
            No {statusFilter} matches found in agent inbox.
          </div>
        )}

      </main>

      {/* Modals */}
      <EvidenceModal
        conference={selectedConference}
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        onAddToPipeline={handleOpenPipeline}
      />

      <AddToPipelineModal
        conference={selectedConference}
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
        onSuccess={fetchMatches}
      />

      <AgentConfigModal
        isOpen={isAgentConfigOpen}
        onClose={() => setIsAgentConfigOpen(false)}
        currentPrompt={mongoUser?.agent_prompt}
        onSave={(newPrompt) => updatePreferences({ agent_prompt: newPrompt })}
        onTriggerScan={fetchMatches}
      />
    </div>
  );
};

export default AgentInbox;
