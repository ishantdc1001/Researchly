import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ConferenceCard from '../components/ConferenceCard';
import EvidenceModal from '../components/EvidenceModal';
import AddToPipelineModal from '../components/AddToPipelineModal';
import { conferenceApi } from '../lib/api';
import { Search, Loader2 } from 'lucide-react';

const PUBLISHERS = ['All', 'IEEE', 'ACM', 'Springer', 'ACL', 'WASET'];

const ConferenceExplorer = () => {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [publisher, setPublisher] = useState('All');
  const [minScore, setMinScore] = useState(0);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [excludePredatory, setExcludePredatory] = useState(false);

  // Modals
  const [selectedConference, setSelectedConference] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);

  const fetchConferences = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (publisher !== 'All') params.publisher = publisher;
      if (minScore > 0) params.minTrustScore = minScore;
      if (upcomingOnly) params.upcomingOnly = 'true';

      const res = await conferenceApi.getAll(params);
      let list = res.data?.data || [];

      if (excludePredatory) {
        list = list.filter(c => !c.flags?.some(f => f.includes('PREDATORY')));
      }

      setConferences(list);
    } catch (err) {
      console.error('Error fetching conferences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConferences();
  }, [publisher, minScore, upcomingOnly, excludePredatory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConferences();
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
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#161a22]">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Conference Catalog
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Audited academic proceedings and submission deadlines
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {conferences.length} records available
          </div>
        </div>

        {/* Search & Filter Bar - Minimalist & Compact */}
        <div className="ag-panel p-3 border border-[#161a22] space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, acronym, or keywords..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#2f3747]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#161b24] hover:bg-[#1e2430] border border-[#232938] rounded-md transition-colors"
            >
              Filter
            </button>
          </form>

          {/* Secondary Controls Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 uppercase font-mono">Publisher:</span>
              <select
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="bg-[#0d0f14] border border-[#1a1e26] rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
              >
                {PUBLISHERS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 uppercase font-mono">Min Trust:</span>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-24 accent-slate-400"
              />
              <span className="font-mono text-xs text-slate-300">{minScore}</span>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={excludePredatory}
                onChange={(e) => setExcludePredatory(e.target.checked)}
                className="rounded border-[#1a1e26] bg-[#0d0f14]"
              />
              <span className="text-slate-300">Exclude predatory</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={upcomingOnly}
                onChange={(e) => setUpcomingOnly(e.target.checked)}
                className="rounded border-[#1a1e26] bg-[#0d0f14]"
              />
              <span className="text-slate-300">Active deadlines</span>
            </label>
          </div>
        </div>

        {/* Conferences Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-xs">Loading records...</p>
          </div>
        ) : conferences.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conferences.map((conf) => (
              <ConferenceCard
                key={conf._id}
                conference={conf}
                onInspectEvidence={handleOpenEvidence}
                onAddToPipeline={handleOpenPipeline}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 ag-panel border border-[#161a22]">
            No conferences matching the active query.
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
        onSuccess={fetchConferences}
      />
    </div>
  );
};

export default ConferenceExplorer;
