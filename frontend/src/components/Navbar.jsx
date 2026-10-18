import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  LogOut,
  Sliders,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import AgentConfigModal from './AgentConfigModal';
import NotificationModal from './NotificationModal';

const Navbar = ({ unreadCount = 0 }) => {
  const { user, mongoUser, logout, updatePreferences } = useAuth();
  const location = useLocation();

  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const navItems = [
    { name: 'Overview', path: '/dashboard' },
    { name: 'Conferences', path: '/dashboard/explorer' },
    {
      name: 'Agent Inbox',
      path: '/dashboard/inbox',
      count: unreadCount > 0 ? unreadCount : null
    },
    { name: 'Pipeline', path: '/dashboard/kanban' },
  ];

  const currentPath = location.pathname;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#07080b]/95 backdrop-blur-md border-b border-[#161a22]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          
          {/* Left: Clean Minimalist Brand & Nav */}
          <div className="flex items-center gap-7">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-md bg-[#131720] border border-[#232836] flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                <span className="font-mono text-xs font-semibold">R</span>
              </div>
              <span className="font-semibold text-sm tracking-tight text-slate-100">
                Researchly
              </span>
            </Link>

            {/* Clean, Understated Text Nav */}
            <nav className="hidden md:flex items-center gap-1 text-xs">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white bg-[#131720] border border-[#1f2430]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{item.name}</span>
                    {item.count && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-mono">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Focused Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Minimalist Agent Criteria Button */}
            <button
              onClick={() => setIsAgentModalOpen(true)}
              className="text-xs px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-[#12151c] border border-transparent hover:border-[#1e232d] transition-colors flex items-center gap-1.5"
              title="Agent Criteria"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Criteria</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#12151c] transition-colors relative"
              title="Notification Settings"
            >
              <Bell className="w-3.5 h-3.5" />
              {mongoUser?.notification_preference !== 'off' && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>

            {/* Settings Link */}
            <Link
              to="/dashboard/settings"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#12151c] transition-colors"
              title="Preferences"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </Link>

            <div className="h-4 w-[1px] bg-[#1a1e26] mx-1" />

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium hidden sm:inline max-w-[140px] truncate">
                {mongoUser?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Faculty'}
              </span>
              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Agent Persona Modal */}
      <AgentConfigModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        currentPrompt={mongoUser?.agent_prompt}
        onSave={(newPrompt) => updatePreferences({ agent_prompt: newPrompt })}
      />

      {/* Email Notifications Modal */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        currentPreference={mongoUser?.notification_preference || 'weekly'}
        userEmail={mongoUser?.email || user?.email}
        onPreferenceChange={(newPref) => updatePreferences({ notification_preference: newPref })}
      />
    </>
  );
};

export default Navbar;
