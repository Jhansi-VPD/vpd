export interface Client {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone?: string;
  industry?: string;
  status: 'lead' | 'active' | 'inactive';
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name?: string;
  project_id?: string;
  amount: number;
  tax?: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  issued_date: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  client_id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

