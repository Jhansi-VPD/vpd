import React from 'react';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const ProjectDetails: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-[#121214] border border-zinc-800 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">OmniChain Core API Modernization</h2>
            <p className="text-xs text-zinc-400 mt-1">Client: OmniChain Global • Sprint Cycle: Sprint 14</p>
          </div>
          <StatusBadge status="on_track" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800 text-xs">
          <div>
            <p className="text-zinc-500">Tech Lead</p>
            <p className="font-semibold text-zinc-200 mt-0.5">PM Lead / Arch</p>
          </div>
          <div>
            <p className="text-zinc-500">Target Delivery</p>
            <p className="font-semibold text-zinc-200 mt-0.5">Nov 30, 2026</p>
          </div>
          <div>
            <p className="text-zinc-500">Sprint Backlog</p>
            <p className="font-semibold text-zinc-200 mt-0.5">42 Story Points</p>
          </div>
          <div>
            <p className="text-zinc-500">Code Health</p>
            <p className="font-semibold text-emerald-400 mt-0.5">99.2% Unit Passed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
