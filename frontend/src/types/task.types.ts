export interface Task {
  id: string;
  project_id?: string;
  project_name?: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  assignee_name?: string;
  due_date: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
}

export interface TimesheetEntry {
  id: string;
  user_id: string;
  project_id: string;
  project_name?: string;
  task_id?: string;
  date: string;
  hours: number;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

