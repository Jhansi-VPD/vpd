import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

export const Training: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'enrolled'>('catalog');
  const [courses, setCourses] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'Technical', description: '', duration_hours: 10 });
  const [submitting, setSubmitting] = useState(false);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([
        hrApi.getCourses().catch(() => ({ data: [] })),
        hrApi.getMyEnrollments().catch(() => ({ data: [] })),
      ]);
      setCourses(Array.isArray(cRes?.data) ? cRes.data : []);
      setMyEnrollments(Array.isArray(eRes?.data) ? eRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      await hrApi.enrollCourse(courseId);
      alert('Successfully enrolled in course!');
      await fetchTrainings();
    } catch (err: any) {
      alert(err.message || 'Enrollment failed');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hrApi.createCourse({
        title: formData.title,
        category: formData.category,
        description: formData.description,
        duration_hours: Number(formData.duration_hours),
        is_published: true,
      });
      setShowAddModal(false);
      setFormData({ title: '', category: 'Technical', description: '', duration_hours: 10 });
      await fetchTrainings();
    } catch (err: any) {
      alert(err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const enrolledCourseIds = new Set(myEnrollments.map((e) => e.course_id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎓</span> Learning, Training & Certifications
          </h2>
          <p className="text-xs text-[#9B9DA3]">Upskill team capabilities, track mandatory compliance, and award certificates</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#C9A84C]/20"
          >
            <span>+</span> Publish Course
          </button>

          <div className="bg-[#15181D] p-1 rounded-lg border border-[#272B35] flex">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'catalog'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              Course Catalog ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'enrolled'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              My Courses ({myEnrollments.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 p-12 text-center text-xs text-[#9B9DA3]">Loading training courses...</div>
          ) : courses.length === 0 ? (
            <div className="col-span-3 bg-[#15181D] border border-[#272B35] rounded-xl p-12 text-center space-y-3">
              <div className="text-3xl">🎓</div>
              <p className="text-sm font-semibold text-white">No Published Courses</p>
              <p className="text-xs text-[#9B9DA3]">Add the first training module to the catalog.</p>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#C9A84C] text-black font-semibold text-xs rounded-lg">
                Publish Course
              </button>
            </div>
          ) : (
            courses.map((c) => {
              const isEnrolled = enrolledCourseIds.has(c.id);
              return (
                <div key={c.id} className="bg-[#15181D] border border-[#272B35] rounded-xl p-5 space-y-3 shadow-lg flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C9A84C]/15 text-[#EDB940] border border-[#C9A84C]/30">
                        {c.category || 'General'}
                      </span>
                      <span className="text-xs text-[#9B9DA3]">{c.duration_hours || 8} hrs</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{c.title}</h3>
                    <p className="text-xs text-[#9B9DA3] line-clamp-3">{c.description || 'Professional development course designed for engineers and staff.'}</p>
                  </div>

                  <div className="pt-3 border-t border-[#272B35] flex items-center justify-between">
                    <span className="text-[11px] text-[#7A7D84]">Self-Paced</span>
                    {isEnrolled ? (
                      <span className="text-xs text-[#16A34A] font-semibold flex items-center gap-1">
                        ✓ Enrolled
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c.id)}
                        className="px-3 py-1.5 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded transition-all"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
                <tr>
                  <th className="px-5 py-3.5">Course Name</th>
                  <th className="px-5 py-3.5">Enrollment Status</th>
                  <th className="px-5 py-3.5">Progress</th>
                  <th className="px-5 py-3.5 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272B35] text-white">
                {myEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[#9B9DA3]">
                      You have not enrolled in any training courses yet.
                    </td>
                  </tr>
                ) : (
                  myEnrollments.map((en) => (
                    <tr key={en.id} className="hover:bg-[#1A1E24] transition-colors">
                      <td className="px-5 py-3.5 font-bold">{en.course?.title || 'Technical Module'}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30">
                          {en.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-32 bg-[#0E1013] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#C9A84C] h-full w-[45%]" />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[#C9A84C] font-semibold">
                        In Progress
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Publish Training Course</span>
              <button onClick={() => setShowAddModal(false)} className="text-[#9B9DA3] hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9B9DA3] mb-1">Course Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Advanced FastApi & Microservices"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Engineering, Compliance, Leadership"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Syllabus, topics, and expectations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#272B35] hover:bg-[#343A46] text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold rounded-lg transition-all"
                >
                  {submitting ? 'Publishing...' : 'Publish Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
