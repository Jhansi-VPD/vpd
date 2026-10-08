"use client";
import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal-shared/PortalLayout';
import { Card, MetricCard, StatusBadge, Button, LoadingSkeleton, EmptyState, Modal } from '../../components/portal-shared/SharedComponents';
import { supabaseRest } from '../../api/supabaseClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function EmployeePortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);

  // Live state
  const [myTasks, setMyTasks] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [myTimesheets, setMyTimesheets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Check-in state
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Leave Form
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leave_type: 'casual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    reason: '',
  });

  // Timesheet Form
  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false);
  const [timesheetLoading, setTimesheetLoading] = useState(false);
  const [newTimesheet, setNewTimesheet] = useState({
    hours: 8,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [taskRes, attRes, leaveRes, timeRes, annRes] = await Promise.all([
        supabaseRest('tasks', { query: '?select=*,project:projects(name)&limit=20' }).catch(() => []),
        supabaseRest('attendance', { query: '?order=date.desc&limit=15' }).catch(() => []),
        supabaseRest('leaves', { query: '?order=created_at.desc&limit=15' }).catch(() => []),
        supabaseRest('timesheets', { query: '?order=created_at.desc&limit=15' }).catch(() => []),
        supabaseRest('announcements', { query: '?order=created_at.desc&limit=10' }).catch(() => []),
      ]);

      setMyTasks(taskRes || []);
      setMyAttendance(attRes || []);
      setMyLeaves(leaveRes || []);
      setMyTimesheets(timeRes || []);
      setAnnouncements(annRes || []);

      const todayLog = (attRes || []).find(a => a.date === today && a.check_in);
      setCheckedInToday(Boolean(todayLog));
    } catch (err) {
      console.error('Failed to load employee records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      if (!checkedInToday) {
        // Check in
        await supabaseRest('attendance', {
          method: 'POST',
          body: {
            date: today,
            check_in: now,
            status: 'present',
          },
        });
        setCheckedInToday(true);
      } else {
        // Check out
        await supabaseRest('attendance', {
          method: 'PATCH',
          query: `?date=eq.${today}`,
          body: {
            check_out: now,
          },
        });
        alert('Successfully checked out for today!');
      }
      await loadData();
    } catch (err) {
      alert(`Attendance action failed: ${err.message}`);
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setLeaveLoading(true);
    try {
      await supabaseRest('leaves', {
        method: 'POST',
        body: {
          ...newLeave,
          status: 'pending',
        },
      });
      setLeaveModalOpen(false);
      setNewLeave({
        leave_type: 'casual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        reason: '',
      });
      await loadData();
    } catch (err) {
      alert(`Leave application failed: ${err.message}`);
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleSubmitTimesheet = async (e) => {
    e.preventDefault();
    setTimesheetLoading(true);
    try {
      await supabaseRest('timesheets', {
        method: 'POST',
        body: {
          hours_spent: newTimesheet.hours,
          date: newTimesheet.date,
          description: newTimesheet.description,
          status: 'submitted',
        },
      });
      setTimesheetModalOpen(false);
      setNewTimesheet({
        hours: 8,
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      await loadData();
    } catch (err) {
      alert(`Timesheet submission failed: ${err.message}`);
    } finally {
      setTimesheetLoading(false);
    }
  };

  const handleTaskStatus = async (taskId, newStatus) => {
    try {
      await supabaseRest('tasks', {
        method: 'PATCH',
        query: `?id=eq.${taskId}`,
        body: { status: newStatus },
      });
      await loadData();
    } catch (err) {
      alert(`Error updating task status: ${err.message}`);
    }
  };

  const navSections = [
    {
      title: 'My Daily Work',
      items: [
        { label: 'Assigned Tasks', path: '/employee', icon: '📝', badge: myTasks.length },
        { label: 'Attendance & Log', path: '#attendance', icon: '⏱️', badge: checkedInToday ? 'Checked in' : 'Pending' },
        { label: 'Leave Requests', path: '#leaves', icon: '🏖️', badge: myLeaves.length },
        { label: 'My Timesheets', path: '#timesheets', icon: '⏳', badge: myTimesheets.length },
        { label: 'Company Announcements', path: '#announcements', icon: '📢', badge: announcements.length },
      ],
    },
  ];

  return (
    <PortalLayout portalName="Employee Portal" portalBadge="Personnel Workspace" navSections={navSections}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Employee Self-Service</h1>
          <p className="text-xs text-zinc-400 mt-1">Welcome back, {user?.name || 'Staff'}. Manage your daily duties, attendance, and leave requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={checkedInToday ? 'secondary' : 'gold'}
            size="sm"
            onClick={handleToggleCheckIn}
            loading={checkInLoading}
            icon={<span>⏱️</span>}
          >
            {checkedInToday ? 'Check Out Today' : 'Check In Today'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLeaveModalOpen(true)} icon={<span>+</span>}>
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a] mb-6 overflow-x-auto gap-2">
        {['tasks', 'attendance', 'leaves', 'timesheets', 'announcements'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Today's Status"
          value={checkedInToday ? 'Present' : 'Not Checked In'}
          trend={checkedInToday ? 'up' : 'down'}
          change={checkedInToday ? 'Shift active' : 'Action needed'}
          icon={<span>⏱️</span>}
        />
        <MetricCard
          label="My Open Tasks"
          value={myTasks.filter(t => t.status !== 'completed').length}
          trend="neutral"
          change="Pending delivery"
          icon={<span>📝</span>}
        />
        <MetricCard
          label="Leave Balance"
          value="18 Days"
          trend="up"
          change="Casual + Earned"
          icon={<span>🏖️</span>}
        />
        <MetricCard
          label="Logged Timesheets"
          value={`${myTimesheets.length} Logs`}
          trend="up"
          change="Submitted"
          icon={<span>⏳</span>}
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : (
        <>
          {/* TAB 1: MY TASKS */}
          {activeTab === 'tasks' && (
            <Card title="My Assigned Tasks" subtitle="Active sprint backlog tasks">
              {myTasks.length === 0 ? (
                <EmptyState title="No Tasks Assigned" message="You do not have any open tasks assigned right now." />
              ) : (
                <div className="space-y-3">
                  {myTasks.map((t) => (
                    <div key={t.id} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#d4af37]/30 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-white">{t.title}</h4>
                          <span className="text-[10px] text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded font-mono">
                            {t.project?.name || 'Project'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{t.description || 'Deliverable task.'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={t.status || 'todo'} />
                        {t.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTaskStatus(t.id, t.status === 'todo' ? 'in_progress' : 'completed')}
                          >
                            {t.status === 'todo' ? 'Start' : 'Mark Done'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <Card
              title="Attendance History"
              subtitle="Personal log of daily work sessions"
              action={
                <Button size="sm" variant="gold" onClick={handleToggleCheckIn} loading={checkInLoading}>
                  {checkedInToday ? 'Check Out' : 'Check In'}
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-in</th>
                      <th className="py-3 px-4">Check-out</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {myAttendance.map((a) => (
                      <tr key={a.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono text-white">{a.date}</td>
                        <td className="py-3 px-4 text-zinc-300">{a.check_in ? new Date(a.check_in).toLocaleTimeString() : '—'}</td>
                        <td className="py-3 px-4 text-zinc-300">{a.check_out ? new Date(a.check_out).toLocaleTimeString() : '—'}</td>
                        <td className="py-3 px-4"><StatusBadge status={a.status || 'present'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 3: LEAVES */}
          {activeTab === 'leaves' && (
            <Card
              title="My Leave Applications"
              subtitle="Submit and track time-off requests"
              action={
                <Button size="sm" variant="gold" onClick={() => setLeaveModalOpen(true)}>
                  + Apply Leave
                </Button>
              }
            >
              {myLeaves.length === 0 ? (
                <EmptyState title="No Leave Applications" message="You have not submitted any leave requests yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Approval Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {myLeaves.map((l) => (
                        <tr key={l.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold capitalize text-white">{l.leave_type}</td>
                          <td className="py-3 px-4 text-zinc-300">{l.start_date} to {l.end_date}</td>
                          <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">{l.reason || 'Personal leave'}</td>
                          <td className="py-3 px-4"><StatusBadge status={l.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 4: TIMESHEETS */}
          {activeTab === 'timesheets' && (
            <Card
              title="My Timesheets"
              subtitle="Daily effort logs and activity reports"
              action={
                <Button size="sm" variant="gold" onClick={() => setTimesheetModalOpen(true)}>
                  + Submit Timesheet
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Hours</th>
                      <th className="py-3 px-4">Activity Description</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {myTimesheets.map((ts) => (
                      <tr key={ts.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono text-white">{ts.date || new Date(ts.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold text-[#d4af37]">{ts.hours_spent || 8} hrs</td>
                        <td className="py-3 px-4 text-zinc-300 max-w-sm truncate">{ts.description || 'Sprint development tasks'}</td>
                        <td className="py-3 px-4"><StatusBadge status={ts.status || 'submitted'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 5: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <Card title="Corporate Announcements" subtitle="Internal notices from management">
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white text-sm">{a.title}</h4>
                      <span className="text-[10px] text-zinc-500">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-2">{a.content || a.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* APPLY LEAVE MODAL */}
      <Modal isOpen={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Leave Type</label>
            <select
              value={newLeave.leave_type}
              onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Start Date</label>
              <input
                required
                type="date"
                value={newLeave.start_date}
                onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">End Date</label>
              <input
                required
                type="date"
                value={newLeave.end_date}
                onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Reason</label>
            <textarea
              required
              rows={3}
              value={newLeave.reason}
              onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="Provide context for manager review..."
            />
          </div>
          <Button type="submit" variant="gold" loading={leaveLoading} className="w-full py-2">
            Submit Leave Request
          </Button>
        </form>
      </Modal>

      {/* SUBMIT TIMESHEET MODAL */}
      <Modal isOpen={timesheetModalOpen} onClose={() => setTimesheetModalOpen(false)} title="Submit Daily Timesheet">
        <form onSubmit={handleSubmitTimesheet} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Date</label>
              <input
                required
                type="date"
                value={newTimesheet.date}
                onChange={(e) => setNewTimesheet({ ...newTimesheet, date: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Hours Logged</label>
              <input
                required
                type="number"
                min="1"
                max="16"
                value={newTimesheet.hours}
                onChange={(e) => setNewTimesheet({ ...newTimesheet, hours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Work Completed</label>
            <textarea
              required
              rows={3}
              value={newTimesheet.description}
              onChange={(e) => setNewTimesheet({ ...newTimesheet, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="Tasks accomplished, bug fixes, feature implementations..."
            />
          </div>
          <Button type="submit" variant="gold" loading={timesheetLoading} className="w-full py-2">
            Log Timesheet
          </Button>
        </form>
      </Modal>
    </PortalLayout>
  );
}

