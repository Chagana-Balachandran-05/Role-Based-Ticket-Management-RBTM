import { useState, useEffect } from 'react';
import GlassCard from '../GlassCard';
import { Ticket, User } from '../../../types';

interface TicketAssignPanelProps {
  ticket: Ticket;
  agentUsers: User[];
  assignLoading: boolean;
  onAssign: (assignedTo: string) => Promise<void>;
}

export default function TicketAssignPanel({
  ticket,
  agentUsers,
  assignLoading,
  onAssign,
}: TicketAssignPanelProps) {
  const [assignTo, setAssignTo] = useState(ticket.assignedTo?._id || '');

  // Prefill assignTo when ticket assignee loads/changes
  useEffect(() => {
    setAssignTo(ticket.assignedTo?._id || '');
  }, [ticket.assignedTo]);

  const handleSubmit = async () => {
    await onAssign(assignTo);
  };

  return (
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
          onClick={handleSubmit}
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
  );
}
