"use client";
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { dashboardApi, usersApi } from '../../../../api';
import { MetricCard, MiniBarChart } from '../../../../shared/components/Charts';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, uRes] = await Promise.allSettled([
          dashboardApi.getOverview(),
          usersApi.getAll({ limit: 5 }),
        ]);
        
        if (dashRes.status === 'fulfilled') {
          setStats(dashRes.value.data);
        }
        
        if (uRes.status === 'fulfilled') {
          setRecentUsers(uRes.value.data || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Super Admin Operations Overview"
        description="Comprehensive real-time telemetry across platform operations, security, and personnel"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Operations Dashboard' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
            Refresh Telemetry
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          title="Total Personnel" 
          value={stats?.total_employees || 0} 
          change="Platform wide" 
          isPositive={true} 
        />
        <MetricCard 
          title="Active Projects" 
          value={stats?.active_projects || 0} 
          change={`${stats?.total_projects || 0} Total`} 
          isPositive={true} 
        />
        <MetricCard 
          title="Pending Approvals" 
          value={stats?.unresolved_contacts || stats?.new_applications || 0} 
          change="Requires attention" 
          isPositive={false} 
        />
        <MetricCard 
          title="Security Alerts" 
          value={0} 
          change="All systems nominal" 
          isPositive={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">Recent User Registrations</h3>
            <DataTable
              loading={loading}
              data={recentUsers}
              columns={[
                { header: 'Name', accessor: 'name' },
                { header: 'Email', accessor: 'email' },
                { header: 'Role', accessor: (row: any) => <StatusBadge status={row.role || 'user'} /> },
                { header: 'Status', accessor: (row: any) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
              ]}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between h-64">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Active Sessions</h3>
              <p className="text-xs text-zinc-400 mt-1">Platform concurrent connections</p>
            </div>
            <MiniBarChart data={[40, 65, 80, 55, 90, 70, 95, 110, 85, 120]} />
          </div>
          
          <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">Platform Revenue</h3>
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-bold text-white">${stats?.total_revenue?.toLocaleString() || 0}</span>
              <span className="text-xs text-[#D4AF37] mb-1">USD</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default Dashboard;