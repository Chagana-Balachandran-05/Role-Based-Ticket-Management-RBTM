import { Queue, Worker, Job } from 'bullmq';
import { IUploadQueue } from './uploadQueue.interface';
import { processSingleAttachment } from './uploadProcessor';
import { logger } from '../../utils/winston';

export class BullQueue implements IUploadQueue {
  private queue?: Queue;
  private worker?: Worker;
  private redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };

  public async addJob(ticketId: string, attachmentId: string): Promise<void> {
    if (!this.queue) {
      this.queue = new Queue('file-uploads', {
        connection: this.redisConnection,
      });
    }

    logger.info(`Queued upload job (BullQueue) for attachment: ${attachmentId}`);
    await this.queue.add('upload', { ticketId, attachmentId });
  }

  public async start(): Promise<void> {
    logger.info('BullQueue started. Initializing BullMQ Worker...');

    this.worker = new Worker(
      'file-uploads',
      async (job: Job) => {
        const { ticketId, attachmentId } = job.data;
        logger.info(`Worker processing job ${job.id} for attachment ${attachmentId} of ticket ${ticketId}`);
        await processSingleAttachment(ticketId, attachmentId);
      },
      {
        connection: this.redisConnection,
        concurrency: 3,
      }
    );

    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed with error:`, err);
    });
  }
}
export default BullQueue;
