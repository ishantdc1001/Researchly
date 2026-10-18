import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EvidenceModal from '../components/EvidenceModal';
import { submissionApi } from '../lib/api';
import {
  Calendar,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Loader2
} from 'lucide-react';

const COLUMNS = [
  { id: 'Shortlisted', label: 'Shortlisted' },
  { id: 'Preparing', label: 'Preparing Draft' },
  { id: 'Submitted', label: 'Under Review' },
  { id: 'Accepted', label: 'Accepted' }
];

const KanbanPipeline = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConference, setSelectedConference] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const res = await submissionApi.getAll();
      setSubmissions(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleMoveStage = async (id, currentStatus, direction) => {
    const statusOrder = ['Shortlisted', 'Preparing', 'Submitted', 'Accepted'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= statusOrder.length) return;
    const newStatus = statusOrder[nextIndex];

    try {
      setSubmissions(prev =>
        prev.map(s => (s._id === id ? { ...s, status: newStatus } : s))
      );
      await submissionApi.update(id, { status: newStatus });
    } catch (err) {
      console.error('Error updating stage:', err);
      fetchSubmissions();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove manuscript from pipeline?')) return;
    try {
      setSubmissions(prev => prev.filter(s => s._id !== id));
      await submissionApi.delete(id);
    } catch (err) {
      console.error('Error deleting submission:', err);
      fetchSubmissions();
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6 flex flex-col">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#161a22]">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Submission Pipeline
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Track manuscript drafting and peer review milestones
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {submissions.length} manuscripts active
          </div>
        </div>

        {/* Clean Minimal Kanban Columns */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2 py-20">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-xs">Loading pipeline...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 items-start">
            {COLUMNS.map((col) => {
              const colSubs = submissions.filter(s => s.status === col.id);

              return (
                <div
                  key={col.id}
                  className="ag-panel p-3 border border-[#161a22] rounded-lg flex flex-col min-h-[480px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161a22]">
                    <span className="text-xs font-medium text-slate-300">
                      {col.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {colSubs.length}
                    </span>
                  </div>

                  {/* Cards inside Column */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {colSubs.map((sub) => {
                      const conf = sub.conference_id || {};
                      const daysLeft = sub.target_date
                        ? Math.ceil((new Date(sub.target_date) - new Date()) / (1000 * 60 * 60 * 24))
                        : null;

                      return (
                        <div
                          key={sub._id}
                          className="ag-card p-3 border border-[#1a1e27] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-white">
                              {conf.acronym || 'CONF'}
                            </span>

                            {daysLeft !== null && (
                              <span className={`text-[10px] font-mono ${daysLeft <= 7 ? 'text-rose-400' : 'text-slate-400'}`}>
                                {daysLeft <= 0 ? 'Due today' : `${daysLeft}d left`}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-medium text-slate-100 leading-snug">
                            {sub.paper_title}
                          </h4>

                          {sub.target_date && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{new Date(sub.target_date).toLocaleDateString()}</span>
                            </div>
                          )}

                          {/* Card Controls */}
                          <div className="pt-2 border-t border-[#161a22] flex items-center justify-between text-xs">
                            <button
                              onClick={() => handleDelete(sub._id)}
                              className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            <div className="flex items-center gap-1">
                              {col.id !== 'Shortlisted' && (
                                <button
                                  onClick={() => handleMoveStage(sub._id, sub.status, 'prev')}
                                  className="p-1 text-slate-400 hover:text-white bg-[#131720] hover:bg-[#1a202c] rounded border border-[#202634] transition-colors"
                                  title="Previous stage"
                                >
                                  <ArrowLeft className="w-2.5 h-2.5" />
                                </button>
                              )}

                              {col.id !== 'Accepted' && (
                                <button
                                  onClick={() => handleMoveStage(sub._id, sub.status, 'next')}
                                  className="p-1 text-slate-400 hover:text-white bg-[#131720] hover:bg-[#1a202c] rounded border border-[#202634] transition-colors"
                                  title="Next stage"
                                >
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}

                    {colSubs.length === 0 && (
                      <div className="h-28 flex items-center justify-center border border-dashed border-[#161a22] rounded text-slate-600 text-[11px] font-mono">
                        Empty stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Evidence Modal */}
      <EvidenceModal
        conference={selectedConference}
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
      />
    </div>
  );
};

export default KanbanPipeline;
