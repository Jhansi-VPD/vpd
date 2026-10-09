import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

interface JobFormData {
  title: string;
  department: string;
  location: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  experience_required: string;
  status: 'open' | 'closed';
  description: string;
  responsibilities: string;
  requirements: string;
}

const initialJobForm: JobFormData = {
  title: '',
  department: 'Engineering',
  location: 'Remote / Hybrid',
  employment_type: 'full_time',
  experience_required: '2+ years',
  status: 'open',
  description: '',
  responsibilities: '',
  requirements: '',
};

export const Recruitment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
  const [careers, setCareers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & form states
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [jobForm, setJobForm] = useState<JobFormData>(initialJobForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Card interaction states
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const fetchRecruitment = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        // Pass status: 'all' so HR can manage both open and closed jobs
        hrApi.getCareers({ limit: 100, status: 'all' }).catch(() => ({ data: [] })),
        hrApi.getApplications({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setCareers(Array.isArray(cRes?.data) ? cRes.data : []);
      setApplications(Array.isArray(aRes?.data) ? aRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitment();
  }, []);

  // Lock body scroll and allow ESC to close when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showJobModal) {
        setShowJobModal(false);
      }
    };
    if (showJobModal) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showJobModal]);

  const handleOpenCreate = () => {
    setEditingJob(null);
    setJobForm(initialJobForm);
    setFormErrors({});
    setShowJobModal(true);
  };

  const handleOpenEdit = (job: any) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '',
      department: job.department || '',
      location: job.location || '',
      employment_type: (job.employment_type || 'full_time') as any,
      experience_required: job.experience_required || '',
      status: (job.status || 'open') as any,
      description: job.description || '',
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : '',
      requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : '',
    });
    setFormErrors({});
    setShowJobModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!jobForm.title.trim()) {
      errors.title = 'Position title is required.';
    } else if (jobForm.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }

    if (!['full_time', 'part_time', 'contract', 'internship'].includes(jobForm.employment_type)) {
      errors.employment_type = 'Please select a valid employment type.';
    }

    if (!['open', 'closed'].includes(jobForm.status)) {
      errors.status = 'Status must be open or closed.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const parseList = (text: string): string[] =>
        text
          .split('\n')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

      const payload: Record<string, any> = {
        title: jobForm.title.trim(),
        department: jobForm.department.trim() || undefined,
        location: jobForm.location.trim() || undefined,
        employment_type: jobForm.employment_type,
        experience_required: jobForm.experience_required.trim() || undefined,
        status: jobForm.status,
        description: jobForm.description.trim() || undefined,
        responsibilities: parseList(jobForm.responsibilities),
        requirements: parseList(jobForm.requirements),
      };

      if (editingJob) {
        await hrApi.updateCareer(editingJob.id, payload);
      } else {
        await hrApi.createCareer(payload);
      }

      setShowJobModal(false);
      setEditingJob(null);
      setJobForm(initialJobForm);
      await fetchRecruitment();
    } catch (err: any) {
      alert(err.message || 'Failed to save job opening');
    } finally {
      setSubmitting(false);
    }
  };

  // Interactive quick-toggle status directly on job card
  const handleToggleStatus = async (job: any) => {
    const nextStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      setStatusUpdatingId(job.id);
      // Optimistic update
      setCareers((prev) =>
        prev.map((item) => (item.id === job.id ? { ...item, status: nextStatus } : item))
      );
      await hrApi.updateCareer(job.id, { status: nextStatus });
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
      await fetchRecruitment();
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteJob = async (job: any) => {
    if (!window.confirm(`Are you sure you want to delete the job posting "${job.title}"?`)) return;
    try {
      setDeletingId(job.id);
      await hrApi.deleteCareer(job.id);
      await fetchRecruitment();
    } catch (err: any) {
      alert(err.message || 'Failed to delete job posting');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await hrApi.updateApplicationStatus(appId, newStatus);
      await fetchRecruitment();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const filteredCareers = careers.filter((job) => {
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (job.title || '').toLowerCase().includes(q);
      const matchDept = (job.department || '').toLowerCase().includes(q);
      const matchLoc = (job.location || '').toLowerCase().includes(q);
      return matchTitle || matchDept || matchLoc;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💼</span> Talent Acquisition & Recruitment ATS
          </h2>
          <p className="text-xs text-[#9B9DA3]">Manage hiring campaigns, job postings, and candidate assessment pipelines</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#C9A84C]/20"
          >
            <span>+</span> Post Job
          </button>

          <div className="bg-[#15181D] p-1 rounded-lg border border-[#272B35] flex">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'jobs'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              Jobs ({careers.length})
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'candidates'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              Candidates ({applications.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'jobs' ? (
        <div className="space-y-4">
          {/* Controls Bar: Search & Status Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#15181D] p-3 rounded-xl border border-[#272B35]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="text-[#9B9DA3] text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search jobs by title, department, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#5A5D64] focus:outline-none focus:border-[#C9A84C]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#9B9DA3] hover:text-white px-1"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-start md:self-auto">
              <span className="text-[11px] text-[#9B9DA3] mr-1">Status:</span>
              {(['all', 'open', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all capitalize ${
                    statusFilter === s
                      ? s === 'closed'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-[#C9A84C] text-black font-semibold'
                      : 'bg-[#0E1013] text-[#9B9DA3] border border-[#272B35] hover:text-white'
                  }`}
                >
                  {s === 'all' ? `All (${careers.length})` : s === 'open' ? `Open (${careers.filter(c => c.status === 'open').length})` : `Closed (${careers.filter(c => c.status === 'closed').length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Job Cards Grid */}
          {loading ? (
            <div className="p-16 text-center text-xs text-[#9B9DA3]">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full mb-3"></div>
              <div>Loading career postings...</div>
            </div>
          ) : filteredCareers.length === 0 ? (
            <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-12 text-center space-y-3">
              <div className="text-3xl">💼</div>
              <p className="text-sm font-semibold text-white">No Matching Job Openings Found</p>
              <p className="text-xs text-[#9B9DA3]">
                {careers.length === 0
                  ? 'Launch your first job posting.'
                  : 'Try clearing your search query or changing status filters.'}
              </p>
              {careers.length === 0 ? (
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 bg-[#C9A84C] text-black font-semibold text-xs rounded-lg shadow"
                >
                  Post First Opening
                </button>
              ) : (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                  className="px-3 py-1.5 bg-[#272B35] text-white text-xs rounded-lg hover:bg-[#343A46]"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCareers.map((j) => {
                const isOpen = j.status === 'open';
                const isExpanded = expandedJobId === j.id;
                const isStatusUpdating = statusUpdatingId === j.id;
                const isDeleting = deletingId === j.id;

                const respCount = Array.isArray(j.responsibilities) ? j.responsibilities.length : 0;
                const reqCount = Array.isArray(j.requirements) ? j.requirements.length : 0;

                return (
                  <div
                    key={j.id}
                    className={`bg-[#15181D] border rounded-xl p-5 space-y-4 shadow-lg transition-all flex flex-col justify-between hover:border-[#3E4352] ${
                      isOpen ? 'border-[#272B35]' : 'border-rose-950/40 opacity-90'
                    }`}
                  >
                    {/* Top Row: Department & Status Badge */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C9A84C]/15 text-[#EDB940] border border-[#C9A84C]/30 truncate max-w-[150px]">
                          {j.department || 'General'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(j)}
                            disabled={isStatusUpdating}
                            title={`Click to ${isOpen ? 'Close' : 'Reopen'} position`}
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border transition-all flex items-center gap-1 ${
                              isOpen
                                ? 'bg-[#16A34A]/20 text-[#22C55E] border-[#16A34A]/40 hover:bg-[#16A34A]/30'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-[#22C55E] animate-pulse' : 'bg-rose-400'}`}></span>
                            {isStatusUpdating ? 'Saving...' : isOpen ? 'Open' : 'Closed'}
                          </button>
                        </div>
                      </div>

                      {/* Title & Experience */}
                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{j.title}</h3>
                        {j.experience_required && (
                          <p className="text-[11px] text-[#C9A84C] font-medium mt-0.5 flex items-center gap-1">
                            <span>🎯</span> {j.experience_required}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[#9B9DA3] line-clamp-2 leading-relaxed">
                        {j.description || 'No description provided for this opening.'}
                      </p>

                      {/* Meta Tags: Location & Type */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#7A7D84]">
                        <span className="flex items-center gap-1 bg-[#0E1013] px-2 py-0.5 rounded border border-[#272B35]">
                          <span>📍</span> {j.location || 'Remote'}
                        </span>
                        <span className="flex items-center gap-1 bg-[#0E1013] px-2 py-0.5 rounded border border-[#272B35] text-[#EDB940] capitalize">
                          <span>⏱️</span> {j.employment_type ? j.employment_type.replace('_', '-') : 'Full-time'}
                        </span>
                      </div>

                      {/* Summary Chips & Expandable Details */}
                      {(respCount > 0 || reqCount > 0) && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedJobId(isExpanded ? null : j.id)}
                            className="text-[11px] text-[#C9A84C] hover:text-[#EDB940] flex items-center gap-1.5 focus:outline-none transition-colors"
                          >
                            <span>{isExpanded ? '▲ Hide Details' : '▼ View Requirements & Scope'}</span>
                            <span className="text-[10px] text-[#7A7D84]">({respCount + reqCount} items)</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2.5 p-3 bg-[#0E1013] border border-[#272B35] rounded-lg text-xs space-y-2.5 max-h-48 overflow-y-auto">
                              {respCount > 0 && (
                                <div>
                                  <h4 className="font-semibold text-zinc-300 text-[11px] mb-1">Responsibilities:</h4>
                                  <ul className="list-disc list-inside space-y-0.5 text-[#9B9DA3] text-[11px]">
                                    {j.responsibilities.map((r: string, idx: number) => (
                                      <li key={idx} className="leading-tight">{r}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {reqCount > 0 && (
                                <div>
                                  <h4 className="font-semibold text-zinc-300 text-[11px] mb-1">Requirements:</h4>
                                  <ul className="list-disc list-inside space-y-0.5 text-[#9B9DA3] text-[11px]">
                                    {j.requirements.map((r: string, idx: number) => (
                                      <li key={idx} className="leading-tight">{r}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Footer */}
                    <div className="pt-3 border-t border-[#272B35] flex items-center justify-between gap-2 text-xs">
                      <div className="text-[10px] text-[#7A7D84]">
                        {j.created_at ? new Date(j.created_at).toLocaleDateString() : 'Active'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Quick Status Button */}
                        <button
                          onClick={() => handleToggleStatus(j)}
                          disabled={isStatusUpdating}
                          className="px-2.5 py-1 text-[11px] font-medium bg-[#0E1013] hover:bg-[#20242C] text-[#C9A84C] border border-[#272B35] rounded-md transition-all disabled:opacity-50"
                        >
                          {isOpen ? 'Close Role' : 'Reopen Role'}
                        </button>

                        {/* Edit Role Button */}
                        <button
                          onClick={() => handleOpenEdit(j)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-[#272B35] hover:bg-[#343A46] text-white rounded-md transition-all flex items-center gap-1"
                          title="Edit Position Details"
                        >
                          <span>✏️</span> Edit
                        </button>

                        {/* Delete Role Button */}
                        <button
                          onClick={() => handleDeleteJob(j)}
                          disabled={isDeleting}
                          className="p-1 text-[#9B9DA3] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all disabled:opacity-50"
                          title="Delete Position"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Candidates ATS Tab */
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
                <tr>
                  <th className="px-5 py-3.5">Candidate Name</th>
                  <th className="px-5 py-3.5">Email / Contact</th>
                  <th className="px-5 py-3.5">Position / Role</th>
                  <th className="px-5 py-3.5">Stage Status</th>
                  <th className="px-5 py-3.5 text-right">Update Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272B35] text-white">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[#9B9DA3]">
                      No applicant profiles currently in review.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#1A1E24] transition-colors">
                      <td className="px-5 py-3.5 font-bold">{app.full_name || 'Candidate'}</td>
                      <td className="px-5 py-3.5 text-[#9B9DA3]">
                        <div>{app.email}</div>
                        {app.phone && <div className="text-[10px] text-[#7A7D84]">{app.phone}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-[#EDB940] font-medium">
                        {careers.find((c) => c.id === app.career_id)?.title || 'General Application'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C9A84C]/20 text-[#EDB940] border border-[#C9A84C]/30 capitalize">
                          {app.status || 'applied'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select
                          value={app.status || 'applied'}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="bg-[#0E1013] border border-[#272B35] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#C9A84C]"
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="offered">Offered</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post / Edit Job Opening Modal */}
      {showJobModal && (
        <div
          onClick={() => setShowJobModal(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] bg-[#14161C] border border-[#272B35] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#272B35] bg-[#181B23] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center text-base">
                  💼
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {editingJob ? 'Edit Career Opening' : 'Post New Career Opening'}
                  </h3>
                  <p className="text-[11px] text-[#9B9DA3]">
                    {editingJob
                      ? `Updating details for "${editingJob.title}"`
                      : 'Configure role parameters, candidate requirements, and scope'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9B9DA3] hover:text-white hover:bg-[#272B35] transition-all text-sm focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitJob} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable Form Body */}
              <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs flex-1">
                {/* Position Title */}
                <div>
                  <label className="block text-[#9B9DA3] font-medium mb-1">
                    Position Title <span className="text-[#EDB940]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={jobForm.title}
                    onChange={(e) => {
                      setJobForm({ ...jobForm, title: e.target.value });
                      if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                    }}
                    className={`w-full bg-[#0E1013] border rounded-lg px-3 py-2 text-white placeholder-[#5A5D64] focus:outline-none transition-all ${
                      formErrors.title ? 'border-rose-500 focus:border-rose-400' : 'border-[#272B35] focus:border-[#C9A84C]'
                    }`}
                  />
                  {formErrors.title && (
                    <p className="text-rose-400 text-[10px] mt-1">{formErrors.title}</p>
                  )}
                </div>

                {/* Department & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#9B9DA3] font-medium mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering, Sales, QA, Product"
                      value={jobForm.department}
                      onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                      className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white placeholder-[#5A5D64] focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9B9DA3] font-medium mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Remote / Hybrid, Bengaluru"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white placeholder-[#5A5D64] focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                </div>

                {/* Employment Type, Experience Required & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#9B9DA3] font-medium mb-1">Employment Type</label>
                    <select
                      value={jobForm.employment_type}
                      onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value as any })}
                      className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                    >
                      <option value="full_time">Full-time</option>
                      <option value="part_time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#9B9DA3] font-medium mb-1">Experience Required</label>
                    <input
                      type="text"
                      placeholder="e.g. 3-5 years, Mid-Senior"
                      value={jobForm.experience_required}
                      onChange={(e) => setJobForm({ ...jobForm, experience_required: e.target.value })}
                      className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white placeholder-[#5A5D64] focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#9B9DA3] font-medium mb-1">Job Status</label>
                    <select
                      value={jobForm.status}
                      onChange={(e) => setJobForm({ ...jobForm, status: e.target.value as any })}
                      className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                    >
                      <option value="open">🟢 Open (Active)</option>
                      <option value="closed">🔴 Closed (Paused)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[#9B9DA3] font-medium mb-1">Job Summary & Overview</label>
                  <textarea
                    rows={2}
                    placeholder="Brief overview of the role objectives, team dynamics, and impact..."
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white placeholder-[#5A5D64] focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>

                {/* Responsibilities & Requirements Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Responsibilities */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[#9B9DA3] font-medium">Key Responsibilities</label>
                      <span className="text-[10px] text-[#7A7D84]">One item per line</span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Design and build cloud-native services&#10;Collaborate with product and UX designers&#10;Lead architectural code reviews"
                      value={jobForm.responsibilities}
                      onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
                      className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white placeholder-[#5A5D64] font-mono text-[11px] focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>

                  {/* Requirements */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[#9B9DA3] font-medium">Skills & Requirements</label>
                      <span className="text-[10px] text-[#7A7D84]">One item per line</span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="3+ years building Python/FastAPI backends&#10;Solid understanding of PostgreSQL and Redis&#10;Proficiency with React and TypeScript"
                      value={jobForm.requirements}
                      onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                      className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white placeholder-[#5A5D64] font-mono text-[11px] focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-3.5 border-t border-[#272B35] bg-[#181B23] flex items-center justify-between shrink-0">
                <span className="text-[11px] text-[#7A7D84]">
                  <span className="text-[#EDB940]">*</span> Required position field
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowJobModal(false)}
                    className="px-4 py-2 bg-[#20242D] hover:bg-[#2B313D] text-[#D1D3D8] hover:text-white rounded-lg text-xs font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold rounded-lg text-xs transition-all shadow-md shadow-[#C9A84C]/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting && (
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span>
                      {editingJob
                        ? submitting
                          ? 'Updating...'
                          : 'Update Opening'
                        : submitting
                        ? 'Posting...'
                        : 'Publish Opening'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recruitment;
