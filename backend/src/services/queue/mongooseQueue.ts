import TicketModel from '../../models/Ticket.model';
import { IUploadQueue } from './uploadQueue.interface';
import { processSingleAttachment } from './uploadProcessor';
import { logger } from '../../utils/winston';

export class MongooseQueue implements IUploadQueue {
  private activeUploads = 0;
  private maxConcurrency = 3;
  private processingIds = new Set<string>();
  private intervalId?: NodeJS.Timeout;

  public async addJob(ticketId: string, attachmentId: string): Promise<void> {
    logger.info(`Queued upload job (MongooseQueue) for attachment: ${attachmentId}`);
    // Trigger processing immediately in background
    this.processJobs();
  }

  public async start(): Promise<void> {
    logger.info('MongooseQueue started, checking for pending recovery uploads...');
    this.processJobs();

    // Periodic poll in background in case database updates are missed (fallback safety)
    if (process.env.NODE_ENV !== 'test') {
      this.intervalId = setInterval(() => {
        this.processJobs();
      }, 30000);
    }
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  public async processJobs(): Promise<void> {
    if (this.activeUploads >= this.maxConcurrency) {
      return;
    }

    try {
      // Find all tickets with pending attachments
      const tickets = await TicketModel.find({
        'attachments.status': 'pending',
      });

      for (const ticket of tickets) {
        for (const attachment of ticket.attachments) {
          if (attachment.status === 'pending' && !this.processingIds.has(attachment._id.toString())) {
            if (this.activeUploads >= this.maxConcurrency) return;

            const attachmentId = attachment._id.toString();
            this.processingIds.add(attachmentId);
            this.activeUploads++;

            logger.info(`Starting process for attachment ${attachmentId} (MongooseQueue)`);

            processSingleAttachment(ticket._id.toString(), attachmentId)
              .catch((err) => {
                logger.error(`Error processing attachment ${attachmentId}:`, err);
              })
              .finally(() => {
                this.processingIds.delete(attachmentId);
                this.activeUploads--;
                // Try processing next jobs
                this.processJobs();
              });
          }
        }
      }
    } catch (err) {
      logger.error('Failed to query pending jobs in MongooseQueue:', err);
    }
  }
}
export default MongooseQueue;
