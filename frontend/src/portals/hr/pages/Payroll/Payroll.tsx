import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

export const Payroll: React.FC = () => {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);

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

  const getMonthName = (monthNumber: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[(monthNumber - 1) % 12] || `Month ${monthNumber}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💵</span> Payroll & Payslip Management
          </h2>
          <p className="text-xs text-[#9B9DA3]">View monthly compensation structures, statutory deductions, and tax slips</p>
        </div>

        <div className="bg-[#15181D] px-4 py-2 border border-[#272B35] rounded-lg text-xs text-[#9B9DA3]">
          <span>Direct Deposit Status: </span>
          <span className="text-[#16A34A] font-semibold">Active ACH</span>
        </div>
      </div>

      {/* Overview Metric */}
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
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Available Statements</span>
          <p className="text-xl font-bold text-white">{payslips.length} Statements</p>
          <p className="text-xs text-[#9B9DA3]">FastAPI verified records</p>
        </div>
      </div>

      {/* Payslip list table */}
      <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
              <tr>
                <th className="px-5 py-3.5">Pay Period</th>
                <th className="px-5 py-3.5">Base Salary</th>
                <th className="px-5 py-3.5">Allowances</th>
                <th className="px-5 py-3.5">Deductions</th>
                <th className="px-5 py-3.5">Net Disbursed</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272B35] text-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#9B9DA3]">
                    Loading payslip records...
                  </td>
                </tr>
              ) : payslips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#9B9DA3]">
                    No issued payslips found for current profile.
                  </td>
                </tr>
              ) : (
                payslips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-[#1A1E24] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white">
                      {getMonthName(slip.month)} {slip.year}
                    </td>
                    <td className="px-5 py-3.5 font-mono">${Number(slip.basic || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono text-[#16A34A]">+${Number(slip.allowances || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono text-[#DC2626]">-${Number(slip.deductions || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-[#EDB940]">${Number(slip.net_pay || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSlip(slip)}
                        className="px-2.5 py-1 bg-[#272B35] hover:bg-[#343A46] text-white rounded text-[11px]"
                      >
                        Breakdown
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Breakdown Drawer / Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272B35] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Salary Statement Breakdown
                </h3>
                <p className="text-xs text-[#C9A84C]">
                  {getMonthName(selectedSlip.month)} {selectedSlip.year}
                </p>
              </div>
              <button onClick={() => setSelectedSlip(null)} className="text-[#9B9DA3] hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded bg-[#0E1013]">
                <span className="text-[#9B9DA3]">Base Salary (Gross)</span>
                <span className="font-mono font-semibold text-white">${Number(selectedSlip.basic || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-[#0E1013]">
                <span className="text-[#9B9DA3]">Housing & Travel Allowances</span>
                <span className="font-mono font-semibold text-[#16A34A]">+${Number(selectedSlip.allowances || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-[#0E1013]">
                <span className="text-[#9B9DA3]">Tax & Provident Fund Deductions</span>
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
    </div>
  );
};

export default Payroll;
