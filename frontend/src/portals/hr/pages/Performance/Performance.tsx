import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

export const Performance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'goals' | 'reviews'>('goals');
  const [goals, setGoals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', description: '', progress: 0, target_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const [gRes, rRes] = await Promise.all([
        hrApi.getAllPerformanceGoals({ limit: 50 }).catch(() => ({ data: [] })),
        hrApi.getAllPerformanceReviews({ limit: 50 }).catch(() => ({ data: [] })),
      ]);
      setGoals(Array.isArray(gRes?.data) ? gRes.data : []);
      setReviews(Array.isArray(rRes?.data) ? rRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hrApi.createPerformanceGoal({
        title: goalForm.title,
        description: goalForm.description,
        progress: Number(goalForm.progress),
        target_date: goalForm.target_date || null,
      });
      setShowGoalModal(false);
      setGoalForm({ title: '', description: '', progress: 0, target_date: '' });
      await fetchPerformance();
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (reviewId: string) => {
    try {
      await hrApi.acknowledgePerformanceReview(reviewId);
      await fetchPerformance();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎯</span> Performance, OKRs & Appraisals
          </h2>
          <p className="text-xs text-[#9B9DA3]">Track quarterly milestones, employee goals, and evaluation reviews</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'goals' && (
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#C9A84C]/20"
            >
              <span>+</span> New Goal / OKR
            </button>
          )}

          <div className="bg-[#15181D] p-1 rounded-lg border border-[#272B35] flex">
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'goals'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              Goals & OKRs ({goals.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'reviews'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'goals' ? (
        /* Goals view */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 p-12 text-center text-xs text-[#9B9DA3]">Loading goals...</div>
          ) : goals.length === 0 ? (
            <div className="col-span-3 bg-[#15181D] border border-[#272B35] rounded-xl p-12 text-center space-y-3">
              <div className="text-3xl">🎯</div>
              <p className="text-sm font-semibold text-white">No Goals Defined</p>
              <p className="text-xs text-[#9B9DA3]">Create your first team or personal milestone OKR.</p>
              <button onClick={() => setShowGoalModal(true)} className="px-4 py-2 bg-[#C9A84C] text-black font-semibold text-xs rounded-lg">
                Create Goal
              </button>
            </div>
          ) : (
            goals.map((g) => (
              <div key={g.id} className="bg-[#15181D] border border-[#272B35] rounded-xl p-5 space-y-3 shadow-lg">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-white">{g.title}</h3>
                  <span className="text-xs font-mono font-bold text-[#EDB940]">{g.progress || 0}%</span>
                </div>
                <p className="text-xs text-[#9B9DA3] line-clamp-2">{g.description || 'Target milestone for current review cycle.'}</p>
                <div className="w-full bg-[#0E1013] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#C9A84C] to-[#EDB940] h-full transition-all"
                    style={{ width: `${Math.min(100, g.progress || 0)}%` }}
                  />
                </div>
                <div className="pt-2 border-t border-[#272B35] flex items-center justify-between text-[11px] text-[#7A7D84]">
                  <span>Target Date</span>
                  <span className="font-mono text-white">{g.target_date || 'Q4 Target'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Reviews view */
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
                <tr>
                  <th className="px-5 py-3.5">Review Cycle</th>
                  <th className="px-5 py-3.5">Rating Score</th>
                  <th className="px-5 py-3.5">Manager Feedback</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272B35] text-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[#9B9DA3]">
                      Loading reviews...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[#9B9DA3]">
                      No evaluation reviews found.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-[#1A1E24] transition-colors">
                      <td className="px-5 py-3.5 font-bold">{r.review_cycle || 'Annual 2026'}</td>
                      <td className="px-5 py-3.5 font-mono text-[#EDB940] font-bold">{r.rating ? `${r.rating}/5.0` : 'Pending'}</td>
                      <td className="px-5 py-3.5 text-[#9B9DA3] max-w-sm truncate">{r.manager_feedback || 'Completed evaluation'}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30">
                          {r.status || 'completed'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!r.employee_acknowledged_at && (
                          <button
                            onClick={() => handleAcknowledge(r.id)}
                            className="px-2.5 py-1 bg-[#C9A84C]/20 hover:bg-[#C9A84C]/30 text-[#EDB940] border border-[#C9A84C]/40 rounded text-[11px]"
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Create Goal / Milestone</span>
              <button onClick={() => setShowGoalModal(false)} className="text-[#9B9DA3] hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9B9DA3] mb-1">Goal Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Complete SOC2 Certification Training"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Specific deliverables and outcomes..."
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9B9DA3] mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                    className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
                <div>
                  <label className="block text-[#9B9DA3] mb-1">Initial Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={goalForm.progress}
                    onChange={(e) => setGoalForm({ ...goalForm, progress: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 bg-[#272B35] hover:bg-[#343A46] text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold rounded-lg transition-all"
                >
                  {submitting ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
