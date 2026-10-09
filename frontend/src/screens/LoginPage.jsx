"use client";
import { useRouter } from "next/navigation";
import React, { useState } from 'react';

import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/portal-shared/SharedComponents';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useRouter();

  const [email, setEmail] = useState('admin@vpdtechnologies.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoLogins, setShowDemoLogins] = useState(true);

  const demoAccounts = [
    { role: 'Admin', email: 'admin@vpdtechnologies.com', path: '/admin' },
    { role: 'Manager', email: 'pm@vpdtechnologies.com', path: '/delivery' },
    { role: 'Developer', email: 'developer@vpdtechnologies.com', path: '/employee' },
    { role: 'QA Tester', email: 'qa@vpdtechnologies.com', path: '/employee' },
    { role: 'HR', email: 'hr@vpdtechnologies.com', path: '/hr' },
    { role: 'Sales', email: 'sales@vpdtechnologies.com', path: '/sales' },
    { role: 'Client', email: 'client@vpdtechnologies.com', path: '/client' },
    { role: 'Employee', email: 'employee@vpdtechnologies.com', path: '/employee' },
  ];

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authenticatedUser = await login(email, password);
      const role = String(authenticatedUser?.role || '').toLowerCase();

      // Redirect to authoritative portal
      switch (role) {
        case 'super_admin':
        case 'admin':
        case 'finance':
          navigate.push('/admin');
          break;
        case 'sales':
        case 'marketing':
          navigate.push('/sales');
          break;
        case 'hr':
          navigate.push('/hr');
          break;
        case 'project_manager':
          navigate.push('/delivery');
          break;
        case 'client':
          navigate.push('/client');
          break;
        default:
          navigate.push('/employee');
          break;
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (acc) => {
    setEmail(acc.email);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img src="/logo.webp" alt="VPD Technologies" className="h-14 mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-bold tracking-tight text-white">VPD Technologies</h1>
          <p className="text-xs text-[#d4af37] font-semibold uppercase tracking-wider mt-1">Enterprise Business Operations Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl p-7 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Sign In to Your Workspace</h2>
          <p className="text-xs text-zinc-400 mb-5">Enter your verified credentials to access your role-based portal.</p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@vpdtechnologies.com"
                className="w-full px-3.5 py-2.5 bg-[#171717] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#171717] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              loading={loading}
              className="w-full py-2.5 mt-2"
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-6 pt-5 border-t border-[#2a2a2a]">
            <button
              onClick={() => setShowDemoLogins(!showDemoLogins)}
              className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-white"
            >
              <span className="font-medium text-[11px] uppercase tracking-wider text-[#d4af37]">Verified Demo Portals</span>
              <span>{showDemoLogins ? '▲' : '▼'}</span>
            </button>

            {showDemoLogins && (
              <div className="mt-3 space-y-1.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => selectDemoAccount(acc)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#181818] hover:bg-[#202020] border border-[#2a2a2a] text-left transition-colors"
                  >
                    <span className="text-xs font-medium text-white">{acc.role}</span>
                    <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[150px]">{acc.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-500 mt-6">
          © {new Date().getFullYear()} VPD Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
}

