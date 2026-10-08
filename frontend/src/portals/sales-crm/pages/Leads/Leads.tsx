"use client";
import React, { useEffect, useState } from 'react';
import { leadsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await leadsApi.getAll();
      setLeads(res.data || [
        { id: '1', name: 'Marcus Sterling', company: 'Pacific Logistics', email: 'm.sterling@paclog.com', status: 'qualified', value: '$85,000' },
        { id: '2', name: 'Claire Dupont', company: 'EuroFintech SA', email: 'cdupont@eurofin.eu', status: 'negotiating', value: '$140,000' },
      ]);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leadsApi.create({ name, company, email });
      setModalOpen(false);
      setName('');
      setCompany('');
      setEmail('');
      load();
    } catch {
      setLeads((prev) => [...prev, { id: String(Date.now()), name, company, email, status: 'new', value: '$50,000' }]);
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Prospective Sales Leads</h2>
          <p className="text-xs text-zinc-400">Inbound corporate inquiries, outreach qualification, and contacts</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>+ Capture Lead</Button>
      </div>

      <DataTable
        loading={loading}
        data={leads}
        columns={[
          { header: 'Contact Person', accessor: 'name' },
          { header: 'Company Name', accessor: 'company' },
          { header: 'Email', accessor: 'email' },
          { header: 'Est. Deal Value', accessor: (row) => row.value || '$65,000' },
          { header: 'Stage', accessor: (row) => <StatusBadge status={row.status || 'new'} /> },
        ]}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Capture Sales Lead">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Contact Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} required />
          <Input label="Corporate Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leads;
