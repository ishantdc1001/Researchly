import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../lib/api';
import {
  Check,
  Send,
  Loader2,
  ExternalLink
} from 'lucide-react';

const Settings = () => {
  const { mongoUser, user, updatePreferences } = useAuth();

  const [name, setName] = useState(mongoUser?.name || '');
  const [institution, setInstitution] = useState(mongoUser?.institution || '');
  const [agentPrompt, setAgentPrompt] = useState(mongoUser?.agent_prompt || '');
  const [frequency, setFrequency] = useState(mongoUser?.notification_preference || 'weekly');

  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await updatePreferences({
        name,
        institution,
        agent_prompt: agentPrompt,
        notification_preference: frequency
      });
      setFeedback({ type: 'success', text: 'Settings updated successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update preferences.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    setFeedback(null);
    try {
      const res = await notificationApi.sendTestDigest();
      setFeedback({
        type: 'success',
        text: res.data.message || 'Digest email dispatched to ' + (mongoUser?.email || user?.email),
        previewUrl: res.data.previewUrl
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: 'Email delivery error: ' + (err.response?.data?.error || err.message)
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Header */}
        <div className="pb-3 border-b border-[#161a22]">
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Preferences
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage academic profile, agent research criteria, and email digest schedule
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-md border text-xs font-medium space-y-1 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{feedback.text}</span>
            </div>
            {feedback.previewUrl && (
              <div className="pl-5 pt-0.5">
                <a
                  href={feedback.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-200 hover:underline font-mono text-[11px]"
                >
                  Preview Dispatched HTML Digest (Ethereal) <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          
          {/* Identity */}
          <div className="ag-panel p-5 border border-[#161a22] space-y-3">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Academic Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 focus:outline-none focus:border-[#2f3747]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 focus:outline-none focus:border-[#2f3747]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={mongoUser?.email || user?.email || ''}
                className="w-full px-3 py-1.5 bg-[#090b0e] border border-[#161a22] rounded-md text-xs text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          {/* Agent Persona Criteria */}
          <div className="ag-panel p-5 border border-[#161a22] space-y-2">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Agent Search Criteria
            </h2>
            <p className="text-xs text-slate-400">
              Natural language prompt used by the vector store and agent to evaluate incoming CFPs.
            </p>

            <textarea
              rows={3}
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 focus:outline-none focus:border-[#2f3747] resize-none font-normal leading-relaxed"
            />
          </div>

          {/* Email Digest Settings */}
          <div className="ag-panel p-5 border border-[#161a22] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Email Digest Schedule
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated background digests sent via Nodemailer and node-cron.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testingEmail}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#141822] hover:bg-[#1a202c] border border-[#212736] rounded-md flex items-center gap-1.5 transition-colors self-start sm:self-auto disabled:opacity-50"
              >
                {testingEmail ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Test Digest Email</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {[
                { id: 'daily', title: 'Daily Digest', timing: '08:00 AM daily', window: '< 7 day deadlines' },
                { id: 'weekly', title: 'Weekly Digest', timing: 'Monday 08:00 AM', window: '< 14 day deadlines' },
                { id: 'monthly', title: 'Monthly Brief', timing: '1st of month', window: '< 30 day deadlines' },
                { id: 'off', title: 'Paused', timing: 'No automated digests', window: 'Web dashboard only' }
              ].map(opt => {
                const isSelected = frequency === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setFrequency(opt.id)}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#131720] border-[#2c3445]'
                        : 'bg-[#0d0f14] border-[#1a1e26] hover:border-[#222836]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {opt.title}
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {opt.timing} &bull; {opt.window}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2d3748] rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
};

export default Settings;
