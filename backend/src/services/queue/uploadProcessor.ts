import fs from 'fs';
import mongoose from 'mongoose';
import TicketModel from '../../models/Ticket.model';
import AuditLogModel from '../../models/AuditLog.model';
import { uploadStream, deleteFromCloudinary } from '../../config/cloudinary';
import { emitAttachmentUpdate } from '../sse';
import { recordUploadMetric } from '../metricsCollector';
import { logger } from '../../utils/winston';

export const processSingleAttachment = async (ticketId: string, attachmentId: string): Promise<void> => {
  const startTime = Date.now();
  
  // Find ticket first to extract metadata for verification
  const ticket = await TicketModel.findById(ticketId);
  if (!ticket) {
    throw new Error(`Ticket ${ticketId} not found`);
  }

  const attachment = ticket.attachments.find((a) => a._id.toString() === attachmentId);
  if (!attachment) {
    throw new Error(`Attachment ${attachmentId} not found on ticket ${ticketId}`);
  }

  const tempPath = attachment.tempPath;

  if (!tempPath || !fs.existsSync(tempPath)) {
    logger.warn(`Temp file missing on disk for attachment ${attachmentId}: ${tempPath}`);
    
    await TicketModel.findOneAndUpdate(
      { _id: ticketId, 'attachments._id': attachmentId },
      {
        $set: {
          'attachments.$.status': 'failed',
          'attachments.$.tempPath': '',
        },
      }
    );

    await AuditLogModel.create({
      action: 'ATTACHMENT_FAILED',
      ticketId: new mongoose.Types.ObjectId(ticketId),
      userId: attachment.uploadedBy,
      details: { fileName: attachment.originalName, error: 'Temp file missing on disk' },
    });

    emitAttachmentUpdate(ticketId, {
      attachmentId,
      status: 'failed',
      fileName: attachment.originalName,
      error: 'Temp file missing on disk',
    });

    recordUploadMetric(false, 0);
    return;
  }

  try {
    // --- DEDUPLICATION CHECK ---
    const duplicateAttachmentTicket = await TicketModel.findOne({
      'attachments.status': 'uploaded',
      'attachments.fileHash': attachment.fileHash,
    });

    if (duplicateAttachmentTicket) {
      const dup = duplicateAttachmentTicket.attachments.find(
        (a) => a.status === 'uploaded' && a.fileHash === attachment.fileHash
      );
      if (dup) {
        logger.info(`Deduplication match: reusing URL and Public ID for attachment ${attachmentId}`);
        
        await TicketModel.findOneAndUpdate(
          { _id: ticketId, 'attachments._id': attachmentId },
          {
            $set: {
              'attachments.$.status': 'uploaded',
              'attachments.$.url': dup.url,
              'attachments.$.publicId': dup.publicId,
              'attachments.$.tempPath': '',
            },
          }
        );

        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }

        await AuditLogModel.create({
          action: 'ATTACHMENT_UPLOADED',
          ticketId: new mongoose.Types.ObjectId(ticketId),
          userId: attachment.uploadedBy,
          details: { fileName: attachment.originalName, size: attachment.size, deduplicated: true },
        });

        emitAttachmentUpdate(ticketId, {
          attachmentId,
          status: 'uploaded',
          url: dup.url,
          fileName: attachment.originalName,
        });

        recordUploadMetric(true, Date.now() - startTime);
        return;
      }
    }

    // --- CLOUDINARY UPLOAD ---
    const fileBuffer = fs.readFileSync(tempPath);
    const cloudinaryResult = await uploadStream(fileBuffer, 'tickets');

    // Atomic update to prevent VersionError
    await TicketModel.findOneAndUpdate(
      { _id: ticketId, 'attachments._id': attachmentId },
      {
        $set: {
          'attachments.$.status': 'uploaded',
          'attachments.$.url': cloudinaryResult.secure_url,
          'attachments.$.publicId': cloudinaryResult.public_id,
          'attachments.$.tempPath': '',
        },
      }
    );

    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    await AuditLogModel.create({
      action: 'ATTACHMENT_UPLOADED',
      ticketId: new mongoose.Types.ObjectId(ticketId),
      userId: attachment.uploadedBy,
      details: {
        fileName: attachment.originalName,
        size: attachment.size,
        publicId: cloudinaryResult.public_id,
        deduplicated: false,
      },
    });

    emitAttachmentUpdate(ticketId, {
      attachmentId,
      status: 'uploaded',
      url: cloudinaryResult.secure_url,
      fileName: attachment.originalName,
    });

    recordUploadMetric(true, Date.now() - startTime);
  } catch (err: any) {
    logger.error(`Failed to process upload for attachment ${attachmentId}:`, err);

    // Rollback Cloudinary if it succeeded but DB update failed
    // We check if the database shows that the public_id got populated (extremely rare in atomic fail, but keep check)
    const reloadTicket = await TicketModel.findById(ticketId);
    if (reloadTicket) {
      const relAttachment = reloadTicket.attachments.find((a) => a._id.toString() === attachmentId);
      if (relAttachment && relAttachment.publicId) {
        try {
          await deleteFromCloudinary(relAttachment.publicId);
        } catch (rollbackErr) {
          logger.error(`Failed to rollback Cloudinary upload ${relAttachment.publicId}:`, rollbackErr);
        }
      }
    }

    // Mark as failed atomically
    await TicketModel.findOneAndUpdate(
      { _id: ticketId, 'attachments._id': attachmentId },
      {
        $set: {
          'attachments.$.status': 'failed',
          'attachments.$.tempPath': '',
        },
      }
    );

    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (unlinkErr) {
        logger.error(`Failed to delete temp file ${tempPath}:`, unlinkErr);
      }
    }

    await AuditLogModel.create({
      action: 'ATTACHMENT_FAILED',
      ticketId: new mongoose.Types.ObjectId(ticketId),
      userId: attachment.uploadedBy,
      details: { fileName: attachment.originalName, error: err.message || 'Unknown upload error' },
    });

    emitAttachmentUpdate(ticketId, {
      attachmentId,
      status: 'failed',
      fileName: attachment.originalName,
      error: err.message || 'Upload process failed',
    });

    recordUploadMetric(false, 0);
  }
};
