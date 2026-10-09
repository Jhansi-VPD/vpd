import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';
import GenerateProjectInvoiceModal from '../../../project-manager/components/GenerateProjectInvoiceModal';
import Button from '../../../../shared/components/Button';

export const Payroll: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'client_invoicing'>('payroll');
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);

  // Client Invoicing State for HR
  const [clientProjects, setClientProjects] = useState<any[]>([
    {
      id: 'p1',
      title: 'Core Banking Modernization',
      client: 'Acme Corp',
      budget: 1200000,
      status: 'ready_for_invoicing',
      pm_name: 'Senior Project Manager',
      completion: 100,
      invoice_number: null,
    },
    {
      id: 'p2',
      title: 'Payment Gateway Integration',
      client: 'FinTech Ltd',
      budget: 450000,
      status: 'ready_for_invoicing',
      pm_name: 'Senior Project Manager',
      completion: 100,
      invoice_number: null,
    },
    {
      id: 'p3',
      title: 'Healthcare Data Warehouse',
      client: 'MedCare Inc',
      budget: 800000,
      status: 'in_progress',
      pm_name: 'Senior Project Manager',
      completion: 75,
      invoice_number: null,
    },
  ]);
  const [selectedProjectForInvoice, setSelectedProjectForInvoice] = useState<any | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await hrApi.getMyPayslips();
      setPayslips(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleOpenInvoiceModal = (proj: any) => {
    setSelectedProjectForInvoice(proj);
    setInvoiceModalOpen(true);
  };

  const handleInvoiceGenerated = (invoiceData: any) => {
    setClientProjects((prev) =>
      prev.map((p) =>
        p.id === invoiceData.project_id
          ? {
              ...p,
              status: 'invoiced',
              invoice_number: invoiceData.invoice_number,
              invoice_amount: invoiceData.total_amount,
            }
          : p
      )
    );
    setSuccessBanner(
      `Invoice ${invoiceData.invoice_number} for $${invoiceData.total_amount.toLocaleString()} has been officially generated and queued in Finance!`
    );
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  const getMonthName = (monthNumber: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[(monthNumber - 1) % 12] || `Month ${monthNumber}`;
  };

  return (
    <div className="space-y-6">
      {/* Header and Authorization Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💵</span> Payroll & Client Invoicing (HR Authorized)
          </h2>
          <p className="text-xs text-[#9B9DA3]">
            Manage employee compensation structures and generate official client project invoices
          </p>
        </div>

        <div className="bg-[#15181D] px-4 py-2 border border-[#272B35] rounded-lg text-xs text-[#9B9DA3]">
          <span>Role Authorization: </span>
          <span className="text-[#D4AF37] font-semibold">HR & Admin Only</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#272B35] pb-2">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'payroll'
              ? 'bg-[#D4AF37] text-black'
              : 'text-zinc-400 hover:text-white bg-[#15181D]'
          }`}
        >
          💵 Employee Payroll & Payslips
        </button>
        <button
          onClick={() => setActiveTab('client_invoicing')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'client_invoicing'
              ? 'bg-[#D4AF37] text-black'
              : 'text-zinc-400 hover:text-white bg-[#15181D]'
          }`}
        >
          <span>🧾 Client Invoicing (HR Authorized)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 font-mono">
            {clientProjects.filter((p) => p.status === 'ready_for_invoicing').length} Pending
          </span>
        </button>
      </div>

      {successBanner && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <span>✓ {successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 text-sm">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: EMPLOYEE PAYROLL */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Latest Net Pay</span>
              <p className="text-2xl font-bold text-[#EDB940]">
                {payslips.length > 0 ? `$${Number(payslips[0].net_pay || 0).toLocaleString()}` : '$0.00'}
              </p>
              <p className="text-xs text-[#16A34A]">Disbursed on cycle</p>
            </div>

            <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Tax Withholding</span>
              <p className="text-xl font-bold text-white">Compliant</p>
              <p className="text-xs text-[#9B9DA3]">Form W-2 / W-4 on record</p>
            </div>

            <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Pay Frequency</span>
              <p className="text-xl font-bold text-white">Semi-Monthly</p>
              <p className="text-xs text-[#9B9DA3]">Next cut-off: End of month</p>
            </div>
          </div>

          <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#272B35] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Historical Pay Statements</h3>
              <span className="text-xs text-[#7A7D84]">{payslips.length} items logged</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-[#7A7D84]">Loading payroll ledger...</div>
            ) : payslips.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7A7D84]">No issued payslips found for this cycle.</div>
            ) : (
              <div className="divide-y divide-[#272B35]">
                {payslips.map((slip) => (
                  <div key={slip.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1A1E24]">
                    <div>
                      <p className="text-sm font-medium text-white">{getMonthName(slip.month)} {slip.year}</p>
                      <p className="text-xs text-[#7A7D84] font-mono mt-0.5">Reference: {slip.id.slice(0, 8)}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#EDB940]">${Number(slip.net_pay || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-[#16A34A] uppercase font-mono">Disbursed</p>
                      </div>

                      <button
                        onClick={() => setSelectedSlip(slip)}
                        className="px-3 py-1.5 bg-[#272B35] hover:bg-[#343A46] text-white rounded-lg text-xs"
                      >
                        View Breakdown
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT PROJECT INVOICING (HR AUTHORIZED) */}
      {activeTab === 'client_invoicing' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#1C1A12] border border-[#D4AF37]/30 rounded-xl flex items-start gap-3 text-xs text-zinc-300">
            <span className="text-[#D4AF37] text-lg font-bold">ℹ</span>
            <div>
              <p className="font-semibold text-white">Client Project Invoicing Authority</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                As per enterprise financial governance, <strong>Invoices must be generated exclusively by HR and Admin</strong>. 
                Below are verified projects submitted by Project Managers for official client invoice generation.
              </p>
            </div>
          </div>

          <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#272B35] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Verified Client Projects Ready for Invoicing</h3>
              <span className="text-xs text-[#7A7D84] font-mono">Finance Queue</span>
            </div>

            <div className="divide-y divide-[#272B35]">
              {clientProjects.map((proj) => (
                <div key={proj.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1A1E24] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{proj.title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        Client: {proj.client}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      QA Verified by: <span className="text-zinc-200">{proj.pm_name}</span> • Progress: <span className="text-emerald-400 font-bold">{proj.completion}%</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#D4AF37] font-mono">
                        ${Number(proj.budget).toLocaleString()} USD
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase font-mono">Contract Budget</p>
                    </div>

                    {proj.status === 'invoiced' ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        🧾 {proj.invoice_number} • Billed
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenInvoiceModal(proj)}
                      >
                        ⚡ Generate Official Invoice
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pay Statement Breakdown Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-sm w-full p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Itemized Statement Breakdown</h3>
              <p className="text-xs text-[#7A7D84]">{getMonthName(selectedSlip.month)} {selectedSlip.year}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded bg-[#0E1013]">
                <span className="text-[#9B9DA3]">Base Salary (Gross)</span>
                <span className="font-mono font-semibold text-white">${Number(selectedSlip.basic || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-[#0E1013]">
                <span className="text-[#9B9DA3]">Housing & Travel Allowances</span>
                <span className="font-mono font-semibold text-[#16A34A]">+${Number(selectedSlip.allowances || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-[#0E1013]">
                <span className="text-[#9B9DA3]">Tax & Deductions</span>
                <span className="font-mono font-semibold text-[#DC2626]">-${Number(selectedSlip.deductions || 0).toLocaleString()}</span>
              </div>

              <div className="border-t border-[#272B35] pt-3 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Net Take-Home Pay</span>
                <span className="font-mono font-bold text-lg text-[#EDB940]">${Number(selectedSlip.net_pay || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedSlip(null)}
                className="w-full py-2 bg-[#272B35] hover:bg-[#343A46] text-white rounded-lg text-xs"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official HR & Admin Invoicing Modal */}
      <GenerateProjectInvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        project={selectedProjectForInvoice}
        onInvoiceGenerated={handleInvoiceGenerated}
      />
    </div>
  );
};

export default Payroll;
