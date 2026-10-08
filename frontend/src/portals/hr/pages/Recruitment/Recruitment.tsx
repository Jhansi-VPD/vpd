import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

export const Recruitment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requisitions' | 'candidates'>('requisitions');
  const [careers, setCareers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    department: 'Engineering',
    location: 'Remote / Hybrid',
    employment_type: 'full_time',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRecruitment = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        hrApi.getCareers({ limit: 50 }).catch(() => ({ data: [] })),
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

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const normalizedType = (jobForm.employment_type || 'full_time').toLowerCase().replace(/[\s-]+/g, '_');
      await hrApi.createCareer({
        ...jobForm,
        employment_type: normalizedType,
      });
      setShowJobModal(false);
      setJobForm({ title: '', department: 'Engineering', location: 'Remote / Hybrid', employment_type: 'full_time', description: '' });
      await fetchRecruitment();
    } catch (err: any) {
      alert(err.message || 'Failed to post opening');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💼</span> Talent Acquisition & Recruitment ATS
          </h2>
          <p className="text-xs text-[#9B9DA3]">Manage hiring campaigns, job requisitions, and candidate assessment pipelines</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJobModal(true)}
            className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#C9A84C]/20"
          >
            <span>+</span> Post Requisition
          </button>

          <div className="bg-[#15181D] p-1 rounded-lg border border-[#272B35] flex">
            <button
              onClick={() => setActiveTab('requisitions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'requisitions'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              Open Roles ({careers.length})
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

      {activeTab === 'requisitions' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 p-12 text-center text-xs text-[#9B9DA3]">Loading active positions...</div>
          ) : careers.length === 0 ? (
            <div className="col-span-3 bg-[#15181D] border border-[#272B35] rounded-xl p-12 text-center space-y-3">
              <div className="text-3xl">💼</div>
              <p className="text-sm font-semibold text-white">No Open Positions</p>
              <p className="text-xs text-[#9B9DA3]">Launch your first candidate hiring requisition.</p>
              <button onClick={() => setShowJobModal(true)} className="px-4 py-2 bg-[#C9A84C] text-black font-semibold text-xs rounded-lg">
                Create Job Opening
              </button>
            </div>
          ) : (
            careers.map((j) => (
              <div key={j.id} className="bg-[#15181D] border border-[#272B35] rounded-xl p-5 space-y-3 shadow-lg flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C9A84C]/15 text-[#EDB940] border border-[#C9A84C]/30">
                      {j.department || 'Engineering'}
                    </span>
                    <span className="text-[11px] text-[#16A34A] font-semibold uppercase">Active</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{j.title}</h3>
                  <p className="text-xs text-[#9B9DA3] line-clamp-3">{j.description || 'Full-time engineering position with competitive benefits.'}</p>
                </div>

                <div className="pt-3 border-t border-[#272B35] flex items-center justify-between text-xs text-[#7A7D84]">
                  <span>{j.location || 'Remote'}</span>
                  <span className="text-[#EDB940] font-semibold capitalize">{j.employment_type ? j.employment_type.replace('_', '-') : 'Full-time'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
                <tr>
                  <th className="px-5 py-3.5">Candidate Name</th>
                  <th className="px-5 py-3.5">Email / Contact</th>
                  <th className="px-5 py-3.5">Stage Status</th>
                  <th className="px-5 py-3.5 text-right">Update Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272B35] text-white">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[#9B9DA3]">
                      No applicant profiles currently in review.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#1A1E24] transition-colors">
                      <td className="px-5 py-3.5 font-bold">{app.full_name || 'Candidate'}</td>
                      <td className="px-5 py-3.5 text-[#9B9DA3]">{app.email}</td>
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
                          <option value="screening">Screening</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="offered">Offered</option>
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

      {/* Post Opening Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Post Job Opening</span>
              <button onClick={() => setShowJobModal(false)} className="text-[#9B9DA3] hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9B9DA3] mb-1">Position Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Lead Solutions Architect"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Engineering, Sales, QA"
                  value={jobForm.department}
                  onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9B9DA3] mb-1">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
                <div>
                  <label className="block text-[#9B9DA3] mb-1">Employment Type</label>
                  <select
                    value={jobForm.employment_type}
                    onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })}
                    className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                  >
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Requirements & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Responsibilities, qualification, and deliverables..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 bg-[#272B35] hover:bg-[#343A46] text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold rounded-lg transition-all"
                >
                  {submitting ? 'Posting...' : 'Publish Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recruitment;
