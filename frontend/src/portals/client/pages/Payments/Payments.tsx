import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Payments: React.FC = () => {
  const payments = [
    { id: '1', ref: 'PAY-8910', invoice: 'INV-2026-081', amount: '$64,000.00', method: 'Direct ACH Wire', status: 'confirmed', date: '2026-10-02' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Payment Receipts & Remittances</h2>
        <p className="text-xs text-zinc-400">Processed wire transfers and official payment confirmations</p>
      </div>
      <DataTable
        data={payments}
        columns={[
          { header: 'Payment Ref', accessor: 'ref' },
          { header: 'Invoice Number', accessor: 'invoice' },
          { header: 'Amount Paid', accessor: 'amount' },
          { header: 'Remittance Method', accessor: 'method' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default Payments;
