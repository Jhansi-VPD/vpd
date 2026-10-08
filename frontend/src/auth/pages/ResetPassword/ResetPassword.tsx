"use client";
import { useRouter, usePathname } from "next/navigation";
import React, { useState } from 'react';

import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { authService } from '../../auth.service';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121214] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2 text-center">Set New Password</h3>
        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs text-center">
              Your password has been reset successfully.
            </div>
            <Button variant="primary" className="w-full" onClick={() => navigate.push('/auth/login')}>
              Proceed to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Reset Token" value={token} onChange={(e) => setToken(e.target.value)} required />
            <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

