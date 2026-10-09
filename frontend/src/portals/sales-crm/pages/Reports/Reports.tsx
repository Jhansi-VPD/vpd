"use client";
import React, { useState } from 'react';
import { MetricCard } from '../../../../shared/components/Charts';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import { Icon, ActionToast } from '../../../../shared/components';

interface RepPerf {
  id: string;
  name: string;
  role: string;
  target: string;
  closed: string;
  deals: number;
  winRate: string;
  attainment: string;
  progressPercent: number;
}

interface IndBreakdown {
  id: string;
  vertical: string;
  pipeline: string;
  closed: string;
  avgDeal: string;
  cycle: string;
}

export const Reports: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'Q4 2026' | 'Q3 2026' | 'FY 2026'>('Q4 2026');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Timeframe-specific data
  const reportData = {
    'Q4 2026': {
      attainment: '108.4%',
      attainmentSub: '+8.4% above target',
      winRate: '58.2%',
      winRateSub: '+4.1% YoY velocity',
      velocity: '34 Days',
      velocitySub: '-7 Days faster',
      acv: '$145,000',
      acvSub: '+$18,000 tier increase',
      totalClosed: '$1,570,000',
      monthlyBars: [
        { month: 'Oct (W1-W2)', closed: 420, target: 380 },
        { month: 'Oct (W3-W4)', closed: 480, target: 400 },
        { month: 'Nov (Projected)', closed: 520, target: 450 },
        { month: 'Dec (Projected)', closed: 650, target: 500 },
      ],
      reps: [
        { id: 'r-1', name: 'Sarah Connor', role: 'Enterprise Account Exec', target: '$500,000', closed: '$560,000', deals: 4, winRate: '68%', attainment: '112%', progressPercent: 112 },
        { id: 'r-2', name: 'Michael Scott', role: 'Commercial Sales Lead', target: '$400,000', closed: '$415,000', deals: 3, winRate: '55%', attainment: '104%', progressPercent: 104 },
        { id: 'r-3', name: 'David Zhao', role: 'Technical Account Exec', target: '$350,000', closed: '$325,000', deals: 3, winRate: '48%', attainment: '93%', progressPercent: 93 },
        { id: 'r-4', name: 'Elena Rostova', role: 'Growth Account Exec', target: '$250,000', closed: '$270,000', deals: 2, winRate: '60%', attainment: '108%', progressPercent: 108 },
      ],
      industries: [
        { id: 'i-1', vertical: 'Financial Services & Banking', pipeline: '$580,000', closed: '$440,000', avgDeal: '$146,000', cycle: '32 Days' },
        { id: 'i-2', vertical: 'Healthcare & Life Sciences', pipeline: '$410,000', closed: '$310,000', avgDeal: '$155,000', cycle: '42 Days' },
        { id: 'i-3', vertical: 'Supply Chain & Logistics', pipeline: '$340,000', closed: '$240,000', avgDeal: '$80,000', cycle: '28 Days' },
        { id: 'i-4', vertical: 'Cloud Infrastructure & SaaS', pipeline: '$620,000', closed: '$570,000', avgDeal: '$190,000', cycle: '35 Days' },
      ],
    },
    'Q3 2026': {
      attainment: '102.1%',
      attainmentSub: '+2.1% above target',
      winRate: '54.5%',
      winRateSub: '+2.8% QoQ velocity',
      velocity: '41 Days',
      velocitySub: '-3 Days faster',
      acv: '$128,000',
      acvSub: 'Base enterprise tier',
      totalClosed: '$1,340,000',
      monthlyBars: [
        { month: 'Jul 2026', closed: 380, target: 360 },
        { month: 'Aug 2026', closed: 440, target: 400 },
        { month: 'Sep 2026', closed: 520, target: 480 },
      ],
      reps: [
        { id: 'r-1', name: 'Sarah Connor', role: 'Enterprise Account Exec', target: '$450,000', closed: '$480,000', deals: 3, winRate: '62%', attainment: '106%', progressPercent: 106 },
        { id: 'r-2', name: 'Michael Scott', role: 'Commercial Sales Lead', target: '$380,000', closed: '$390,000', deals: 3, winRate: '52%', attainment: '102%', progressPercent: 102 },
        { id: 'r-3', name: 'David Zhao', role: 'Technical Account Exec', target: '$320,000', closed: '$310,000', deals: 2, winRate: '46%', attainment: '97%', progressPercent: 97 },
        { id: 'r-4', name: 'Elena Rostova', role: 'Growth Account Exec', target: '$220,000', closed: '$215,000', deals: 2, winRate: '54%', attainment: '98%', progressPercent: 98 },
      ],
      industries: [
        { id: 'i-1', vertical: 'Financial Services & Banking', pipeline: '$510,000', closed: '$390,000', avgDeal: '$130,000', cycle: '36 Days' },
        { id: 'i-2', vertical: 'Healthcare & Life Sciences', pipeline: '$380,000', closed: '$280,000', avgDeal: '$140,000', cycle: '45 Days' },
        { id: 'i-3', vertical: 'Supply Chain & Logistics', pipeline: '$290,000', closed: '$210,000', avgDeal: '$75,000', cycle: '33 Days' },
        { id: 'i-4', vertical: 'Cloud Infrastructure & SaaS', pipeline: '$540,000', closed: '$460,000', avgDeal: '$175,000', cycle: '39 Days' },
      ],
    },
    'FY 2026': {
      attainment: '111.8%',
      attainmentSub: '+$410,000 ahead of FY pacing',
      winRate: '56.9%',
      winRateSub: 'Annual average',
      velocity: '36 Days',
      velocitySub: 'Full-year median',
      acv: '$138,500',
      acvSub: 'Blended ACV benchmark',
      totalClosed: '$4,850,000',
      monthlyBars: [
        { month: 'Q1 2026', closed: 980, target: 900 },
        { month: 'Q2 2026', closed: 1120, target: 1000 },
        { month: 'Q3 2026', closed: 1340, target: 1200 },
        { month: 'Q4 2026 (Paced)', closed: 1570, target: 1350 },
      ],
      reps: [
        { id: 'r-1', name: 'Sarah Connor', role: 'Enterprise Account Exec', target: '$1,600,000', closed: '$1,820,000', deals: 13, winRate: '66%', attainment: '114%', progressPercent: 114 },
        { id: 'r-2', name: 'Michael Scott', role: 'Commercial Sales Lead', target: '$1,350,000', closed: '$1,440,000', deals: 11, winRate: '56%', attainment: '107%', progressPercent: 107 },
        { id: 'r-3', name: 'David Zhao', role: 'Technical Account Exec', target: '$1,150,000', closed: '$1,120,000', deals: 9, winRate: '49%', attainment: '97%', progressPercent: 97 },
        { id: 'r-4', name: 'Elena Rostova', role: 'Growth Account Exec', target: '$850,000', closed: '$910,000', deals: 8, winRate: '59%', attainment: '107%', progressPercent: 107 },
      ],
      industries: [
        { id: 'i-1', vertical: 'Financial Services & Banking', pipeline: '$1,820,000', closed: '$1,450,000', avgDeal: '$145,000', cycle: '34 Days' },
        { id: 'i-2', vertical: 'Healthcare & Life Sciences', pipeline: '$1,290,000', closed: '$1,020,000', avgDeal: '$150,000', cycle: '43 Days' },
        { id: 'i-3', vertical: 'Supply Chain & Logistics', pipeline: '$1,050,000', closed: '$820,000', avgDeal: '$78,000', cycle: '30 Days' },
        { id: 'i-4', vertical: 'Cloud Infrastructure & SaaS', pipeline: '$1,980,000', closed: '$1,560,000', avgDeal: '$185,000', cycle: '37 Days' },
      ],
    },
  };

  const currentData = reportData[timeframe];

  // Real CSV export
  const handleExportCSV = () => {
    let csv = `Sales Performance Report - ${timeframe}\n\n`;
    csv += `Sales Executive,Role,Target Quota,Closed Bookings,Won Deals,Win Rate,Attainment\n`;
    currentData.reps.forEach((r) => {
      csv += `"${r.name}","${r.role}","${r.target}","${r.closed}",${r.deals},"${r.winRate}","${r.attainment}"\n`;
    });
    csv += `\nIndustry Vertical,Active Pipeline,Signed ARR,Average ACV,Sales Cycle\n`;
    currentData.industries.forEach((i) => {
      csv += `"${i.vertical}","${i.pipeline}","${i.closed}","${i.avgDeal}","${i.cycle}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VPD_Sales_Report_${timeframe.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`✓ Downloaded "VPD_Sales_Report_${timeframe.replace(' ', '_')}.csv"!`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Real Print / PDF export
  const handleDownloadPDF = () => {
    setExportNotice(`✓ Opening print preview for PDF generation...`);
    setTimeout(() => {
      window.print();
      setExportNotice(null);
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      <ActionToast
        message={exportNotice}
        onClose={() => setExportNotice(null)}
        title="⚡ Export Status:"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Commercial Sales Intelligence & Reports</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              {timeframe} Financial Audit
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Revenue bookings, quota attainment, deal velocity, and industry vertical performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Timeframe switch */}
          <div className="flex items-center p-1 bg-[#141414] border border-[#2A2A2A] rounded-lg text-xs">
            {(['Q4 2026', 'Q3 2026', 'FY 2026'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  timeframe === t ? 'bg-[#2A2A2A] text-[#D4AF37] font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownloadPDF}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Quota Attainment" value={currentData.attainment} change={currentData.attainmentSub} isPositive={true} />
        <MetricCard title="Commercial Win Rate" value={currentData.winRate} change={currentData.winRateSub} isPositive={true} />
        <MetricCard title="Sales Cycle Velocity" value={currentData.velocity} change={currentData.velocitySub} isPositive={true} />
        <MetricCard title="Avg Contract Value (ACV)" value={currentData.acv} change={currentData.acvSub} isPositive={true} />
      </div>

      {/* Monthly / Quarterly Revenue Velocity Chart */}
      <div className="bg-[#121214] border border-[#222224] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-[#D4AF37]">📈</span> Revenue Velocity & Closing Trajectory ({timeframe})
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5">Comparison between closed bookings vs quota benchmark</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">{currentData.totalClosed} Total Closed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          {currentData.monthlyBars.map((bar, idx) => {
            const pct = Math.min(100, Math.round((bar.closed / bar.target) * 100));
            return (
              <div key={idx} className="p-3.5 rounded-lg bg-[#18181a] border border-[#262628] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-medium">{bar.month}</span>
                  <span className={`font-mono font-bold text-xs ${pct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    ${bar.closed}k / ${bar.target}k
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-[#D4AF37]' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-300 font-mono">
                  <span>Pacing</span>
                  <span className="text-white font-semibold">{pct}% of quota</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reps Performance Table */}
      <div className="bg-[#121214] border border-[#222224] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Sales Executive Quota & Bookings</h3>
            <p className="text-xs text-zinc-300 mt-0.5">Individual revenue contribution vs quarterly quota targets</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">{currentData.totalClosed} Total Closed</span>
        </div>
        <DataTable<RepPerf>
          data={currentData.reps}
          columns={[
            {
              header: 'Sales Executive',
              accessor: (row) => (
                <div>
                  <div className="font-bold text-white text-xs">{row.name}</div>
                  <div className="text-xs text-zinc-300 font-medium">{row.role}</div>
                </div>
              ),
            },
            { header: 'Target Quota', accessor: (row) => row.target },
            {
              header: 'Closed Bookings',
              accessor: (row) => <span className="font-bold font-mono text-white text-xs">{row.closed}</span>,
            },
            { header: 'Won Deals', accessor: (row) => <span className="font-mono text-xs">{row.deals} Accounts</span> },
            { header: 'Win Rate', accessor: (row) => <span className="font-mono text-xs text-cyan-400 font-bold">{row.winRate}</span> },
            {
              header: 'Attainment',
              accessor: (row) => {
                const num = Number(row.attainment.replace('%', ''));
                return <StatusBadge status={row.attainment} variant={num >= 100 ? 'gold' : 'neutral'} />;
              },
            },
          ]}
        />
      </div>

      {/* Industry Vertical Revenue Table */}
      <div className="bg-[#121214] border border-[#222224] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Revenue Contribution by Industry Vertical</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Pipeline concentration and average deal size by enterprise sector</p>
          </div>
          <span className="text-xs font-mono text-[#D4AF37] font-bold">Multi-Sector Portfolio</span>
        </div>
        <DataTable<IndBreakdown>
          data={currentData.industries}
          columns={[
            {
              header: 'Industry Sector',
              accessor: (row) => <span className="font-bold text-white text-xs">{row.vertical}</span>,
            },
            { header: 'Active Pipeline', accessor: (row) => row.pipeline },
            {
              header: 'Signed ARR',
              accessor: (row) => <span className="font-mono font-bold text-emerald-400 text-xs">{row.closed}</span>,
            },
            { header: 'Average ACV', accessor: (row) => row.avgDeal },
            {
              header: 'Sales Cycle',
              accessor: (row) => <span className="font-mono text-xs text-zinc-300">{row.cycle}</span>,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default Reports;
