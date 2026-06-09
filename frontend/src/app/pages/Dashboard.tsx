import { useEffect } from 'react';
import { Ticket, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDashboardStats } from '../../store/slices/dashboardSlice';
import { fetchTickets } from '../../store/slices/ticketsSlice';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#6b7280'];
const STATUS_COLORS: Record<string, string> = {
  'Open': '#3b82f6',
  'In Progress': '#8b5cf6',
  'Resolved': '#10b981',
  'Closed': '#6b7280',
};

const dashboardConfig = {
  Admin: {
    title: 'System Overview',
    subtitle: 'All tickets across the platform',
  },
  Agent: {
    title: 'My Work Queue',
    subtitle: 'Tickets assigned to you',
  },
  User: {
    title: 'My Dashboard',
    subtitle: 'Your submitted tickets',
  },
};

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { stats, loading: statsLoading } = useAppSelector((s) => s.dashboard);
  const { tickets, listLoading: ticketsLoading } = useAppSelector((s) => s.tickets);
  const { user } = useAppSelector((s) => s.auth);

  const config = dashboardConfig[user?.role as keyof typeof dashboardConfig] || dashboardConfig.User;

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchTickets({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }));
  }, [dispatch]);

  const formatTicketTime = (date: string) => {
    const now = new Date();
    const ticketDate = new Date(date);
    const diffMs = now.getTime() - ticketDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const recentTickets = tickets.slice(0, 5);
  const statusChartData = stats
    ? Object.entries({
        'Open': stats.open,
        'In Progress': stats.inProgress,
        'Resolved': stats.resolved,
        'Closed': stats.closed,
      }).map(([name, value]) => ({ name, value }))
    : [];

  const priorityChartData = stats?.byPriority || [];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2">{config.title}</h1>
            <p className="text-gray-600">{config.subtitle}</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Ticket className="w-6 h-6 text-emerald-600" />}
            title="Total Tickets"
            value={stats?.total?.toString() || '0'}
            badge={{ text: 'All Time', variant: 'success' }}
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
            title="Open"
            value={stats?.open?.toString() || '0'}
            badge={{ text: 'Awaiting Action', variant: 'warning' }}
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6 text-emerald-600" />}
            title="In Progress"
            value={stats?.inProgress?.toString() || '0'}
            badge={{ text: 'Being Worked', variant: 'success' }}
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
            title="Resolved"
            value={stats?.resolved?.toString() || '0'}
            badge={{ text: 'Completed', variant: 'success' }}
          />
        </div>

        {/* Admin stats section */}
        {user?.role === 'Admin' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Admin Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<Zap className="w-6 h-6 text-blue-600" />}
                title="Created Today"
                value={(stats as any)?.createdToday?.toString() || '0'}
                badge={{ text: 'Today', variant: 'info' }}
              />
              <StatCard
                icon={<Zap className="w-6 h-6 text-indigo-600" />}
                title="Created This Week"
                value={(stats as any)?.createdThisWeek?.toString() || '0'}
                badge={{ text: 'This Week', variant: 'info' }}
              />
              <StatCard
                icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
                title="Unassigned Open"
                value={(stats as any)?.unassignedOpen?.toString() || '0'}
                badge={{ text: 'Needs Agent', variant: 'warning' }}
              />
              <StatCard
                icon={<AlertTriangle className="w-6 h-6 text-rose-600" />}
                title="Overdue (7+ Days)"
                value={(stats as any)?.overdue?.toString() || '0'}
                badge={{ text: 'Critical', variant: 'danger' }}
              />
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket Distribution by Status */}
          <GlassCard>
            <h3 className="text-xl mb-6">Ticket Distribution by Status</h3>
            {statsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-gray-400">Loading...</div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusChartData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 flex-wrap">
                  {statusChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] }}></div>
                      <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </GlassCard>

          {/* Ticket Distribution by Priority */}
          <GlassCard>
            <h3 className="text-xl mb-6">Ticket Distribution by Priority</h3>
            {statsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-gray-400">Loading...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </GlassCard>
        </div>

        {/* Recent Activity */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl">Recent Activity</h3>
            <Link to="/tickets" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1">
              View All Tickets
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {ticketsLoading ? (
            <div className="text-center py-8 text-gray-400">Loading recent tickets...</div>
          ) : recentTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tickets yet</div>
          ) : (
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket._id}
                  to={`/tickets/${ticket._id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-white/30 hover:bg-white/70 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg text-xs font-semibold">
                    {ticket.createdBy?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1">{ticket.title}</h4>
                    <p className="text-sm text-gray-600">#{ticket.ticketNumber}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">PRIORITY</div>
                      <Badge variant={ticket.priority as any}>{ticket.priority}</Badge>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">STATUS</div>
                      <Badge variant={ticket.status as any}>{ticket.status}</Badge>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">TIME</div>
                      <div className="text-sm">{formatTicketTime(ticket.createdAt)}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </Layout>
  );
}
