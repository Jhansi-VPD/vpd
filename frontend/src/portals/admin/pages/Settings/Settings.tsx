import React from 'react';
import Button from '../../../../shared/components/Button';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Platform Settings & Security Parameters</h2>
        <p className="text-xs text-zinc-400">Environment configurations, authentication rules, and API gateways</p>
      </div>

      <div className="p-6 bg-[#121214] border border-zinc-800 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Database & Replication</h3>
        <p className="text-xs text-zinc-400">Connected to Supabase Managed PostgreSQL Pooler (Port 6543, SSL Required)</p>
        <div className="flex items-center space-x-3 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-zinc-300">Cluster Status: Healthy / Online</span>
        </div>
      </div>

      <div className="p-6 bg-[#121214] border border-zinc-800 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Security Policies</h3>
        <div className="space-y-2 text-xs text-zinc-300">
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked disabled className="rounded bg-zinc-900 border-zinc-700 text-[#d4af37]" />
            <span>Enforce Argon2id password hashing algorithm</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked disabled className="rounded bg-zinc-900 border-zinc-700 text-[#d4af37]" />
            <span>Strict Role-Based Access Control (RBAC) route guarding</span>
          </label>
        </div>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => alert('Settings synchronized with environment.')}>
            Sync Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
