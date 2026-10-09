import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';
import AttendanceTrackerCard from '../../../../shared/components/AttendanceTracker';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Live Attendance & Break Tracker Card */}
      <AttendanceTrackerCard />


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Assigned Tasks" value="5 Open" change="2 Due Today" isPositive={true} />
        <MetricCard title="PTO Balance" value="14 Days" change="Approved" isPositive={true} />
        <MetricCard title="Logged Hours (Week)" value="38.5 hrs" change="Target 40" isPositive={true} />
      </div>
    </div>
  );
};

export default Dashboard;
