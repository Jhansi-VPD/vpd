import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

export const Employees: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'profile'>('directory');
  const [employees, setEmployees] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userMode, setUserMode] = useState<'existing' | 'new'>('existing');
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    email: '',
    employee_code: '',
    designation: '',
    department_id: '',
    salary: '',
    office_location: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, profRes, deptRes, userRes] = await Promise.all([
        hrApi.getEmployees({ limit: 100 }).catch(() => ({ data: [] })),
        hrApi.getMyProfile().catch(() => ({ data: null })),
        hrApi.getDepartments().catch(() => ({ data: [] })),
        hrApi.getUsers({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setEmployees(Array.isArray(empRes?.data) ? empRes.data : []);
      setMyProfile(profRes?.data || null);
      setDepartments(Array.isArray(deptRes?.data) ? deptRes.data : []);
      setUsers(Array.isArray(userRes?.data) ? userRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let targetUserId = formData.user_id;

      if (userMode === 'new') {
        if (!formData.name || !formData.email) {
          alert('Full Name and Corporate Email are required to provision a user account.');
          setSubmitting(false);
          return;
        }
        const userRes = await hrApi.createUser({
          name: formData.name,
          email: formData.email,
          password: 'Password123!',
          role: 'employee',
        });
        targetUserId = userRes?.data?.id;
      }

      if (!targetUserId) {
        alert('Please select a user account or provision a new user.');
        setSubmitting(false);
        return;
      }

      await hrApi.createEmployee({
        user_id: targetUserId,
        employee_code: formData.employee_code,
        designation: formData.designation,
        department_id: formData.department_id || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        office_location: formData.office_location,
      });

      setShowAddModal(false);
      setFormData({
        user_id: '',
        name: '',
        email: '',
        employee_code: '',
        designation: '',
        department_id: '',
        salary: '',
        office_location: '',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee record?')) return;
    try {
      await hrApi.deleteEmployee(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchTerm.toLowerCase();
    return (
      (emp.designation && emp.designation.toLowerCase().includes(q)) ||
      (emp.employee_code && emp.employee_code.toLowerCase().includes(q)) ||
      (emp.user?.name && emp.user.name.toLowerCase().includes(q)) ||
      (emp.user?.email && emp.user.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>👥</span> Workforce & Employee Directory
          </h2>
          <p className="text-xs text-[#9B9DA3]">Manage corporate staffing, employee profiles, and organizational assignments</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#15181D] p-1 rounded-lg border border-[#272B35] flex">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'directory'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              All Staff ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              My Profile
            </button>
          </div>

          {activeTab === 'directory' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#C9A84C]/20"
            >
              <span>+</span> Add Employee
            </button>
          )}
        </div>
      </div>

      {activeTab === 'profile' ? (
        /* My Profile Tab */
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-6 max-w-2xl space-y-6">
          <div className="flex items-center gap-4 border-b border-[#272B35] pb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#C9A84C] to-[#EDB940] flex items-center justify-center text-black font-bold text-2xl">
              {myProfile?.name ? myProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{myProfile?.name || 'Current User'}</h3>
              <p className="text-xs text-[#C9A84C] font-mono">{myProfile?.designation || 'Specialist'}</p>
              <p className="text-xs text-[#9B9DA3]">{myProfile?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#0E1013] p-3 rounded-lg border border-[#272B35]">
              <span className="text-[#7A7D84] block">Employee Code</span>
              <span className="text-white font-mono font-semibold">{myProfile?.employee_code || 'EMP-001'}</span>
            </div>

            <div className="bg-[#0E1013] p-3 rounded-lg border border-[#272B35]">
              <span className="text-[#7A7D84] block">Department</span>
              <span className="text-white font-semibold">{myProfile?.department_name || 'Engineering'}</span>
            </div>

            <div className="bg-[#0E1013] p-3 rounded-lg border border-[#272B35]">
              <span className="text-[#7A7D84] block">Employment Status</span>
              <span className="text-[#16A34A] font-semibold uppercase">{myProfile?.status || 'Active'}</span>
            </div>

            <div className="bg-[#0E1013] p-3 rounded-lg border border-[#272B35]">
              <span className="text-[#7A7D84] block">Office Location</span>
              <span className="text-white font-semibold">{myProfile?.office_location || 'Headquarters'}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Directory Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Search by code, designation, or employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#15181D] border border-[#272B35] rounded-lg px-4 py-2 text-xs text-white placeholder-[#7A7D84] w-full max-w-sm focus:outline-none focus:border-[#C9A84C]"
            />
          </div>

          <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
                  <tr>
                    <th className="px-5 py-3.5">Employee Code</th>
                    <th className="px-5 py-3.5">Name / Contact</th>
                    <th className="px-5 py-3.5">Designation</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272B35] text-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[#9B9DA3]">
                        Loading employee records...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[#9B9DA3]">
                        No employees found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-[#1A1E24] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-[#C9A84C] font-semibold">{emp.employee_code}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold">{emp.user?.name || 'Staff Member'}</p>
                          <p className="text-[11px] text-[#7A7D84]">{emp.user?.email || '—'}</p>
                        </td>
                        <td className="px-5 py-3.5">{emp.designation || 'Staff'}</td>
                        <td className="px-5 py-3.5">{emp.department?.name || 'Unassigned'}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30">
                            {emp.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="text-[#DC2626] hover:text-[#F87171] hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Create Employee Record</span>
              <button onClick={() => setShowAddModal(false)} className="text-[#9B9DA3] hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              {/* User Account Selection or Provisioning */}
              <div>
                <label className="block text-[#9B9DA3] mb-1">User Account *</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setUserMode('existing')}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border transition-all ${
                      userMode === 'existing'
                        ? 'bg-[#C9A84C]/20 text-[#EDB940] border-[#C9A84C]'
                        : 'bg-[#0E1013] text-[#7A7D84] border-[#272B35]'
                    }`}
                  >
                    Select Existing User
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserMode('new')}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border transition-all ${
                      userMode === 'new'
                        ? 'bg-[#C9A84C]/20 text-[#EDB940] border-[#C9A84C]'
                        : 'bg-[#0E1013] text-[#7A7D84] border-[#272B35]'
                    }`}
                  >
                    + Provision New User
                  </button>
                </div>

                {userMode === 'existing' ? (
                  <select
                    required={userMode === 'existing'}
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                  >
                    <option value="">Select User Account ({users.length} available)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) — {u.role || 'employee'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2 p-2.5 rounded-lg bg-[#0E1013] border border-[#272B35]">
                    <div>
                      <label className="block text-[11px] text-[#7A7D84] mb-0.5">Full Name *</label>
                      <input
                        required={userMode === 'new'}
                        type="text"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#15181D] border border-[#272B35] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#7A7D84] mb-0.5">Corporate Email *</label>
                      <input
                        required={userMode === 'new'}
                        type="email"
                        placeholder="e.g. john@vpdtechnologies.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#15181D] border border-[#272B35] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Employee Code *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. EMP-104"
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Office Location</label>
                <input
                  type="text"
                  placeholder="e.g. Headquarters / Remote"
                  value={formData.office_location}
                  onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Annual Salary ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
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
                  {submitting ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
