"use client";
import { useRouter, usePathname } from "next/navigation";
import React from 'react';

import Button from '../../../shared/components/Button';

export const Unauthorized: React.FC = () => {
  const navigate = useRouter();
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-center">
      <div className="w-full max-w-md bg-[#121214] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-950/50 border border-red-800 flex items-center justify-center text-red-400 text-2xl font-bold">
          🛡️
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied (403)</h2>
        <p className="text-xs text-zinc-400 mb-6">
          Your current enterprise role does not possess the required permissions to view this portal.
        </p>
        <div className="flex space-x-3 justify-center">
          <Button variant="secondary" onClick={() => navigate.back()}>Go Back</Button>
          <Button variant="primary" onClick={() => navigate.push('/auth/login')}>Switch Account</Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

