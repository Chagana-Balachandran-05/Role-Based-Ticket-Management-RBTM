export interface CreateTicketDTO {
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Technical Issue' | 'Payment Issue' | 'Account Issue' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  category?: 'Bug' | 'Feature Request' | 'Technical Issue' | 'Payment Issue' | 'Account Issue' | 'Other';
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo?: string;
}

export interface RegisterUserDTO {
  name: string;
  email: string;
  password: string;
  role?: 'Admin' | 'Agent' | 'User';
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  role?: 'Admin' | 'Agent' | 'User';
}

export interface UpdateProfileDTO {
  name?: string;
  email?: string;
}

export interface GetAllUsersQueryDTO {
  page?: number | string;
  limit?: number | string;
  search?: string;
  role?: string;
}

export interface GetTicketsQueryDTO {
  page?: number | string;
  limit?: number | string;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
