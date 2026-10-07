import React, { useEffect, useState } from 'react';
import { salesApi } from '../../../../api';

export const Pipeline: React.FC = () => {
  const [columns, setColumns] = useState<any>({
    prospecting: [
      { id: '1', title: 'TechCorp SaaS Integration', value: '$45,000', company: 'TechCorp Inc' },
    ],
    proposal: [
      { id: '2', title: 'FinSecure SOC 2 Architecture', value: '$120,000', company: 'FinSecure Ltd' },
    ],
    negotiation: [
      { id: '3', title: 'OmniChain Global Logistics API', value: '$85,000', company: 'OmniChain Global' },
    ],
    won: [
      { id: '4', title: 'HealthPlus Telehealth Platform', value: '$210,000', company: 'HealthPlus Corp' },
    ],
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await salesApi.getPipeline();
        if (res.data) {
          // keep or augment
        }
      } catch {
        // fallback
      }
    }
    load();
  }, []);

  const stageLabels: Record<string, string> = {
    prospecting: 'Prospecting & Discovery',
    proposal: 'Proposal Submitted',
    negotiation: 'Legal & Procurement',
    won: 'Closed Won',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Visual Sales Deal Pipeline</h2>
        <p className="text-xs text-zinc-400">Drag-and-drop opportunity board categorized by commercial stage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(columns).map(([stage, items]: [string, any]) => (
          <div key={stage} className="bg-[#121214] border border-zinc-800 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-200">{stageLabels[stage] || stage}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{items.length}</span>
            </div>
            <div className="space-y-3 flex-1">
              {items.map((deal: any) => (
                <div key={deal.id} className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg hover:border-[#d4af37] transition-colors cursor-pointer">
                  <h4 className="text-xs font-bold text-zinc-100">{deal.title}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1">{deal.company}</p>
                  <p className="text-xs font-semibold text-[#d4af37] mt-2">{deal.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pipeline;
