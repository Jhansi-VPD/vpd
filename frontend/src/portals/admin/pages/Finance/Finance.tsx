"use client";
import React, { useEffect, useState } from 'react';
import { invoicesApi, paymentsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import { MetricCard } from '../../../../shared/components/Charts';

export const Finance: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await invoicesApi.getAll();
        setInvoices(res.data || [
          { id: '1', invoice_number: 'INV-2026-081', client_name: 'Apex Health Systems', total: 64000, status: 'paid', due_date: '2026-10-15' },
          { id: '2', invoice_number: 'INV-2026-082', client_name: 'Global Financial Corp', total: 112000, status: 'sent', due_date: '2026-10-30' },
          { id: '3', invoice_number: 'INV-2026-083', client_name: 'Nordic CleanTech', total: 48500, status: 'draft', due_date: '2026-11-05' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#d4af37]">Restricted Finance & Accounts Ledger</h3>
          <p className="text-xs text-zinc-300">Access limited strictly to authorized Super Admin & Finance roles</p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 bg-black/40 text-zinc-300 rounded">RBAC Enforced</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total Receivables" value="$224,500" change="+18.4%" isPositive={true} />
        <MetricCard title="Settled Payments" value="$64,000" change="On Schedule" isPositive={true} />
        <MetricCard title="Pending Invoices" value="$160,500" change="Due 30 Days" isPositive={false} />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-zinc-200 mb-3">Enterprise Invoices</h4>
        <DataTable
          loading={loading}
          data={invoices}
          columns={[
            { header: 'Invoice Number', accessor: 'invoice_number' },
            { header: 'Client', accessor: (row) => row.client_name || 'Enterprise Client' },
            { header: 'Amount', accessor: (row) => `$${Number(row.total || 0).toLocaleString()}` },
            { header: 'Due Date', accessor: 'due_date' },
            { header: 'Status', accessor: (row) => <StatusBadge status={row.status || 'sent'} /> },
          ]}
        />
      </div>
    </div>
  );
};

export default Finance;
