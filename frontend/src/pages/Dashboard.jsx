import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { conferenceApi, agentApi, submissionApi } from '../lib/api';
import Navbar from '../components/Navbar';
import ConferenceCard from '../components/ConferenceCard';
import EvidenceModal from '../components/EvidenceModal';
import AddToPipelineModal from '../components/AddToPipelineModal';
import AgentConfigModal from '../components/AgentConfigModal';
import { Play, Loader2, ArrowRight, Sliders, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { mongoUser, user, updatePreferences } = useAuth();

  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Modals state
  const [selectedConference, setSelectedConference] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, matchesRes, subsRes] = await Promise.all([
        conferenceApi.getStats(),
        agentApi.getMatches({ status: 'unread' }),
        submissionApi.getAll()
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (matchesRes.data?.data) setMatches(matchesRes.data.data);
      if (subsRes.data?.data) setSubmissions(subsRes.data.data);
    } catch (err) {
      console.warn('Dashboard fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunAgentScan = async () => {
    setScanning(true);
    try {
      await agentApi.triggerScan();
      await fetchDashboardData();
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
      <Navbar unreadCount={matches.length} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#161a22]">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {mongoUser?.name || 'Academic Faculty'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {mongoUser?.institution || 'Research Institute'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAgentConfigOpen(true)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-[#0e1117] hover:bg-[#151922] border border-[#1e232d] flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3 h-3 text-slate-400" />
              <span>Edit Criteria</span>
            </button>

            <button
              onClick={handleRunAgentScan}
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
                  <span>Run Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Clean Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="ag-card p-4 border border-[#161a22]">
            <span className="text-[11px] font-medium text-slate-400 block">Catalog Volume</span>
            <div className="text-2xl font-semibold text-white mt-1">
              {stats?.totalConferences || 8}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              {stats?.verifiedTier1 || 6} verified accredited
            </span>
          </div>

          <div className="ag-card p-4 border border-[#161a22]">
            <span className="text-[11px] font-medium text-slate-400 block">Avg Credibility</span>
            <div className="text-2xl font-semibold text-slate-100 mt-1">
              {stats?.averageTrustScore || 78}<span className="text-xs text-slate-500 font-normal">/100</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Heuristic verified
            </span>
          </div>

          <Link to="/dashboard/inbox" className="ag-card p-4 border border-[#161a22] hover:border-[#282e3b] transition-colors group block">
            <span className="text-[11px] font-medium text-slate-400 block">Agent Matches</span>
            <div className="text-2xl font-semibold text-white mt-1 flex items-center justify-between">
              <span>{matches.length}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
            </div>
            <span className="text-[10px] text-blue-400 font-mono mt-1 block">
              View in inbox &rarr;
            </span>
          </Link>

          <Link to="/dashboard/kanban" className="ag-card p-4 border border-[#161a22] hover:border-[#282e3b] transition-colors group block">
            <span className="text-[11px] font-medium text-slate-400 block">Tracked Papers</span>
            <div className="text-2xl font-semibold text-white mt-1 flex items-center justify-between">
              <span>{submissions.length}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Manuscript pipeline &rarr;
            </span>
          </Link>
        </div>

        {/* Minimalist Active Criteria Bar */}
        <div className="ag-panel p-4 border border-[#161a22] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 truncate">
            <span className="text-slate-500 uppercase font-mono text-[10px] shrink-0">Current Criteria:</span>
            <span className="text-slate-200 truncate">
              {mongoUser?.agent_prompt || 'Default research prompt'}
            </span>
          </div>
          <button
            onClick={() => setIsAgentConfigOpen(true)}
            className="text-slate-400 hover:text-white shrink-0 text-xs font-medium"
          >
            Update
          </button>
        </div>

        {/* Tracked Submission Deadlines (if any) */}
        {submissions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Approaching Deadlines
              </h2>
              <Link to="/dashboard/kanban" className="text-xs text-slate-400 hover:text-white">
                View board &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {submissions.slice(0, 3).map((sub) => {
                const conf = sub.conference_id || {};
                const days = sub.target_date
                  ? Math.ceil((new Date(sub.target_date) - new Date()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <div key={sub._id} className="ag-card p-3 border border-[#161a22]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-xs font-semibold text-white">{conf.acronym}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#13161d] text-slate-400 border border-[#1d222c]">
                        {sub.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 truncate font-medium">{sub.paper_title}</div>
                    {days !== null && (
                      <div className={`text-[11px] font-mono mt-2 ${days <= 7 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {days <= 0 ? 'Due today' : `${days} days remaining`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Conferences Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Matching Conferences
            </h2>
            <Link to="/dashboard/explorer" className="text-xs text-slate-400 hover:text-white">
              All conferences &rarr;
            </Link>
          </div>

          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.slice(0, 3).map((m) => (
                m.conference_id && (
                  <ConferenceCard
                    key={m._id}
                    conference={m.conference_id}
                    onInspectEvidence={handleOpenEvidence}
                    onAddToPipeline={handleOpenPipeline}
                  />
                )
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-lg ag-panel text-center space-y-2 border border-[#161a22]">
              <div className="text-xs text-slate-400">No active matches in inbox.</div>
              <button
                onClick={handleRunAgentScan}
                disabled={scanning}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#141820] hover:bg-[#1a202c] border border-[#232938]"
              >
                Scan Catalog
              </button>
            </div>
          )}
        </div>

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
        onSuccess={fetchDashboardData}
      />

      <AgentConfigModal
        isOpen={isAgentConfigOpen}
        onClose={() => setIsAgentConfigOpen(false)}
        currentPrompt={mongoUser?.agent_prompt}
        onSave={(newPrompt) => updatePreferences({ agent_prompt: newPrompt })}
        onTriggerScan={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
