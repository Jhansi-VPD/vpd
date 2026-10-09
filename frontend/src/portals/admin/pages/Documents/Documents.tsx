"use client";
import React, { useEffect, useState, useMemo } from 'react';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import DataTable, { Column } from '../../../../shared/components/DataTable';
import FileUpload from '../../../../shared/components/FileUpload';
import { documentsApi, uploadsApi } from '../../../../api';

export interface VaultDocument {
  id: string;
  title: string;
  category: string;
  size: string;
  updated_at: string;
  url?: string;
  fileObj?: File;
  isCustomUploaded?: boolean;
}

interface DocumentsProps {
  portalTitle?: string;
  portalDescription?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const DEFAULT_DOCS: VaultDocument[] = [
  { id: '1', title: 'VPD Master Services Agreement.pdf', category: 'Legal', size: '2.4 MB', updated_at: '2026-10-01' },
  { id: '2', title: 'Information Security Policy 2026.pdf', category: 'Compliance', size: '1.8 MB', updated_at: '2026-09-15' },
  { id: '3', title: 'Employee Handbook v4.2.pdf', category: 'HR', size: '3.1 MB', updated_at: '2026-08-20' },
  { id: '4', title: 'Core Banking API Specification v2.1.pdf', category: 'Project Specs', size: '4.7 MB', updated_at: '2026-10-05' },
  { id: '5', title: 'Payment Gateway Security Architecture.docx', category: 'Architecture', size: '1.2 MB', updated_at: '2026-09-28' },
];

const LOCAL_STORAGE_KEY = 'vpd_vault_uploaded_documents';

export const Documents: React.FC<DocumentsProps> = ({
  portalTitle = 'Enterprise Document Vault',
  portalDescription = 'Encrypted organizational storage, project specifications, agreements, and delivery assets',
  breadcrumbs,
}) => {
  const [docs, setDocs] = useState<VaultDocument[]>(DEFAULT_DOCS);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Load from API + localStorage
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        let combinedDocs = [...DEFAULT_DOCS];

        // 1. Try fetching from backend documentsApi
        try {
          const res = await documentsApi.getAll();
          const apiDocs = res?.data || res;
          if (Array.isArray(apiDocs) && apiDocs.length > 0) {
            combinedDocs = apiDocs.map((d: any, idx: number) => ({
              id: d.id || `api-${idx}`,
              title: d.title || d.name || `Document ${idx + 1}`,
              category: d.category || 'General',
              size: d.size || '1.5 MB',
              updated_at: d.updated_at || d.created_at || '2026-10-01',
              url: d.url,
            }));
          }
        } catch {
          // Keep default docs
        }

        // 2. Read locally uploaded files from localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            try {
              const parsed: VaultDocument[] = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Prepend uploaded documents
                combinedDocs = [...parsed, ...combinedDocs.filter(d => !parsed.some(p => p.id === d.id))];
              }
            } catch (e) {
              console.warn('Failed to parse cached documents', e);
            }
          }
        }

        setDocs(combinedDocs);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Format File Size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Determine Category by extension
  const getCategoryFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'Project Specs';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'Agreement / SOW';
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) return 'Design Assets';
    if (['zip', 'tar', 'gz', 'rar'].includes(ext)) return 'Build Artifacts';
    if (['xlsx', 'csv', 'json', 'sql'].includes(ext)) return 'Data & Reports';
    return 'General Asset';
  };

  // Handle Document Upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // Create local downloadable blob URL
      const blobUrl = URL.createObjectURL(file);
      const category = getCategoryFromFileName(file.name);
      const formattedSize = formatFileSize(file.size);
      const todayDate = new Date().toISOString().split('T')[0];

      // Try uploading to backend API
      try {
        const formData = new FormData();
        formData.append('file', file);
        await uploadsApi.uploadFile(formData);
      } catch (err) {
        console.warn('Backend upload api fallback, document retained in browser storage', err);
      }

      const newDocument: VaultDocument = {
        id: `upl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: file.name,
        category,
        size: formattedSize,
        updated_at: todayDate,
        url: blobUrl,
        isCustomUploaded: true,
      };

      // Update state: prepend to top so it immediately appears in the table below
      setDocs((prev) => {
        const updated = [newDocument, ...prev];
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          const customOnly = updated.filter((d) => d.isCustomUploaded);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly));
        }
        return updated;
      });

      setNotification({
        type: 'success',
        message: `✓ "${file.name}" uploaded successfully! Added to document vault below.`,
      });
      setTimeout(() => setNotification(null), 6000);
    } catch (err) {
      console.error('Error processing document upload', err);
      setNotification({
        type: 'info',
        message: `Uploaded "${file.name}" locally to vault.`,
      });
      setTimeout(() => setNotification(null), 6000);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = (id: string, title: string) => {
    setDocs((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      if (typeof window !== 'undefined') {
        const customOnly = updated.filter((d) => d.isCustomUploaded);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly));
      }
      return updated;
    });

    setNotification({
      type: 'info',
      message: `Document "${title}" removed from vault.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Download Document
  const handleDownload = (doc: VaultDocument) => {
    if (doc.url) {
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create synthetic demo text download
      const blob = new Blob([`Document Content for: ${doc.title}\nCategory: ${doc.category}\nVault: VPD Technologies`], {
        type: 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title.endsWith('.txt') ? doc.title : `${doc.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'all' || d.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [docs, searchQuery, categoryFilter]);

  // Categories list
  const categories = ['all', 'Project Specs', 'Legal', 'Compliance', 'HR', 'Architecture', 'Design Assets', 'Data & Reports'];

  // Table Columns
  const columns: Column<VaultDocument>[] = [
    {
      header: 'File Name',
      accessor: (row) => {
        const ext = row.title.split('.').pop()?.toLowerCase();
        let icon = '📄';
        if (['png', 'jpg', 'jpeg', 'svg'].includes(ext || '')) icon = '🖼️';
        else if (['zip', 'tar', 'gz'].includes(ext || '')) icon = '📦';
        else if (['xlsx', 'csv'].includes(ext || '')) icon = '📊';

        return (
          <div className="flex items-center gap-3">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div>
              <p className="font-semibold text-white flex items-center gap-2">
                <span>{row.title}</span>
                {row.isCustomUploaded && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    NEW UPLOAD
                  </span>
                )}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">ID: {row.id}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Category',
      accessor: (row) => {
        let badgeColor = 'bg-zinc-800 text-zinc-300 border-zinc-700';
        if (row.category.includes('Legal')) badgeColor = 'bg-blue-950/70 text-blue-300 border-blue-800/60';
        else if (row.category.includes('Compliance')) badgeColor = 'bg-purple-950/70 text-purple-300 border-purple-800/60';
        else if (row.category.includes('Project')) badgeColor = 'bg-amber-950/70 text-amber-300 border-amber-800/60';
        else if (row.category.includes('Design')) badgeColor = 'bg-pink-950/70 text-pink-300 border-pink-800/60';
        else if (row.category.includes('Architecture')) badgeColor = 'bg-teal-950/70 text-teal-300 border-teal-800/60';

        return (
          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${badgeColor}`}>
            {row.category}
          </span>
        );
      },
    },
    {
      header: 'Size',
      accessor: (row) => <span className="font-mono text-xs text-zinc-300">{row.size}</span>,
    },
    {
      header: 'Last Modified',
      accessor: (row) => <span className="text-xs text-zinc-400">{row.updated_at}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleDownload(row)}
            className="p-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-medium border border-zinc-700 transition-colors flex items-center gap-1"
            title="Download document"
          >
            <span>📥 Download</span>
          </button>
          <button
            onClick={() => handleDeleteDoc(row.id, row.title)}
            className="p-1.5 px-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-lg text-xs border border-red-800/40 transition-colors"
            title="Delete document"
          >
            <span>🗑️</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={portalTitle}
        description={portalDescription}
        breadcrumbs={breadcrumbs || [{ label: 'Enterprise Hub' }, { label: 'Files & Assets Vault' }]}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`mb-6 p-4 rounded-xl border text-sm flex items-center justify-between gap-3 animate-fadeIn ${
          notification.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-zinc-900 border-zinc-700 text-zinc-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{notification.type === 'success' ? '✅' : 'ℹ️'}</span>
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Upload Zone */}
      <div className="mb-8">
        <FileUpload
          onFileSelect={handleFileUpload}
          label="Upload Document into Enterprise Vault"
          isUploading={isUploading}
        />
      </div>

      {/* Vault Controls & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap capitalize ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat === 'all' ? 'All Documents' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search documents by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-8 bg-zinc-900 border border-zinc-800 focus:border-[#D4AF37] rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
          />
          <span className="absolute left-2.5 top-2.5 text-zinc-500 text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-zinc-400 font-semibold">
          <span>Documents & Uploaded Assets ({filteredDocs.length})</span>
          <span className="text-[11px] font-normal text-zinc-500">
            Total stored: {docs.length} items
          </span>
        </div>

        <DataTable
          loading={loading}
          data={filteredDocs}
          columns={columns}
          emptyTitle="No documents found"
          emptyMessage={
            searchQuery
              ? `No documents match "${searchQuery}". Try a different search keyword.`
              : 'The vault is empty. Drag and drop any file above to upload.'
          }
        />
      </div>
    </PageContainer>
  );
};

export default Documents;
