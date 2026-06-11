import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Trash2, Clock, User as UserIcon, AlertCircle } from 'lucide-react';
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

import { TicketStatusPanel, TicketStatusHistory } from '../components/ticket/TicketStatusPanel';
import TicketAssignPanel from '../components/ticket/TicketAssignPanel';
import TicketCommentSection from '../components/ticket/TicketCommentSection';
import TicketAttachmentPanel from '../components/ticket/TicketAttachmentPanel';

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

  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'Agent';
  const canUpdateStatus = isAdmin || isAgent;
  const agentUsers = users.filter((u) => u.role === 'Agent');

  const canUploadAttachments = isAdmin ||
    (isAgent && selectedTicket?.assignedTo?._id === user?._id) ||
    (user?.role === 'User' && selectedTicket?.createdBy?._id === user?._id);

  const token = localStorage.getItem('token');

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

  const handleAddComment = async (text: string) => {
    if (!id) return;
    await dispatch(addComment({ id, data: { text } }));
  };

  const handleUpdateStatus = async (newStatus: string, statusNote: string) => {
    if (!id) return;
    await dispatch(updateTicketStatus({ id, data: { status: newStatus, note: statusNote } }));
  };

  const handleAssign = async (assignedTo: string) => {
    if (!id) return;
    await dispatch(assignTicket({ id, data: { assignedTo } }));
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

            {/* Attachments Section */}
            <TicketAttachmentPanel
              ticketId={selectedTicket._id}
              attachments={selectedTicket.attachments || []}
              canUploadAttachments={canUploadAttachments}
              token={token}
            />

            {/* Status History */}
            <TicketStatusHistory statusHistory={selectedTicket.statusHistory} />

            {/* Comments Section */}
            <TicketCommentSection
              ticket={selectedTicket}
              commentLoading={commentLoading}
              onAddComment={handleAddComment}
            />
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
              <TicketStatusPanel
                ticket={selectedTicket}
                statusLoading={statusLoading}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {/* Assign Ticket Panel (Admin only) */}
            {isAdmin && (
              <TicketAssignPanel
                ticket={selectedTicket}
                agentUsers={agentUsers}
                assignLoading={assignLoading}
                onAssign={handleAssign}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
