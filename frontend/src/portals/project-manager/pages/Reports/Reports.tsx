"use client";
import React, { useState } from 'react';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';

interface SprintHistoryRecord {
  id: string;
  sprint: string;
  project: string;
  committedPoints: number;
  completedPoints: number;
  bugsLogged: number;
  bugsResolved: number;
  qaPassRate: string;
  status: 'active' | 'completed' | 'on_track';
  invoiceReady: boolean;
  completionDate: string;
}

export const Reports: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedSprintCycle, setSelectedSprintCycle] = useState<string>('Sprint 14');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const sprintHistory: SprintHistoryRecord[] = [
    {
      id: 'SP-14',
      sprint: 'Sprint 14 (Current)',
      project: 'Core Banking Modernization',
      committedPoints: 48,
      completedPoints: 44,
      bugsLogged: 3,
      bugsResolved: 2,
      qaPassRate: '96.5%',
      status: 'active',
      invoiceReady: false,
      completionDate: '2026-10-15',
    },
    {
      id: 'SP-13',
      sprint: 'Sprint 13',
      project: 'Core Banking Modernization',
      committedPoints: 45,
      completedPoints: 45,
      bugsLogged: 5,
      bugsResolved: 5,
      qaPassRate: '100%',
      status: 'completed',
      invoiceReady: true,
      completionDate: '2026-09-30',
    },
    {
      id: 'SP-12',
      sprint: 'Sprint 12',
      project: 'Payment Gateway Integration',
      committedPoints: 40,
      completedPoints: 38,
      bugsLogged: 4,
      bugsResolved: 4,
      qaPassRate: '98.2%',
      status: 'completed',
      invoiceReady: true,
      completionDate: '2026-09-15',
    },
    {
      id: 'SP-11',
      sprint: 'Sprint 11',
      project: 'Payment Gateway Integration',
      committedPoints: 42,
      completedPoints: 42,
      bugsLogged: 2,
      bugsResolved: 2,
      qaPassRate: '100%',
      status: 'completed',
      invoiceReady: true,
      completionDate: '2026-08-31',
    },
    {
      id: 'SP-10',
      sprint: 'Sprint 10',
      project: 'Healthcare Data Warehouse',
      committedPoints: 36,
      completedPoints: 34,
      bugsLogged: 6,
      bugsResolved: 6,
      qaPassRate: '95.0%',
      status: 'completed',
      invoiceReady: true,
      completionDate: '2026-08-15',
    },
  ];

  const handleExport = (type: 'pdf' | 'csv') => {
    setDownloadNotice(`Generating official Sprint & Delivery ${type.toUpperCase()} Report... Download will start.`);
    setTimeout(() => {
      const blob = new Blob([
        `VPD Technologies - Sprint Delivery & QA Report\nGenerated Date: ${new Date().toISOString()}\nSprint: ${selectedSprintCycle}\nProject Filter: ${selectedProject}\nVelocity: 44 SP\nQA Pass Rate: 98.4%\nDefect Escape Rate: 0.2%`
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VPD_Sprint_Report_${selectedSprintCycle.replace(/\s+/g, '_')}.${type === 'pdf' ? 'txt' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadNotice(null);
    }, 1500);
  };

  const filteredHistory = sprintHistory.filter((rec) => {
    if (selectedProject === 'all') return true;
    return rec.project.toLowerCase().includes(selectedProject.toLowerCase());
  });

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <PageHeader
            title="Sprint & Agile Delivery Reports"
            description="Engineering velocity trends, planned vs. actual story points, and QA defect escape analysis"
            breadcrumbs={[{ label: 'Delivery Hub' }, { label: 'Sprint Reports' }]}
          />
        </div>

        {/* Global Export & Project Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Projects</option>
            <option value="Core Banking">Core Banking Modernization</option>
            <option value="Payment Gateway">Payment Gateway Integration</option>
            <option value="Healthcare">Healthcare Data Warehouse</option>
          </select>

          <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}>
            <span>📊 Export CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleExport('pdf')}>
            <span>📄 Export Report</span>
          </Button>
        </div>
      </div>

      {downloadNotice && (
        <div className="mb-6 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* 4 HIGH-LEVEL SPRINT & DELIVERY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slideUp">
        {/* Metric 1 */}
        <div className="p-5 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Sprint Velocity
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">44 SP</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              +4 SP vs Target
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Commit accuracy: <span className="text-zinc-300 font-semibold">91.6%</span> (44 of 48 SP)
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Defect Escape Rate
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">0.2%</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Grade AAA
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Caught in QA before release: <span className="text-emerald-400 font-semibold">99.8%</span>
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Bug Fix Turnaround (MTTF)
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">3.4 hrs</span>
            <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              -1.2h Faster
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Average developer patch & retest cycle
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Milestone Invoicing Readiness
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-amber-400 tracking-tight font-mono">3 / 4</span>
            <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            HR & Admin authorized to invoice
          </p>
        </div>
      </div>

      {/* SPRINT VELOCITY & BURNDOWN TREND CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left 2 Cols: Velocity Bar Graphic */}
        <div className="lg:col-span-2 p-6 bg-[#141414] border border-zinc-800 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>📈</span>
                <span>Sprint Velocity Trend (Planned vs. Completed Story Points)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Evaluates team engineering capacity and delivery predictability across cycles
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-3 h-3 rounded-sm bg-zinc-700 inline-block" /> Planned Commit
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-3 rounded-sm bg-[#D4AF37] inline-block" /> Delivered & QA Verified
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4 pt-2">
            {[
              { sprint: 'Sprint 10', planned: 36, delivered: 34, percent: 94 },
              { sprint: 'Sprint 11', planned: 42, delivered: 42, percent: 100 },
              { sprint: 'Sprint 12', planned: 40, delivered: 38, percent: 95 },
              { sprint: 'Sprint 13', planned: 45, delivered: 45, percent: 100 },
              { sprint: 'Sprint 14 (Active)', planned: 48, delivered: 44, percent: 92 },
            ].map((s) => (
              <div key={s.sprint} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">{s.sprint}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400">
                      Planned: <span className="font-mono text-zinc-300">{s.planned} SP</span>
                    </span>
                    <span className="text-amber-400 font-bold font-mono">
                      Delivered: {s.delivered} SP ({s.percent}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800/80 h-3.5 rounded-lg overflow-hidden flex">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-[#D4AF37] h-full transition-all duration-500 rounded-lg"
                    style={{ width: `${(s.delivered / 50) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span>Average Velocity: <strong className="text-white">40.6 Story Points / sprint</strong></span>
            <span className="text-emerald-400 font-medium">✓ Consistent +8% quarter-over-quarter growth</span>
          </div>
        </div>

        {/* Right Col: Team Effort & Quality Allocation */}
        <div className="space-y-6">
          {/* Box 1: Engineering Effort Allocation */}
          <div className="p-5 bg-[#141414] border border-zinc-800 rounded-xl">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">
              Effort & Role Distribution
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <span>💻</span> Feature Development
                  </span>
                  <span className="text-blue-400 font-semibold">58% (124h)</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '58%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <span>🧪</span> QA Testing & Automation
                  </span>
                  <span className="text-emerald-400 font-semibold">26% (55h)</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '26%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <span>🚀</span> DevOps & Staging Release
                  </span>
                  <span className="text-purple-400 font-semibold">16% (34h)</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '16%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: QA Root Cause Defect Breakdown */}
          <div className="p-5 bg-[#141414] border border-zinc-800 rounded-xl">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Defects Caught by QA
            </h4>
            <p className="text-[11px] text-zinc-400 mb-3">
              All defects resolved and verified before client release:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-300">Currency & Math Precision</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono">1 Defect (Fixed)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-300">Timeout Edge Cases</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono">1 Defect (Fixed)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-300">DB Indexing Performance</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-mono">Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SPRINT-BY-SPRINT HISTORICAL LOG TABLE */}
      <div className="p-6 bg-[#141414] border border-zinc-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Historical Sprint & Delivery Log</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Audited record of story points delivered, QA pass rates, and client invoice readiness
            </p>
          </div>
          <span className="text-xs text-zinc-400">
            Showing {filteredHistory.length} sprint cycles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Sprint Cycle</th>
                <th className="pb-3 font-semibold">Project</th>
                <th className="pb-3 font-semibold">Points (Planned vs Actual)</th>
                <th className="pb-3 font-semibold">QA Defects (Logged / Fixed)</th>
                <th className="pb-3 font-semibold">QA Pass Rate</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Invoicing State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredHistory.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-900/40">
                  <td className="py-3.5 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{s.sprint}</span>
                  </td>
                  <td className="py-3.5 text-zinc-300 font-medium">{s.project}</td>
                  <td className="py-3.5 font-mono">
                    <span className="text-white font-bold">{s.completedPoints} SP</span>
                    <span className="text-zinc-500"> / {s.committedPoints} SP</span>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                      {s.bugsResolved} of {s.bugsLogged} resolved
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="text-emerald-400 font-bold font-mono">{s.qaPassRate}</span>
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="py-3.5 text-right">
                    {s.invoiceReady ? (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Invoiced (HR/Admin)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        In Progress
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
};

export default Reports;
