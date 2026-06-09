import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router';
import { FileText, MessageSquare, Send, CheckCircle2, Clock, User as UserIcon, AlertCircle, Edit } from 'lucide-react';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchTickets,
  fetchTicketById,
  clearSelectedTicket,
  clearError,
  addComment,
  updateTicketStatus,
} from '../../store/slices/ticketsSlice';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase();

export default function AgentWorkspace() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { tickets, listLoading, selectedTicket, detailLoading, commentLoading, statusLoading, error } =
    useAppSelector((s) => s.tickets);
  const { user } = useAppSelector((s) => s.auth);

  const [commentText, setCommentText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const isCommentsTab = location.pathname.endsWith('/comments');

  useEffect(() => {
    dispatch(fetchTickets({ page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }));
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      dispatch(fetchTicketById(id));
    } else {
      dispatch(clearSelectedTicket());
    }
    return () => {
      dispatch(clearSelectedTicket());
      dispatch(clearError());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (selectedTicket) {
      setNewStatus(selectedTicket.status);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (isCommentsTab && selectedTicket) {
      setTimeout(() => {
        document.getElementById('agent-comments')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [isCommentsTab, selectedTicket]);

  const handleTabChange = (tab: 'details' | 'comments') => {
    if (id) {
      navigate(tab === 'comments' ? `/agent/${id}/comments` : `/agent/${id}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;
    const result = await dispatch(addComment({ id, data: { text: commentText.trim() } }));
    if (addComment.fulfilled.match(result)) {
      setCommentText('');
    }
  };

  const handleUpdateStatus = async () => {
    if (!id || !newStatus) return;
    const result = await dispatch(updateTicketStatus({ id, data: { status: newStatus, note: statusNote } }));
    if (updateTicketStatus.fulfilled.match(result)) {
      setStatusNote('');
    }
  };

  return (
    <Layout>
      <div className="flex gap-6 min-h-screen items-start">

        {/* ── LEFT PANEL — Assigned Ticket List ── */}
        <div className="w-80 flex-shrink-0 sticky top-6">
          <GlassCard>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Assigned Tickets</h2>
            {listLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No tickets assigned to you.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    onClick={() => navigate(`/agent/${ticket._id}`)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      id === ticket._id
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                        : 'bg-white/30 border-white/20 hover:bg-white/50'
                    }`}
                  >
                    <p className="text-xs font-semibold text-emerald-700 mb-0.5">{ticket.ticketNumber}</p>
                    <p className="text-sm font-medium text-gray-800 truncate mb-1.5">{ticket.title}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant={ticket.priority as any}>{ticket.priority}</Badge>
                      <Badge variant={ticket.status as any}>{ticket.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── RIGHT PANEL — Ticket Detail / Empty State ── */}
        <div className="flex-1 min-w-0">

          {/* Loading state */}
          {detailLoading && !selectedTicket && (
            <GlassCard>
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </GlassCard>
          )}

          {/* Empty state — no ticket selected */}
          {!id && (
            <GlassCard>
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="w-14 h-14 text-gray-200 mb-4" />
                <p className="text-gray-500 text-lg font-medium">Select a ticket to view details</p>
                <p className="text-gray-400 text-sm mt-1">Click any ticket from the list on the left</p>
              </div>
            </GlassCard>
          )}

          {/* Ticket content — shown when selectedTicket is loaded */}
          {selectedTicket && !detailLoading && (
            <div className="space-y-4">

              {/* Header */}
              <GlassCard>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-3xl font-semibold mb-1">{selectedTicket.title}</h1>
                    <p className="text-gray-500 text-sm">#{selectedTicket.ticketNumber}</p>
                  </div>
                  {selectedTicket.assignedTo?._id === user?._id && (
                    <Link
                      to={`/tickets/${id}/edit`}
                      className="px-5 py-2.5 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center gap-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                  )}
                </div>
              </GlassCard>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleTabChange('details')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    !isCommentsTab
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-white/40 text-gray-600 hover:bg-white/60'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Ticket Details
                </button>
                <button
                  onClick={() => handleTabChange('comments')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    isCommentsTab
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-white/40 text-gray-600 hover:bg-white/60'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Comments
                  {selectedTicket.comments.length > 0 && (
                    <span className="ml-1 bg-white/30 text-xs px-1.5 py-0.5 rounded-full">
                      {selectedTicket.comments.length}
                    </span>
                  )}
                </button>
              </div>

              {/* TAB CONTENT */}
              {!isCommentsTab ? (
                /* ── DETAILS TAB ── */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Left — Description + Status History + Update Status */}
                  <div className="lg:col-span-2 space-y-4">
                    <GlassCard>
                      <h3 className="text-lg font-semibold mb-3">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedTicket.description}</p>
                    </GlassCard>

                    <GlassCard>
                      <h3 className="text-lg font-semibold mb-4">Status History</h3>
                      {selectedTicket.statusHistory.length === 0 ? (
                        <p className="text-gray-500 text-sm">No status history yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {selectedTicket.statusHistory.map((item, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow flex-shrink-0">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                                {index < selectedTicket.statusHistory.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-500 to-transparent mt-1 min-h-[20px]" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant={item.status as any}>{item.status}</Badge>
                                </div>
                                {item.note && <p className="text-sm text-gray-600 mb-0.5">{item.note}</p>}
                                <p className="text-xs text-gray-500">
                                  {item.changedBy?.name || 'System'} • {formatDate(item.changedAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCard>

                    {/* Update Status Panel */}
                    <GlassCard>
                      <h3 className="text-lg font-semibold mb-4">Update Status</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm mb-1.5 text-gray-700">New Status</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm mb-1.5 text-gray-700">Note (optional)</label>
                          <textarea
                            rows={2}
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Add a note about this status change..."
                            className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                          />
                        </div>
                        <button
                          onClick={handleUpdateStatus}
                          disabled={statusLoading || newStatus === selectedTicket.status}
                          className="w-full py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {statusLoading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          )}
                          Update Status
                        </button>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Right — Ticket Metadata */}
                  <div>
                    <GlassCard>
                      <h3 className="text-lg font-semibold mb-4">Ticket Details</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1.5">Status</p>
                          <Badge variant={selectedTicket.status as any}>{selectedTicket.status}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1.5">Priority</p>
                          <Badge variant={selectedTicket.priority as any}>{selectedTicket.priority}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1.5">Category</p>
                          <div className="px-3 py-2 rounded-xl bg-white/50 border border-white/30 text-sm">{selectedTicket.category}</div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1.5">Assignee</p>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/30">
                            {selectedTicket.assignedTo ? (
                              <>
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs flex-shrink-0">
                                  {getInitials(selectedTicket.assignedTo.name)}
                                </div>
                                <span className="text-sm">{selectedTicket.assignedTo.name}</span>
                              </>
                            ) : (
                              <>
                                <UserIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">Unassigned</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1.5">Reporter</p>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/30">
                            <UserIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{selectedTicket.createdBy?.name || '—'}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1.5">Created</p>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/30">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{formatDate(selectedTicket.createdAt)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1.5">Last Updated</p>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/30">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{formatDate(selectedTicket.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </div>
              ) : (
                /* ── COMMENTS TAB ── */
                <GlassCard>
                  <div id="agent-comments" className="space-y-4">
                    <h3 className="text-lg font-semibold">Comments</h3>
                    {selectedTicket.comments.length === 0 ? (
                      <p className="text-gray-500 text-sm">No comments yet. Be the first to comment.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedTicket.comments.map((c) => (
                          <div key={c._id} className="flex gap-3 p-4 rounded-2xl bg-white/50 border border-white/30">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                               {getInitials(c.author?.name || 'U')}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium text-sm">{c.author?.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
                              </div>
                              <p className="text-gray-700 text-sm">{c.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleAddComment} className="mt-4">
                      <div className="flex gap-3">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          rows={2}
                          className="flex-1 px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                        />
                        <button
                          type="submit"
                          disabled={commentLoading || !commentText.trim()}
                          className="px-5 py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center gap-2 self-end disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {commentLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
