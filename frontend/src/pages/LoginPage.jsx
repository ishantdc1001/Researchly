import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate(redirectPath);
    } else {
      setError(result.error || 'Invalid credentials.');
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setSubmitting(true);
    await loginAsDemo();
    setSubmitting(false);
    navigate(redirectPath);
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-[#131720] border border-[#232836] flex items-center justify-center text-slate-200">
            <span className="font-mono text-xs font-semibold">R</span>
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            Researchly
          </span>
        </Link>
        <h2 className="text-xl font-semibold text-white tracking-tight">
          Sign in to Researchly
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Academic conference intelligence & deadline tracking
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="ag-panel p-6 border border-[#161a22] rounded-lg space-y-4">
          
          {error && (
            <div className="p-2.5 rounded bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Clean 1-Click Demo Login */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full py-2 px-3 rounded-md text-xs font-medium text-white bg-[#141822] hover:bg-[#1a202c] border border-[#212736] transition-colors flex items-center justify-center gap-2"
          >
            <span>Demo Faculty Access (Dr. Elena Rostova)</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#161a22]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase font-mono">
              <span className="bg-[#090b0f] px-2 text-slate-500">
                Or Supabase Email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@stanford.edu"
                className="w-full px-3 py-1.5 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#2f3747]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 bg-[#0d0f14] border border-[#1a1e26] rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#2f3747]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-3 rounded-md text-xs font-medium text-slate-200 bg-[#161b24] hover:bg-[#1f2532] border border-[#232938] transition-colors flex items-center justify-center gap-1.5 pt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-slate-300 hover:underline">
              Register
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
