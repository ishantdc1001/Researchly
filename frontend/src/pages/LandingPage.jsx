import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShieldCheck, Check, AlertTriangle } from 'lucide-react';
import TrustScoreBadge from '../components/TrustScoreBadge';

const LandingPage = () => {
  const { loginAsDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [demoSelection, setDemoSelection] = useState('ieee');

  const demoConferences = {
    ieee: {
      acronym: 'ICASSP',
      name: 'IEEE International Conference on Acoustics, Speech, and Signal Processing',
      publisher: 'IEEE',
      trust_score: 96,
      venue: 'Barcelona, Spain',
      indexing: 'IEEE Xplore, Scopus, Web of Science',
      reviewTime: 'Standard double-blind (90 days)',
      emailDomain: 'official @icassp2026.org domain'
    },
    predatory: {
      acronym: 'ICCSAS',
      name: 'International Conference on Computer Science and Artificial Systems',
      publisher: 'WASET (World Academy of Science, Engineering and Technology)',
      trust_score: 18,
      venue: 'Dubai, UAE (Rolling Virtual)',
      indexing: 'Unindexed / Dubious claims',
      reviewTime: 'Fast-track acceptance in 48 hours',
      emailDomain: 'free public @gmail.com domain'
    }
  };

  const handleLaunchDemo = async () => {
    await loginAsDemo();
    navigate('/dashboard');
  };

  const current = demoConferences[demoSelection];

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col font-sans">
      
      {/* Minimal Top Nav */}
      <header className="w-full border-b border-[#161a22] bg-[#07080b]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#131720] border border-[#232836] flex items-center justify-center text-slate-200">
              <span className="font-mono text-xs font-semibold">R</span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              Researchly
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-[#161b24] hover:bg-[#202532] border border-[#282f3d] transition-colors"
              >
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <button
                  onClick={handleLaunchDemo}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2d3748] transition-colors"
                >
                  Demo Faculty Access
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20">
        
        <div className="max-w-2xl">
          <div className="text-[11px] font-mono text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Academic Call For Papers Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-[1.15] mb-4">
            Conference discovery with verified credibility.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-8">
            An automated platform for faculty and researchers. Evaluates publisher legitimacy with a 100-point heuristic trust engine, filters CFPs against personal criteria, and tracks submission deadlines in a clean workflow.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunchDemo}
              className="px-4 py-2 rounded-md text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 flex items-center gap-2 transition-colors"
            >
              <span>Explore Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/register"
              className="px-4 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Register account
            </Link>
          </div>
        </div>

        {/* Minimal Interactive Trust Audit Demo */}
        <div className="mt-16 ag-panel p-5 sm:p-6 border border-[#1a1e26]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#161a22]">
            <div>
              <div className="text-xs font-medium text-slate-300">Credibility Engine Simulation</div>
              <div className="text-[11px] text-slate-500">Heuristic comparison between accredited and predatory records</div>
            </div>

            <div className="flex p-0.5 rounded-md bg-[#0d0f14] border border-[#1c212b] text-xs">
              <button
                type="button"
                onClick={() => setDemoSelection('ieee')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  demoSelection === 'ieee'
                    ? 'bg-[#181c25] text-slate-100 border border-[#2a303e]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                IEEE Venue
              </button>
              <button
                type="button"
                onClick={() => setDemoSelection('predatory')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  demoSelection === 'predatory'
                    ? 'bg-[#181c25] text-slate-100 border border-[#2a303e]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Predatory Case
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-white">{current.acronym}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">{current.publisher}</span>
              </div>

              <h3 className="text-base font-medium text-slate-100 leading-snug">{current.name}</h3>
              
              {/* Clean Heuristic Audit Data Table */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400 font-mono">
                <div className="p-2 rounded bg-[#0b0d12] border border-[#171a22]">
                  <span className="text-slate-500 block text-[10px] uppercase">Indexing</span>
                  <span className="text-slate-200 truncate block">{current.indexing}</span>
                </div>
                <div className="p-2 rounded bg-[#0b0d12] border border-[#171a22]">
                  <span className="text-slate-500 block text-[10px] uppercase">Review Timeline</span>
                  <span className={demoSelection === 'predatory' ? 'text-rose-400' : 'text-slate-200'}>{current.reviewTime}</span>
                </div>
                <div className="p-2 rounded bg-[#0b0d12] border border-[#171a22]">
                  <span className="text-slate-500 block text-[10px] uppercase">Contact Domain</span>
                  <span className={demoSelection === 'predatory' ? 'text-rose-400' : 'text-slate-200'}>{current.emailDomain}</span>
                </div>
                <div className="p-2 rounded bg-[#0b0d12] border border-[#171a22]">
                  <span className="text-slate-500 block text-[10px] uppercase">Host Location</span>
                  <span className="text-slate-200">{current.venue}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-[#0c0e13] border border-[#181c25] flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-mono text-slate-500 mb-2">Algorithm Trust Score</span>
              <TrustScoreBadge score={current.trust_score} size="md" />
              <p className="text-[11px] text-slate-500 mt-3 font-mono">
                {current.trust_score >= 80 ? 'Accredited for institutional reporting' : 'High predatory risk index'}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Credibility Engine',
              body: 'Heuristic 100-point algorithm that analyzes publisher history, indexing records, and predatory warning signals.'
            },
            {
              title: 'Autonomous Matching',
              body: 'Define your natural language research persona. The background assistant scores incoming CFPs for topical relevance.'
            },
            {
              title: 'Manuscript Pipeline',
              body: 'Track papers through Shortlisted, Preparing, Under Review, and Accepted with deadline notifications.'
            }
          ].map((item, i) => (
            <div key={i} className="ag-card p-5 border border-[#161a22]">
              <h3 className="text-xs font-semibold text-slate-200 mb-2">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">{item.body}</p>
            </div>
          ))}
        </div>

      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-[#161a22] py-6 text-center text-xs text-slate-600 font-mono">
        Researchly &bull; Academic Conference Intelligence Platform
      </footer>

    </div>
  );
};

export default LandingPage;
