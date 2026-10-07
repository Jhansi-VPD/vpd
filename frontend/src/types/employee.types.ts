export interface Employee {
  id: string;
  user_id?: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  joining_date: string;
  salary?: number;
  status: 'active' | 'on_leave' | 'probation' | 'resigned' | 'terminated';
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  employee_name?: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day';
  work_mode: 'remote' | 'office' | 'hybrid';
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  employee_name?: string;
  leave_type: 'annual' | 'sick' | 'casual' | 'unpaid';
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

