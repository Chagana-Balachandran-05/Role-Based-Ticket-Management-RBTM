import { useState } from 'react';
import GlassCard from '../GlassCard';
import { Send } from 'lucide-react';
import { Ticket } from '../../../types';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase();

interface TicketCommentSectionProps {
  ticket: Ticket;
  commentLoading: boolean;
  onAddComment: (text: string) => Promise<void>;
}

export default function TicketCommentSection({
  ticket,
  commentLoading,
  onAddComment,
}: TicketCommentSectionProps) {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await onAddComment(commentText.trim());
    setCommentText('');
  };

  return (
    <div id="comments">
      <GlassCard>
        <h3 className="text-xl mb-6">Comments</h3>
        <div className="space-y-4 mb-6">
          {ticket.comments.length === 0 ? (
            <p className="text-gray-500 text-sm">No comments yet. Be the first to comment.</p>
          ) : (
            ticket.comments.map((c) => (
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
        <form onSubmit={handleSubmit}>
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
  );
}
