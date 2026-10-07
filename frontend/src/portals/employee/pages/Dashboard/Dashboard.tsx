import React, { useEffect, useState } from 'react';
import { attendanceApi } from '../../../../api';
import { MetricCard } from '../../../../shared/components/Charts';
import Button from '../../../../shared/components/Button';

export const Dashboard: React.FC = () => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkTime, setCheckTime] = useState<string | null>(null);

  const toggleAttendance = async () => {
    try {
      if (!checkedIn) {
        await attendanceApi.checkIn();
        setCheckedIn(true);
        setCheckTime(new Date().toLocaleTimeString());
      } else {
        await attendanceApi.checkOut();
        setCheckedIn(false);
      }
    } catch {
      setCheckedIn(!checkedIn);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-r from-zinc-900 to-[#141416] border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Daily Attendance & Clock</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Status: {checkedIn ? `Clocked IN at ${checkTime || '09:00 AM'}` : 'Not clocked in yet today'}
          </p>
        </div>
        <Button
          variant={checkedIn ? 'danger' : 'primary'}
          onClick={toggleAttendance}
          className="px-6 py-2.5 font-bold"
        >
          {checkedIn ? 'Clock Out Now' : 'Check In for Today'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Assigned Tasks" value="5 Open" change="2 Due Today" isPositive={true} />
        <MetricCard title="PTO Balance" value="14 Days" change="Approved" isPositive={true} />
        <MetricCard title="Logged Hours (Week)" value="38.5 hrs" change="Target 40" isPositive={true} />
      </div>
    </div>
  );
};

export default Dashboard;
