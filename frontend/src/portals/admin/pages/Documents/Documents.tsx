"use client";
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { documentsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import FileUpload from '../../../../shared/components/FileUpload';

export const Documents: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultDocs = [
    { id: '1', title: 'VPD Master Services Agreement.pdf', category: 'Legal', size: '2.4 MB', updated_at: '2026-10-01' },
    { id: '2', title: 'Information Security Policy 2026.pdf', category: 'Compliance', size: '1.8 MB', updated_at: '2026-09-15' },
    { id: '3', title: 'Employee Handbook v4.2.pdf', category: 'HR', size: '3.1 MB', updated_at: '2026-08-20' },
  ];

  useEffect(() => {
    async function load() {
      try {
        const res = await documentsApi.getAll();
        setDocs(res?.data && res.data.length > 0 ? res.data : defaultDocs);
      } catch (err) {
        console.warn('Documents API unavailable, using fallback docs', err);
        setDocs(defaultDocs);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Enterprise Document Vault"
        description="Encrypted organizational storage, agreements, and policies"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Enterprise Document Vault' }]}
        
      />

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
    </PageContainer>
  );
}
export default Documents;
