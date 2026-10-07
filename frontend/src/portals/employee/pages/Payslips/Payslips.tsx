import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import Button from '../../../../shared/components/Button';

export const Payslips: React.FC = () => {
  const payslips = [
    { id: '1', month: 'September 2026', gross: '$8,500.00', net: '$6,850.00', status: 'Disbursed', date: '2026-09-30' },
    { id: '2', month: 'August 2026', gross: '$8,500.00', net: '$6,850.00', status: 'Disbursed', date: '2026-08-31' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Compensation & Payslips</h2>
        <p className="text-xs text-zinc-400">Monthly salary statements, tax withholding breakdowns, and PDF downloads</p>
      </div>

      <DataTable
        data={payslips}
        columns={[
          { header: 'Period', accessor: 'month' },
          { header: 'Gross Compensation', accessor: 'gross' },
          { header: 'Net Disbursed', accessor: 'net' },
          { header: 'Payment Date', accessor: 'date' },
          {
            header: 'Statement',
            accessor: () => (
              <Button variant="secondary" size="sm" onClick={() => alert('Downloading signed Payslip PDF...')}>
                Download PDF
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Payslips;
