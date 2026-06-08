interface BadgeProps {
  children: string;
  variant:
    // Priority (exact backend values)
    | 'Low'
    | 'Medium'
    | 'High'
    | 'Urgent'
    // Status (exact backend values)
    | 'Open'
    | 'In Progress'
    | 'Resolved'
    | 'Closed'
    // Role
    | 'Admin'
    | 'Agent'
    | 'User'
    // Legacy fallbacks (kept for compatibility)
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | 'open'
    | 'in-progress'
    | 'resolved'
    | 'closed'
    | string;
}

export default function Badge({ children, variant }: BadgeProps) {
  const variants: Record<string, string> = {
    // Priority — exact backend values
    Low: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    High: 'bg-orange-100 text-orange-700',
    Urgent: 'bg-red-100 text-red-700',

    // Status — exact backend values
    Open: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-purple-100 text-purple-700',
    Resolved: 'bg-emerald-100 text-emerald-700',
    Closed: 'bg-gray-100 text-gray-700',

    // Role
    Admin: 'bg-red-100 text-red-700',
    Agent: 'bg-yellow-100 text-yellow-700',
    User: 'bg-emerald-100 text-emerald-700',

    // Status toggle values
    Active: 'bg-emerald-100 text-emerald-700',
    Inactive: 'bg-red-100 text-red-700',

    // Legacy lowercase aliases
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-emerald-100 text-emerald-700',
    open: 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-purple-100 text-purple-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-gray-100 text-gray-700',
    'in_progress': 'bg-purple-100 text-purple-700',
  };

  const cls = variants[variant] ?? 'bg-gray-100 text-gray-600';

  return (
    <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}
