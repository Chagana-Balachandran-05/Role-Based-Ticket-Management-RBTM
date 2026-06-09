import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Edit, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTickets, deleteTicket } from '../../store/slices/ticketsSlice';

export default function TicketList() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { tickets, listLoading, error, totalPages, page } = useAppSelector((s) => s.tickets);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'In Progress' | 'Resolved' | 'Closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Low' | 'Medium' | 'High' | 'Urgent'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch tickets on mount and when filters/sorting changes
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
      sortBy,
      sortOrder,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      ...(categoryFilter !== 'all' && { category: categoryFilter }),
    };
    dispatch(fetchTickets(params));
  }, [dispatch, currentPage, debouncedSearch, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]);

  const handleDeleteTicket = async (ticketId: string) => {
    const result = await dispatch(deleteTicket(ticketId));
    if (deleteTicket.fulfilled.match(result)) {
      const params = {
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
      };
      dispatch(fetchTickets(params));
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // default to descending for fresh sort field
    }
    setCurrentPage(1);
  };

  const canDelete = user?.role === 'Admin';
  const canEdit = user?.role === 'Admin' || user?.role === 'Agent';

  if (listLoading && tickets.length === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl mb-2">Ticket Management</h1>
            <p className="text-gray-600">View and manage all support tickets</p>
          </div>
          <GlassCard>
            <div className="text-center py-8">
              <p className="text-gray-600">Loading tickets...</p>
            </div>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl mb-2">Ticket Management</h1>
          <p className="text-gray-600">View and manage all support tickets</p>
        </div>

        {/* Filters and Search */}
        <GlassCard>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Priority</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Category</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Account Issue">Account Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Error State */}
        {error && (
          <GlassCard className="border-red-300 bg-red-50/40">
            <p className="text-red-700">{error}</p>
          </GlassCard>
        )}

        {/* Empty State */}
        {tickets.length === 0 && !listLoading ? (
          <GlassCard>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No tickets found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
            </div>
          </GlassCard>
        ) : (
          <>
            {/* Tickets Table */}
            <GlassCard padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/30">
                      <th
                        onClick={() => handleSort('ticketNumber')}
                        className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-white/20 select-none transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Ticket #</span>
                          {sortBy === 'ticketNumber' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-emerald-600" /> : <ArrowDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('title')}
                        className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-white/20 select-none transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Title</span>
                          {sortBy === 'title' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-emerald-600" /> : <ArrowDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide select-none">
                        Assignee
                      </th>
                      <th
                        onClick={() => handleSort('priority')}
                        className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-white/20 select-none transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Priority</span>
                          {sortBy === 'priority' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-emerald-600" /> : <ArrowDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('status')}
                        className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-white/20 select-none transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Status</span>
                          {sortBy === 'status' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-emerald-600" /> : <ArrowDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('createdAt')}
                        className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-white/20 select-none transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Created</span>
                          {sortBy === 'createdAt' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-emerald-600" /> : <ArrowDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide select-none">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket, index) => (
                      <tr
                        key={ticket._id}
                        className={`border-b border-white/20 hover:bg-white/30 transition-all ${index % 2 === 0 ? 'bg-white/10' : ''
                          }`}
                      >
                        <td className="p-6 font-semibold text-emerald-700">{ticket.ticketNumber}</td>
                        <td className="p-6 text-gray-900">{ticket.title}</td>
                        <td className="p-6 text-gray-700">
                          {ticket.assignedTo ? ticket.assignedTo.name : '—'}
                        </td>
                        <td className="p-6">
                          <Badge variant={ticket.priority as any}>
                            {ticket.priority}
                          </Badge>
                        </td>
                        <td className="p-6">
                          <Badge variant={ticket.status as any}>
                            {ticket.status}
                          </Badge>
                        </td>
                        <td className="p-6 text-gray-600">
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-6">
                          <div className="flex gap-2">
                            <Link
                              to={`/tickets/${ticket._id}`}
                              className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {canEdit && (
                              <Link
                                to={`/tickets/${ticket._id}/edit`}
                                className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete ticket {ticket.ticketNumber}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="flex gap-3 justify-end">
                                    <AlertDialogCancel className="rounded-xl bg-white/50 border border-white/30">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTicket(ticket._id)}
                                      className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl bg-white/50 border border-white/30 backdrop-blur-sm hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-xl bg-white/50 border border-white/30 backdrop-blur-sm hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
