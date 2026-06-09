import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Trash2, Send, CheckCircle2, Clock, User as UserIcon, AlertCircle } from 'lucide-react';
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
import {
  fetchTicketById,
  updateTicketStatus,
  assignTicket,
  addComment,
  deleteTicket,
  clearError,
  clearSelectedTicket,
} from '../../store/slices/ticketsSlice';
import { fetchUsers } from '../../store/slices/usersSlice';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { 
    selectedTicket, 
    detailLoading, 
    commentLoading, 
    statusLoading, 
    assignLoading, 
    error 
  } = useAppSelector((s) => s.tickets);
  const { user } = useAppSelector((s) => s.auth);
  const { users } = useAppSelector((s) => s.users);

  const [commentText, setCommentText] = useState('');

  // Status update panel state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Assign ticket panel state
  const [assignTo, setAssignTo] = useState('');

  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'Agent';
  const canUpdateStatus = isAdmin || isAgent;
  const agentUsers = users.filter((u) => u.role === 'Agent');

  useEffect(() => {
    if (id) {
      dispatch(fetchTicketById(id));
      if (isAdmin) {
        dispatch(fetchUsers());
      }
    }
    return () => {
      dispatch(clearSelectedTicket());
      dispatch(clearError());
    };
  }, [id, dispatch, isAdmin]);

  // Pre-fill status/assign dropdowns when ticket loads
  useEffect(() => {
    if (selectedTicket) {
      setNewStatus(selectedTicket.status);
      setAssignTo(selectedTicket.assignedTo?._id || '');
    }
  }, [selectedTicket]);

  // Scroll to comments if hash is present
  useEffect(() => {
    if (selectedTicket && window.location.hash === '#comments') {
      setTimeout(() => {
        const element = document.getElementById('comments');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [selectedTicket]);

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

  const handleAssign = async () => {
    if (!id) return;
    await dispatch(assignTicket({ id, data: { assignedTo: assignTo } }));
  };

  const handleDelete = async () => {
    if (!id) return;
    await dispatch(deleteTicket(id));
    navigate('/tickets');
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase();

  if (detailLoading && !selectedTicket) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Loading ticket...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!selectedTicket && !detailLoading) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-red-500 text-lg">Ticket not found.</p>
          <Link to="/tickets" className="mt-4 inline-block text-emerald-600 hover:underline">
            ← Back to Tickets
          </Link>
        </div>
      </Layout>
    );
  }

  if (!selectedTicket) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/tickets"
              className="p-3 rounded-2xl bg-white/70 border border-white/30 backdrop-blur-md hover:bg-white/90 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-4xl mb-1">{selectedTicket.title}</h1>
              <p className="text-gray-600">#{selectedTicket.ticketNumber}</p>
            </div>
          </div>
          {(isAdmin || (isAgent && selectedTicket.assignedTo?._id === user?._id)) && (
            <div className="flex gap-3">
              <Link
                to={`/tickets/${id}/edit`}
                className="px-6 py-3 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Edit
              </Link>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="px-6 py-3 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete ticket #{selectedTicket.ticketNumber}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 justify-end">
                      <AlertDialogCancel className="rounded-xl bg-white/50 border border-white/30">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        {/* Global error */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <GlassCard>
              <h3 className="text-xl mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{selectedTicket.description}</p>
            </GlassCard>

            {/* Status History */}
            <GlassCard>
              <h3 className="text-xl mb-6">Status History</h3>
              {selectedTicket.statusHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No status history yet.</p>
              ) : (
                <div className="space-y-6">
                  {selectedTicket.statusHistory.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        {index < selectedTicket.statusHistory.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-500 to-transparent mt-2 min-h-[24px]" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <Badge variant={item.status as any}>{item.status}</Badge>
                        </div>
                        {item.note && (
                          <p className="text-sm text-gray-600 mb-1">{item.note}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {item.changedBy?.name || 'System'} • {formatDate(item.changedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Comments wrapper for URL hash scroll */}
            <div id="comments">
              <GlassCard>
                <h3 className="text-xl mb-6">Comments</h3>
                <div className="space-y-4 mb-6">
                  {selectedTicket.comments.length === 0 ? (
                    <p className="text-gray-500 text-sm">No comments yet. Be the first to comment.</p>
                  ) : (
                    selectedTicket.comments.map((c) => (
                      <div key={c._id} className="flex gap-4 p-4 rounded-2xl bg-white/50 border border-white/30">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm shadow-lg flex-shrink-0">
                          {getInitials(c.author?.name || 'U')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium">{c.author?.name || 'Unknown'}</span>
                            <span className="text-sm text-gray-500">{formatDate(c.createdAt)}</span>
                          </div>
                          <p className="text-gray-700">{c.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment}>
                  <div className="flex gap-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="flex-1 px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                    <button
                      type="submit"
                      disabled={commentLoading || !commentText.trim()}
                      className="px-6 py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center gap-2 self-end disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commentLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      Send
                    </button>
                  </div>
                </form>
              </GlassCard>
            </div>
          </div>

          {/* Right Column — Metadata + Actions */}
          <div className="space-y-6">
            {/* Ticket Details */}
            <GlassCard>
              <h3 className="text-xl mb-6">Ticket Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Status</div>
                  <Badge variant={selectedTicket.status}>{selectedTicket.status}</Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Priority</div>
                  <Badge variant={selectedTicket.priority}>{selectedTicket.priority}</Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Category</div>
                  <div className="px-3 py-2 rounded-xl bg-white/50 border border-white/30 text-sm">
                    {selectedTicket.category}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Assignee</div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/30">
                    {selectedTicket.assignedTo ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs flex-shrink-0">
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
                  <div className="text-sm text-gray-600 mb-2">Reporter</div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/30">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedTicket.createdBy?.name || '—'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Created</div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/30">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Last Updated</div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/30">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{formatDate(selectedTicket.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Status Update Panel (Admin + Agent) */}
            {canUpdateStatus && (
              <GlassCard>
                <h3 className="text-xl mb-4">Update Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">New Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Note (optional)</label>
                    <textarea
                      rows={2}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add a note about this status change..."
                      className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={statusLoading || newStatus === selectedTicket.status}
                    className="w-full py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {statusLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    Update Status
                  </button>
                </div>
              </GlassCard>
            )}

            {/* Assign Ticket Panel (Admin only) */}
            {isAdmin && (
              <GlassCard>
                <h3 className="text-xl mb-4">Assign Ticket</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Assign to Agent</label>
                    <select
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">— Unassigned —</option>
                      {agentUsers.map((agent) => (
                        <option key={agent._id} value={agent._id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAssign}
                    disabled={assignLoading}
                    className="w-full py-3 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assignLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    Assign
                  </button>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
