import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createTicket, clearError } from '../../store/slices/ticketsSlice';

interface CreateTicketForm {
  title: string;
  description: string;
  category: string;
  priority: string;
}

export default function CreateTicket() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { createLoading, error } = useAppSelector((s) => s.tickets);
  const { register, handleSubmit, formState: { errors } } = useForm<CreateTicketForm>({
    defaultValues: { priority: 'Low', category: 'Bug' },
  });

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: CreateTicketForm) => {
    const result = await dispatch(createTicket(data));
    if (createTicket.fulfilled.match(result)) {
      navigate('/tickets');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <GlassCard>
          <h1 className="text-3xl mb-2">Create New Ticket</h1>
          <p className="text-gray-600 mb-8">Fill in the details below to create a new ticket</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm mb-2 text-gray-700">Title *</label>
              <input
                type="text"
                placeholder="Ticket title"
                className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <span className="text-red-500 text-sm mt-1">{errors.title.message}</span>}
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700">Description *</label>
              <textarea
                placeholder="Describe the issue or request"
                rows={5}
                className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                {...register('description', { required: 'Description is required' })}
              />
              {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description.message}</span>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Category *</label>
                <select
                  className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  {...register('category', { required: 'Category is required' })}
                >
                  <option value="Bug">Bug</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Account Issue">Account Issue</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <span className="text-red-500 text-sm mt-1">{errors.category.message}</span>}
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Priority *</label>
                <select
                  className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  {...register('priority', { required: 'Priority is required' })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
                {errors.priority && <span className="text-red-500 text-sm mt-1">{errors.priority.message}</span>}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={createLoading}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Ticket'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/tickets')}
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
