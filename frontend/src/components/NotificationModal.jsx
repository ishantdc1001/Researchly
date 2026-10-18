import React, { useState } from 'react';
import { X, Send, Check, Loader2, ExternalLink } from 'lucide-react';
import { notificationApi } from '../lib/api';

const FREQUENCIES = [
  {
    id: 'daily',
    title: 'Daily Digest',
    time: '08:00 AM daily',
    window: 'Deadlines < 7 days',
    desc: 'For active drafting cycles and critical submission deadlines.'
  },
  {
    id: 'weekly',
    title: 'Weekly Digest',
    time: 'Mondays at 08:00 AM',
    window: 'Deadlines < 14 days',
    desc: 'Regular brief summarizing new agent matches and upcoming milestones.'
  },
  {
    id: 'monthly',
    title: 'Monthly Overview',
    time: '1st of every month',
    window: 'Deadlines < 30 days',
    desc: 'High-level roadmap overview for semester planning and lab budgets.'
  },
  {
    id: 'off',
    title: 'Paused',
    time: 'No automated emails',
    window: 'Dashboard only',
    desc: 'Check matches exclusively within the web application.'
  }
];

const NotificationModal = ({ isOpen, onClose, currentPreference = 'weekly', userEmail, onPreferenceChange }) => {
  if (!isOpen) return null;

  const [selected, setSelected] = useState(currentPreference);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSelect = async (freq) => {
    setSelected(freq);
    setFeedback(null);
    try {
      await notificationApi.updatePreferences(freq);
      onPreferenceChange(freq);
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update preferences.' });
    }
  };

  const handleSendTestEmail = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await notificationApi.sendTestDigest();
      setFeedback({
        type: 'success',
        text: res.data.message || 'Digest email sent!',
        previewUrl: res.data.previewUrl
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: 'Failed to dispatch email: ' + (err.response?.data?.error || err.message)
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#090b0f] border border-[#1a1e27] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#161a22]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Notification Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Scheduled background digests sent to <span className="text-slate-200">{userEmail}</span>
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
        <div className="p-5 space-y-3 text-xs">
          
          {feedback && (
            <div
              className={`p-2.5 rounded border text-xs space-y-1 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{feedback.text}</span>
              </div>
              {feedback.previewUrl && (
                <div className="pl-5 pt-0.5">
                  <a
                    href={feedback.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-300 hover:underline font-mono text-[11px] inline-flex items-center gap-1"
                  >
                    View Ethereal Preview <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            {FREQUENCIES.map((freq) => {
              const isCurrent = selected === freq.id;
              return (
                <div
                  key={freq.id}
                  onClick={() => handleSelect(freq.id)}
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${
                    isCurrent
                      ? 'bg-[#131720] border-[#2c3445]'
                      : 'bg-[#0d0f14] border-[#161a22] hover:border-[#222836]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                      {freq.title}
                    </span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{freq.desc}</p>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    {freq.time} &bull; {freq.window}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#161a22] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={testing}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#141822] hover:bg-[#1a202c] border border-[#212736] rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>Test Email Now</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2d3748] rounded-md transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotificationModal;
