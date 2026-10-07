import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await hrApi.getDepartments({ limit: 100 });
      setDepartments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (dept: any) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDept) {
        await hrApi.updateDepartment(editingDept.id, formData);
      } else {
        await hrApi.createDepartment(formData);
      }
      setShowModal(false);
      await fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await hrApi.deleteDepartment(id);
      await fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🏛️</span> Organizational Departments & Units
          </h2>
          <p className="text-xs text-[#9B9DA3]">Manage business units, administrative divisions, and team structures</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#C9A84C]/20"
        >
          <span>+</span> Add Department
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#9B9DA3]">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-12 text-center space-y-3">
          <div className="text-3xl">🏛️</div>
          <p className="text-sm font-semibold text-white">No Departments Registered</p>
          <p className="text-xs text-[#9B9DA3]">Get started by defining your organization's first department.</p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#C9A84C] text-black font-semibold text-xs rounded-lg"
          >
            Create Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-[#15181D] border border-[#272B35] hover:border-[#C9A84C]/50 rounded-xl p-5 space-y-4 shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#EDB940] transition-colors">
                    {dept.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">
                    ID: {dept.id.substring(0, 8)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="text-xs text-[#9B9DA3] hover:text-white"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="text-xs text-[#DC2626] hover:text-[#F87171]"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#9B9DA3] line-clamp-2">
                {dept.description || 'Enterprise operational unit and service delivery team.'}
              </p>

              <div className="pt-2 border-t border-[#272B35] flex items-center justify-between text-[11px] text-[#7A7D84]">
                <span>Status</span>
                <span className="text-[#16A34A] font-semibold">Active Unit</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>{editingDept ? 'Edit Department' : 'Create Department'}</span>
              <button onClick={() => setShowModal(false)} className="text-[#9B9DA3] hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9B9DA3] mb-1">Department Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Engineering, People Ops, Sales"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Responsibilities, scope, and objectives..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#272B35] hover:bg-[#343A46] text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold rounded-lg transition-all"
                >
                  {submitting ? 'Saving...' : editingDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
