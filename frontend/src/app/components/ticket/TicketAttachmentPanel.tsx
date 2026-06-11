import { useState, useEffect } from 'react';
import { Paperclip, Upload, AlertCircle, FileText, Download, Trash2 } from 'lucide-react';
import GlassCard from '../GlassCard';
import { useAppDispatch } from '../../../store/hooks';
import { uploadAttachments, deleteAttachment, fetchTicketById } from '../../../store/slices/ticketsSlice';
import { Attachment } from '../../../types';

interface TicketAttachmentPanelProps {
  ticketId: string;
  attachments: Attachment[];
  canUploadAttachments: boolean;
  token: string | null;
}

export default function TicketAttachmentPanel({
  ticketId,
  attachments,
  canUploadAttachments,
  token,
}: TicketAttachmentPanelProps) {
  const dispatch = useAppDispatch();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Real-time EventSource (SSE) stream hook
  useEffect(() => {
    if (!ticketId || !token) return;

    const url = `${import.meta.env.VITE_API_URL}/v1/tickets/${ticketId}/attachments/stream?token=${token}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE update received:', data);
        dispatch(fetchTicketById(ticketId));
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [ticketId, token, dispatch]);

  const handleUploadMore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!ticketId || !e.target.files) return;

    const filesArray = Array.from(e.target.files);
    if (filesArray.length === 0) return;

    if (filesArray.length > 5) {
      setUploadError('You can only upload a maximum of 5 files.');
      return;
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt'];
    for (const file of filesArray) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File "${file.name}" is too large. Maximum size is 5MB.`);
        return;
      }
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setUploadError(`File "${file.name}" has an invalid file type. Only images, PDFs, and TXT files are allowed.`);
        return;
      }
    }

    setUploading(true);
    const formData = new FormData();
    filesArray.forEach((file) => {
      formData.append('attachments', file);
    });

    const idempotencyKey = 'idem-' + Math.random().toString(36).substring(2, 9) + Date.now();

    const result = await dispatch(
      uploadAttachments({
        id: ticketId,
        formData,
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    );

    setUploading(true); // Wait, why did the original say setUploading(false) and then check rejected? Let's check original.
    // Original code:
    // setUploading(false);
    // if (uploadAttachments.rejected.match(result)) { ... }
    // Let's set it to false here.
    setUploading(false);
    if (uploadAttachments.rejected.match(result)) {
      setUploadError(result.payload as string);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    await dispatch(deleteAttachment({ ticketId, attachmentId }));
  };

  const handleRetryUpload = async (attachment: any) => {
    await handleDeleteAttachment(attachment._id);
    setUploadError('Select the file again to retry upload.');
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 className="text-xl flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-gray-500" />
          <span>Attachments</span>
        </h3>
        {canUploadAttachments && (
          <div>
            <label className="px-4 py-2 text-xs rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer font-medium flex items-center gap-1 transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload More</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleUploadMore}
                disabled={uploading}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt"
              />
            </label>
          </div>
        )}
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Processing uploads in background queue...</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {!attachments || attachments.length === 0 ? (
        <p className="text-gray-500 text-sm">No attachments uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {attachments.map((attachment) => {
            const isImg = attachment.mimeType.startsWith('image/');
            const isPending = attachment.status === 'pending';
            const isFailed = attachment.status === 'failed';

            return (
              <div
                key={attachment._id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 border border-white/20 transition-all hover:bg-white/60 hover:shadow-sm"
              >
                <div className="flex items-center gap-3 truncate min-w-0">
                  {isImg && attachment.url ? (
                    <img
                      src={attachment.url}
                      alt={attachment.originalName}
                      className="w-10 h-10 object-cover rounded-lg border border-white/35 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-white/35 flex items-center justify-center text-gray-500 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 truncate">
                    <p className="text-sm font-medium truncate text-gray-700" title={attachment.originalName}>
                      {attachment.originalName}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {(attachment.size / 1024 / 1024).toFixed(2)} MB •{' '}
                      {isPending ? (
                        <span className="text-amber-500 font-semibold animate-pulse">Uploading...</span>
                      ) : isFailed ? (
                        <span className="text-red-500 font-semibold">Failed</span>
                      ) : (
                        <span className="text-emerald-500 font-semibold">Uploaded</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!isPending && !isFailed && attachment.url && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      download={attachment.originalName}
                      className="p-2 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-emerald-600 transition-all border border-gray-100"
                      title="View / Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {isFailed && (
                    <button
                      onClick={() => handleRetryUpload(attachment)}
                      className="px-2 py-1 text-[10px] rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all font-semibold"
                    >
                      Retry
                    </button>
                  )}
                  {canUploadAttachments && (
                    <button
                      onClick={() => handleDeleteAttachment(attachment._id)}
                      className="p-2 rounded-lg bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all border border-gray-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
