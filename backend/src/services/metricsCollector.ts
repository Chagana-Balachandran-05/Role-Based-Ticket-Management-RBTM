import TicketModel from '../models/Ticket.model';

let totalUploads = 0;
let successfulUploads = 0;
let failedUploads = 0;
let totalDuration = 0;

export const recordUploadMetric = (success: boolean, durationMs: number) => {
  totalUploads++;
  if (success) {
    successfulUploads++;
    totalDuration += durationMs;
  } else {
    failedUploads++;
  }
};

export const getAttachmentMetrics = async () => {
  // Query MongoDB to find the count of all attachments that are currently in 'pending' status
  const pendingCountResult = await TicketModel.aggregate([
    { $unwind: '$attachments' },
    { $match: { 'attachments.status': 'pending' } },
    { $count: 'count' },
  ]);

  const backlogSize = pendingCountResult[0]?.count || 0;
  const successRate = totalUploads > 0 ? (successfulUploads / totalUploads) * 100 : 100;
  const averageUploadTimeMs = successfulUploads > 0 ? totalDuration / successfulUploads : 0;

  return {
    totalUploadRequests: totalUploads,
    successfulUploads,
    failedUploads,
    successRate: parseFloat(successRate.toFixed(2)),
    averageUploadTimeMs: parseFloat(averageUploadTimeMs.toFixed(2)),
    queueBacklogSize: backlogSize,
  };
};
