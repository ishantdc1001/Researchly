import React, { useState } from 'react';
import { X, Play, Loader2, Check } from 'lucide-react';
import { agentApi } from '../lib/api';

const PROMPT_TEMPLATES = [
  {
    title: 'NLP & AI in Europe',
    prompt: 'Find high-impact IEEE, ACM, and ACL conferences in Europe with strong NLP/LLM tracks, deadlines in the next 6 months, and verified Scopus indexing.'
  },
  {
    title: 'Budget-friendly Computer Vision',
    prompt: 'Looking for peer-reviewed Computer Vision conferences with affordable student registration fees (under $450 USD) or hybrid virtual presentation options.'
  },
  {
    title: 'HCI & Interactive Computing',
    prompt: 'Discover ACM-sponsored conferences in Human-Computer Interaction, user experience, and conversational interfaces with upcoming CFP deadlines.'
  }
];

const AgentConfigModal = ({ isOpen, onClose, currentPrompt, onSave, onTriggerScan }) => {
  if (!isOpen) return null;

  const [prompt, setPrompt] = useState(currentPrompt || '');
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await agentApi.configure(prompt);
      onSave(prompt);
      setStatusMessage({ type: 'success', text: 'Criteria saved.' });
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update criteria.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    setStatusMessage(null);
    try {
      await agentApi.configure(prompt);
      onSave(prompt);

      const res = await agentApi.triggerScan();
      setStatusMessage({
        type: 'success',
        text: `Scan complete: ${res.data.matchesCount || 0} conferences evaluated.`
      });
      if (onTriggerScan) {
        onTriggerScan();
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Scan error: ' + (err.response?.data?.error || err.message) });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-[#090b0f] border border-[#1a1e27] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#161a22]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Agent Search Criteria
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural language prompt for autonomous background conference matching
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-[#151922] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {statusMessage && (
            <div
              className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
              }`}
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Natural Language Constraints
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Find me IEEE conferences in Europe related to NLP with low fees and deadlines in the next 3 months..."
              className="w-full px-3 py-2 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#2f3747] resize-none leading-relaxed"
            />
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase text-slate-500">
              Presets:
            </span>
            <div className="space-y-1.5">
              {PROMPT_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(tmpl.prompt)}
                  className="w-full text-left p-2 rounded bg-[#0d0f14] hover:bg-[#12151c] border border-[#161a22] transition-colors text-xs group"
                >
                  <div className="font-medium text-slate-300 group-hover:text-white">
                    {tmpl.title}
                  </div>
                  <div className="text-slate-500 text-[11px] truncate mt-0.5">
                    {tmpl.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#161a22] flex items-center justify-between text-xs">
          <button
            onClick={handleSave}
            disabled={saving || scanning}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#12151c] hover:bg-[#171c26] border border-[#1e232f] rounded-md transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          
          <button
            onClick={handleRunScan}
            disabled={scanning || saving}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2d3748] rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {scanning ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-slate-300" />
                <span>Run Scan Now</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AgentConfigModal;
