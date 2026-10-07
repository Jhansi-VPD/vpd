import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Reports: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Operational & Compliance Reports"
        description="Quarterly telemetry, SLA attainment, and resource allocations"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Operational & Compliance Reports' }]}
        
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Contract Fulfillment" value="99.4%" change="+0.8%" isPositive={true} />
        <MetricCard title="Billable Utilization" value="84.2%" change="Optimal" isPositive={true} />
        <MetricCard title="Security Score" value="A+ ISO 27001" change="Compliant" isPositive={true} />
      </div>

      <div className="p-6 bg-[#121214] border border-zinc-800 rounded-xl">
        <h3 className="text-sm font-semibold text-zinc-100 mb-2">Quarterly Audit Export</h3>
        <p className="text-xs text-zinc-400 mb-4">Export comprehensive regulatory and compliance activity logs</p>
        <button
          onClick={() => alert('Exporting Q4-2026 Audit Report PDF...')}
          className="px-4 py-2 bg-[#d4af37] text-black font-semibold text-xs rounded-lg hover:bg-[#dfc067]"
        >
          Download Signed Audit Dossier
        </button>
      </div>
    </PageContainer>
  );
}
export default Reports;
