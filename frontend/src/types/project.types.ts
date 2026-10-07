export interface Project {
  id: string;
  name: string;
  client_id?: string;
  client_name?: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  health: 'on_track' | 'at_risk' | 'delayed';
  progress: number;
  start_date: string;
  end_date: string;
  budget?: number;
  spent?: number;
  manager_id?: string;
  manager_name?: string;
  description?: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  amount?: number;
  deliverables?: string[];
}

