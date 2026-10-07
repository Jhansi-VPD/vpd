import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal-shared/PortalLayout.jsx';
import { Card, MetricCard, StatusBadge, Button, LoadingSkeleton, EmptyState, Modal } from '../../components/portal-shared/SharedComponents.jsx';
import { supabaseRest } from '../../api/supabaseClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProjectDeliveryPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('kanban');
  const [loading, setLoading] = useState(true);

  // Live records
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);

  // Modals & Form
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium',
    status: 'todo',
    due_date: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes, mileRes] = await Promise.all([
        supabaseRest('projects', { query: '?select=*&limit=50' }).catch(() => []),
        supabaseRest('tasks', { query: '?select=*,project:projects(name)&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('project_milestones', { query: '?select=*&limit=50' }).catch(() => []),
      ]);

      setProjects(projRes || []);
      setTasks(taskRes || []);
      setMilestones(mileRes || []);
    } catch (err) {
      console.error('Delivery data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await supabaseRest('tasks', {
        method: 'POST',
        body: newTask,
      });
      setModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        project_id: '',
        priority: 'medium',
        status: 'todo',
        due_date: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
      });
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create delivery task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
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
      title: 'Project Manager',
      items: [
        { label: 'Kanban Sprint Board', path: '/delivery', icon: '📋' },
        { label: 'Active Projects', path: '#projects', icon: '📁', badge: projects.length },
        { label: 'All Tasks', path: '#tasks', icon: '✅', badge: tasks.length },
        { label: 'Milestones', path: '#milestones', icon: '🚩', badge: milestones.length },
      ],
    },
  ];

  return (
    <PortalLayout portalName="Project Manager Portal" portalBadge="Project Management & Engineering" navSections={navSections}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Project Manager Workspace</h1>
          <p className="text-xs text-zinc-400 mt-1">Sprint execution, milestone delivery, task assignments, and progress verification.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} icon={<span>🔄</span>}>
            Refresh
          </Button>
          <Button variant="gold" size="sm" onClick={() => setModalOpen(true)} icon={<span>+</span>}>
            Create Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a] mb-6 overflow-x-auto gap-2">
        {['kanban', 'projects', 'tasks', 'milestones'].map((tab) => (
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
          label="Active Projects"
          value={projects.length}
          trend="up"
          change="Delivery pipelines"
          icon={<span>📁</span>}
        />
        <MetricCard
          label="Total Tasks"
          value={tasks.length}
          trend="neutral"
          change="Sprint backlog"
          icon={<span>✅</span>}
        />
        <MetricCard
          label="Completed Tasks"
          value={tasks.filter(t => t.status === 'completed' || t.status === 'done').length}
          trend="up"
          change="Delivered"
          icon={<span>🏆</span>}
        />
        <MetricCard
          label="Milestones"
          value={milestones.length}
          trend="up"
          change="Key checkpoints"
          icon={<span>🚩</span>}
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : (
        <>
          {/* TAB 1: KANBAN BOARD */}
          {activeTab === 'kanban' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-200">Delivery Sprint Board</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['todo', 'in_progress', 'completed'].map((colStatus) => {
                  const colTasks = tasks.filter(t => (t.status || 'todo').toLowerCase().replace(' ', '_') === colStatus);
                  const displayTitle = colStatus === 'in_progress' ? 'In Progress' : colStatus === 'todo' ? 'To Do' : 'Completed';
                  return (
                    <div key={colStatus} className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-3 flex flex-col">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2a2a2a]">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{displayTitle}</span>
                        <span className="text-[10px] bg-[#222] text-[#d4af37] px-2 py-0.5 rounded-full font-bold">{colTasks.length}</span>
                      </div>
                      <div className="space-y-2.5 flex-1">
                        {colTasks.map((task) => (
                          <div key={task.id} className="p-3.5 rounded-lg bg-[#181818] border border-[#2a2a2a] hover:border-[#d4af37]/40 transition-colors">
                            <h4 className="text-xs font-semibold text-white">{task.title}</h4>
                            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{task.description || 'Sprint deliverable item.'}</p>
                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#2a2a2a]/60">
                              <span className="text-[10px] font-semibold text-[#d4af37]">{task.project?.name || 'Project'}</span>
                              <div className="flex gap-1">
                                {colStatus !== 'completed' && (
                                  <button
                                    onClick={() => handleTaskStatusChange(task.id, colStatus === 'todo' ? 'in_progress' : 'completed')}
                                    className="text-[10px] px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37] hover:bg-[#d4af37]/25 font-semibold"
                                  >
                                    Move →
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {colTasks.length === 0 && (
                          <div className="text-center py-8 text-xs text-zinc-600">No tasks in {displayTitle}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === 'projects' && (
            <Card title="Projects Overview" subtitle="Delivery progress and budgets">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Budget</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {projects.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                        <td className="py-3 px-4">
                          <div className="w-24 bg-[#222] rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#d4af37] h-full" style={{ width: `${p.progress || 0}%` }}></div>
                          </div>
                          <span className="text-[10px] text-zinc-400 mt-0.5 block">{p.progress || 0}%</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300">${Number(p.budget || 0).toLocaleString()}</td>
                        <td className="py-3 px-4"><StatusBadge status={p.status || 'active'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 3: TASKS LIST */}
          {activeTab === 'tasks' && (
            <Card
              title="All Tasks"
              subtitle={`Total of ${tasks.length} tasks scheduled`}
              action={
                <Button size="sm" variant="gold" onClick={() => setModalOpen(true)}>
                  + Create Task
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {tasks.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-white">{t.title}</td>
                        <td className="py-3 px-4 text-zinc-300">{t.project?.name || 'General Project'}</td>
                        <td className="py-3 px-4 uppercase text-[10px] font-mono text-zinc-400">{t.priority || 'medium'}</td>
                        <td className="py-3 px-4"><StatusBadge status={t.status || 'todo'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 4: MILESTONES */}
          {activeTab === 'milestones' && (
            <Card title="Milestones & Checkpoints" subtitle="Deliverable goals and deadlines">
              {milestones.length === 0 ? (
                <EmptyState title="No Milestones Defined" message="Milestones scheduled for active projects will be displayed here." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {milestones.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                      <h4 className="font-semibold text-white text-sm">{m.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{m.description || 'Milestone deliverable'}</p>
                      <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-[#2a2a2a]">
                        <span className="text-zinc-500">Target: {m.due_date || 'Ongoing'}</span>
                        <StatusBadge status={m.status || 'in progress'} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* CREATE TASK MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Delivery Task">
        {formError && (
          <div className="mb-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Task Title</label>
            <input
              required
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="e.g. Implement OAuth2 Refresh Logic"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Assign to Project</label>
            <select
              value={newTask.project_id}
              onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="gold" loading={formLoading} className="w-full py-2">
            Create Task
          </Button>
        </form>
      </Modal>
    </PortalLayout>
  );
}

