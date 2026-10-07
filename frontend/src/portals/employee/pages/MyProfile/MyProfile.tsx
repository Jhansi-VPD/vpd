import React from 'react';
import { useAuth } from '../../../../auth/auth.context';

export const MyProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">My Employee Profile</h2>
        <p className="text-xs text-zinc-400">Institutional personal record, contact information, and role credentials</p>
      </div>

      <div className="p-6 bg-[#121214] border border-zinc-800 rounded-xl space-y-4 max-w-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-lg">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-zinc-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-500">Corporate Email</span>
            <p className="font-medium text-zinc-200 mt-1">{user?.email}</p>
          </div>
          <div>
            <span className="text-zinc-500">Account Status</span>
            <p className="font-medium text-emerald-400 mt-1">Verified Active</p>
          </div>
          <div>
            <span className="text-zinc-500">Primary Department</span>
            <p className="font-medium text-zinc-200 mt-1">Product & Engineering</p>
          </div>
          <div>
            <span className="text-zinc-500">Work Authorization</span>
            <p className="font-medium text-zinc-200 mt-1">Full-Time Enterprise</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

