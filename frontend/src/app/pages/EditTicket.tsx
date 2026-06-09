import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTicketById, updateTicket, updateTicketStatus, clearError } from '../../store/slices/ticketsSlice';
import { fetchUsers } from '../../store/slices/usersSlice';

interface EditTicketForm {
  title: string;
  description: string;
  category: string;
  priority: string;
  status?: string;
  assignedTo?: string;
  note?: string;
}

export default function EditTicket() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedTicket, detailLoading, updateLoading, error } = useAppSelector((s) => s.tickets);
  const { user } = useAppSelector((s) => s.auth);
  const { users } = useAppSelector((s) => s.users);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditTicketForm>();

  useEffect(() => {
    if (id) {
      dispatch(fetchTicketById(id));
      dispatch(fetchUsers());
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (selectedTicket) {
      reset({
        title: selectedTicket.title,
        description: selectedTicket.description,
        category: selectedTicket.category,
        priority: selectedTicket.priority,
        status: selectedTicket.status,
        assignedTo: selectedTicket.assignedTo?._id || '',
      });
    }
  }, [selectedTicket, reset]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: EditTicketForm) => {
    if (!id || !selectedTicket) return;

    try {
      // If status has changed, dispatch status update via its dedicated endpoint
      if (data.status && data.status !== selectedTicket.status) {
        await dispatch(updateTicketStatus({ id, data: { status: data.status, note: data.note } })).unwrap();
      }

      // Prepare fields for the general update
      const { status, note, ...rest } = data;
      
      // Filter fields based on role permission allowlist
      let updatePayload: Partial<EditTicketForm> = {};
      if (user?.role === 'Admin') {
        updatePayload = rest;
      } else if (user?.role === 'Agent') {
        updatePayload = {
          title: rest.title,
          description: rest.description,
          category: rest.category,
          priority: rest.priority,
        };
      }

      await dispatch(updateTicket({ id, data: updatePayload })).unwrap();
      navigate(`/tickets/${id}`);
    } catch (err) {
      // Error handling is managed by redux and displayed in UI
    }
  };

  const agentUsers = users.filter((u) => u.role === 'Agent');
  const canEditFields = user?.role === 'Admin' || user?.role === 'Agent';
  const canEditStatus = user?.role === 'Admin' || user?.role === 'Agent';
  const canAssign = user?.role === 'Admin';

  if (detailLoading) {
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

  if (!selectedTicket) {
    return (
      <Layout>
        <div className="text-center py-12 text-red-500">Ticket not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <GlassCard>
          <h1 className="text-3xl mb-2">Edit Ticket #{selectedTicket.ticketNumber}</h1>
          <p className="text-gray-600 mb-8">{selectedTicket.title}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {canEditFields && (
              <>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    {...register('title', { required: 'Title is required' })}
                  />
                  {errors.title && <span className="text-red-500 text-sm mt-1">{errors.title.message}</span>}
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">Description</label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    {...register('description', { required: 'Description is required' })}
                  />
                  {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Category</label>
                    <select
                      className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      {...register('category')}
                    >
                      <option value="Bug">Bug</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Payment Issue">Payment Issue</option>
                      <option value="Account Issue">Account Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Priority</label>
                    <select
                      className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      {...register('priority')}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {(canEditStatus || canAssign) && (
              <div className="grid grid-cols-2 gap-6">
                {canEditStatus && (
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Status</label>
                    <select
                      className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      {...register('status')}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                )}
                {canAssign && (
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Assign To</label>
                    <select
                      className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      {...register('assignedTo')}
                    >
                      <option value="">Unassigned</option>
                      {agentUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {canEditStatus && (
              <div>
                <label className="block text-sm mb-2 text-gray-700">Status Note</label>
                <textarea
                  rows={3}
                  placeholder="Optional note about the status change"
                  className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  {...register('note')}
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={updateLoading}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updateLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/tickets/${id}`)}
                className="flex-1 py-3 rounded-2xl bg-white/30 text-gray-700 hover:bg-white/50 transition-all border border-white/30"
              >
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </Layout>
  );
}
