import { useState, useEffect } from 'react';
import GlassCard from '../GlassCard';
import Badge from '../Badge';
import { CheckCircle2 } from 'lucide-react';
import { Ticket, StatusHistory } from '../../../types';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

interface TicketStatusPanelProps {
  ticket: Ticket;
  statusLoading: boolean;
  onUpdateStatus: (newStatus: string, statusNote: string) => Promise<void>;
}

export function TicketStatusPanel({ ticket, statusLoading, onUpdateStatus }: TicketStatusPanelProps) {
  const [newStatus, setNewStatus] = useState<Ticket['status']>(ticket.status);
  const [statusNote, setStatusNote] = useState('');

  // Prefill status when ticket loads or changes
  useEffect(() => {
    setNewStatus(ticket.status);
  }, [ticket.status]);

  const handleSubmit = async () => {
    if (!newStatus) return;
    await onUpdateStatus(newStatus, statusNote);
    setStatusNote('');
  };

  return (
    <GlassCard>
      <h3 className="text-xl mb-4">Update Status</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-2 text-gray-700">New Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as Ticket['status'])}
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
          onClick={handleSubmit}
          disabled={statusLoading || (newStatus === ticket.status && !statusNote.trim())}
          className="w-full py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {statusLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          Update Status
        </button>
      </div>
    </GlassCard>
  );
}

interface TicketStatusHistoryProps {
  statusHistory: StatusHistory[];
}

export function TicketStatusHistory({ statusHistory }: TicketStatusHistoryProps) {
  return (
    <GlassCard>
      <h3 className="text-xl mb-6">Status History</h3>
      {statusHistory.length === 0 ? (
        <p className="text-gray-500 text-sm">No status history yet.</p>
      ) : (
        <div className="space-y-6">
          {statusHistory.map((item, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                {index < statusHistory.length - 1 && (
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
  );
}
