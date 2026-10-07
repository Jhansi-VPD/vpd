import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoadingPage() {
  const { user, isAuthenticated, initializing } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState('Initializing VPD Security Environment...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusMessage('Connecting to Enterprise Database...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(80);
      setStatusMessage('Resolving Role-Based Access Controls...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusMessage('Ready. Directing to your workspace...');
    }, 1400);

    const redirectTimer = setTimeout(() => {
      if (initializing) return;

      if (!isAuthenticated || !user) {
        navigate('/login', { replace: true });
        return;
      }

      const role = String(user.role || '').toLowerCase();
      switch (role) {
        case 'super_admin':
        case 'admin':
        case 'finance':
          navigate('/admin', { replace: true });
          break;
        case 'sales':
        case 'marketing':
          navigate('/sales', { replace: true });
          break;
        case 'hr':
          navigate('/hr', { replace: true });
          break;
        case 'project_manager':
          navigate('/delivery', { replace: true });
          break;
        case 'client':
          navigate('/client', { replace: true });
          break;
        case 'partner':
          navigate('/partner', { replace: true });
          break;
        default:
          navigate('/employee', { replace: true });
          break;
      }
    }, 1700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(redirectTimer);
    };
  }, [user, isAuthenticated, initializing, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-6 antialiased select-none">
      {/* Background Subtle Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        {/* Animated Brand Logo Container */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#d4af37]/20 to-transparent blur-md animate-pulse"></div>
          <div className="relative w-20 h-20 rounded-2xl bg-[#121212] border border-[#2a2a2a] p-3.5 flex items-center justify-center shadow-2xl">
            <img src="/logo.webp" alt="VPD Logo" className="w-full h-full object-contain drop-shadow" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold tracking-tight text-white mb-1">
          VPD Technologies
        </h1>
        <p className="text-[11px] font-semibold text-[#d4af37] tracking-wider uppercase mb-8">
          Enterprise Operations Platform
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-[#171717] border border-[#2a2a2a] rounded-full h-2 p-0.5 mb-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#d4af37] to-[#dfc067] h-full rounded-full transition-all duration-500 ease-out shadow-sm shadow-[#d4af37]/50"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Dynamic Status Text */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <svg className="animate-spin h-3.5 w-3.5 text-[#d4af37]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{statusMessage}</span>
        </div>

        {/* Enterprise Security Badge */}
        <div className="mt-12 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121212] border border-[#2a2a2a] text-[10px] text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>AES-256 Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}

