'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Lock, ChevronRight, ShieldCheck, LogOut } from 'lucide-react';

const LOGIN_PASSWORD = 'csch901';
const AUTH_STORAGE_KEY = 'dashboardAuthPassed';

interface LoginGateProps {
  children: ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved === 'true') {
        setAuthed(true);
      }
    } finally {
      setChecking(false);
    }
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.trim() === LOGIN_PASSWORD) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setAuthed(true);
      setError('');
      return;
    }

    setError('密码错误，请重试');
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthed(false);
    setPassword('');
    setError('');
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (authed) {
    return (
      <>
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm px-3 py-2 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
        {children}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Background Ambient Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-100/40 blur-[100px] mix-blend-multiply opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-100/40 blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-slate-100/40 blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] border border-white/60 p-8 md:p-10 transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)]">
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20 mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShieldCheck className="w-8 h-8 opacity-90" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              呈尚策划
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              双平台回款综合分析系统
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                访问密码
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入系统访问密码"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-200 sm:text-sm"
                  autoComplete="current-password"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50/80 border border-red-100 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full group relative flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-slate-900/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>安全登录</span>
              <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Protected System · Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
