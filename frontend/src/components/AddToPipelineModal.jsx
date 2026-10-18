import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { submissionApi } from '../lib/api';

const AddToPipelineModal = ({ isOpen, onClose, conference, onSuccess }) => {
  if (!isOpen || !conference) return null;

  const defaultDate = conference.deadlines?.[0]?.date
    ? new Date(conference.deadlines[0].date).toISOString().split('T')[0]
    : '';

  const [paperTitle, setPaperTitle] = useState(`Paper for ${conference.acronym}`);
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [status, setStatus] = useState('Shortlisted');
  const [abstract, setAbstract] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await submissionApi.create({
        conference_id: conference._id || conference.id,
        paper_title: paperTitle,
        target_date: targetDate ? new Date(targetDate) : null,
        status,
        abstract
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#090b0f] border border-[#1a1e27] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#161a22]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Track in Pipeline</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add manuscript target for <strong className="text-slate-200">{conference.acronym}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-[#151922] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          {error && (
            <div className="p-2 rounded bg-rose-500/5 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Working Paper Title
            </label>
            <input
              type="text"
              required
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 focus:outline-none focus:border-[#2f3747]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 focus:outline-none focus:border-[#2f3747]"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Initial Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 focus:outline-none focus:border-[#2f3747]"
              >
                <option value="Shortlisted">Shortlisted</option>
                <option value="Preparing">Preparing Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Accepted">Accepted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Key experiments, co-authors, milestones..."
              className="w-full px-3 py-1.5 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 focus:outline-none focus:border-[#2f3747] resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#161a22]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2d3748] rounded-md flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Add to Pipeline</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddToPipelineModal;
