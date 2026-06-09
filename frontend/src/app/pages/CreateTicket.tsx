import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Paperclip, X } from 'lucide-react';
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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      if (selectedFiles.length + filesArray.length > 5) {
        setFileError('You can only upload a maximum of 5 files.');
        return;
      }

      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt'];
      for (const file of filesArray) {
        if (file.size > 5 * 1024 * 1024) {
          setFileError(`File "${file.name}" is too large. Maximum size is 5MB.`);
          return;
        }
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          setFileError(`File "${file.name}" has an invalid file type. Only images, PDFs, and TXT files are allowed.`);
          return;
        }
      }

      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateTicketForm) => {
    const idempotencyKey = 'idem-' + Math.random().toString(36).substring(2, 9) + Date.now();

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('priority', data.priority);

    selectedFiles.forEach((file) => {
      formData.append('attachments', file);
    });

    const result = await dispatch(
      createTicket({
        data: formData,
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    );

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

            {/* File Attachments Upload Section */}
            <div className="p-4 rounded-2xl bg-white/20 border border-white/10 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span>Attachments (Max 5 files, 5MB each)</span>
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={createLoading}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt"
              />
              {fileError && <p className="text-red-500 text-sm">{fileError}</p>}

              {/* Selected Files Preview List */}
              {selectedFiles.length > 0 && (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 border border-white/20 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-medium truncate text-gray-700">{file.name}</span>
                        <span className="text-gray-500 flex-shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        disabled={createLoading}
                        className="text-red-500 hover:text-red-700 transition-all p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
