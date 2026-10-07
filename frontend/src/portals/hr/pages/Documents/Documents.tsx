import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('contract');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await hrApi.getMyDocuments();
      setDocuments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('type', uploadType);
      formData.append('file', selectedFile);

      await hrApi.uploadMyDocument(formData);
      setShowUploadModal(false);
      setUploadTitle('');
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'contract', label: 'Contracts & Agreements' },
    { id: 'tax_id', label: 'Tax & Compliance IDs' },
    { id: 'resume', label: 'Resumes & Profiles' },
    { id: 'other', label: 'General HR Forms' },
  ];

  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory === 'all') return true;
    return String(doc.type || '').toLowerCase() === selectedCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📁</span> Corporate Document Vault
          </h2>
          <p className="text-xs text-[#9B9DA3]">Secure storage for employment contracts, NDA agreements, tax forms, and IDs</p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#C9A84C]/20"
        >
          <span>+</span> Upload Document
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#C9A84C] text-black shadow-sm'
                : 'bg-[#15181D] text-[#9B9DA3] hover:text-white border border-[#272B35]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table view */}
      <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
              <tr>
                <th className="px-5 py-3.5">Document Title</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Security Level</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272B35] text-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[#9B9DA3]">
                    Loading vaulted documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[#9B9DA3]">
                    No files found in this category.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#1A1E24] transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-2">
                      <span>📄</span>
                      <span className="font-semibold">{doc.title}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C9A84C]/15 text-[#EDB940] border border-[#C9A84C]/30 uppercase font-mono">
                        {doc.type || 'Document'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#16A34A] font-semibold text-[11px]">
                      🔒 Encrypted Storage
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-[#272B35] hover:bg-[#343A46] text-[#C9A84C] font-semibold rounded text-[11px]"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-[#7A7D84]">Available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Secure Document Upload</span>
              <button onClick={() => setShowUploadModal(false)} className="text-[#9B9DA3] hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9B9DA3] mb-1">Document Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Executed Employment Agreement"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Document Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                >
                  <option value="contract">Employment Contract</option>
                  <option value="tax_id">Tax ID / Form W-4</option>
                  <option value="resume">Resume / CV</option>
                  <option value="other">General Form</option>
                </select>
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Select File (PDF, DOCX, PNG) *</label>
                <input
                  required
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#C9A84C] file:text-black cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-[#272B35] hover:bg-[#343A46] text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold rounded-lg transition-all"
                >
                  {uploading ? 'Encrypting & Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
