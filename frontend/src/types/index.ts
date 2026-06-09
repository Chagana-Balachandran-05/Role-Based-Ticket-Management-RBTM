export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Agent' | 'User';
  isActive: boolean;
  createdAt: string;
}

export interface Comment {
  _id: string;
  text: string;
  author: User;
  createdAt: string;
}

export interface StatusHistory {
  status: string;
  changedBy: User;
  note: string;
  changedAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Technical Issue' | 'Payment Issue' | 'Account Issue' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo: User | null;
  createdBy: User;
  comments: Comment[];
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTickets {
  tickets: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byPriority: { _id: string; count: number }[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
