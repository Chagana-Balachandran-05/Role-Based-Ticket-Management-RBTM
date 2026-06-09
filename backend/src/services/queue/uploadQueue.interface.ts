export interface IUploadQueue {
  addJob(ticketId: string, attachmentId: string): Promise<void>;
  start(): Promise<void>;
  drain?(): Promise<void>;
}
