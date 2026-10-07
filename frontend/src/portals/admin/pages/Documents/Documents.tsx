import React, { useEffect, useState } from 'react';
import { documentsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import FileUpload from '../../../../shared/components/FileUpload';

export const Documents: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await documentsApi.getAll();
        setDocs(res.data || [
          { id: '1', title: 'VPD Master Services Agreement.pdf', category: 'Legal', size: '2.4 MB', updated_at: '2026-10-01' },
          { id: '2', title: 'Information Security Policy 2026.pdf', category: 'Compliance', size: '1.8 MB', updated_at: '2026-09-15' },
          { id: '3', title: 'Employee Handbook v4.2.pdf', category: 'HR', size: '3.1 MB', updated_at: '2026-08-20' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Enterprise Document Vault</h2>
        <p className="text-xs text-zinc-400">Encrypted organizational storage, agreements, and policies</p>
      </div>

      <FileUpload onFileSelect={(file) => alert(`Uploading: ${file.name}`)} label="Upload Document" />

      <DataTable
        loading={loading}
        data={docs}
        columns={[
          { header: 'File Name', accessor: 'title' },
          { header: 'Category', accessor: 'category' },
          { header: 'Size', accessor: 'size' },
          { header: 'Last Modified', accessor: 'updated_at' },
        ]}
      />
    </div>
  );
};

export default Documents;
