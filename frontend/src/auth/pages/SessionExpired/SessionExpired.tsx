import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/Button';

export const SessionExpired: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-center">
      <div className="w-full max-w-md bg-[#121214] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-950/50 border border-amber-800 flex items-center justify-center text-amber-400 text-2xl font-bold">
          ⏳
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Session Expired</h2>
        <p className="text-xs text-zinc-400 mb-6">
          Your authentication token has timed out for security compliance. Please log in again.
        </p>
        <Button variant="primary" className="w-full" onClick={() => navigate('/auth/login')}>
          Re-authenticate
        </Button>
      </div>
    </div>
  );
};

export default SessionExpired;

