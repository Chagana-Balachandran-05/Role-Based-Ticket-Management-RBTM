import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import TicketModel from '../src/models/Ticket.model';
import connectDB from '../src/config/db';

const checkPending = async () => {
  await connectDB();
  
  const tickets = await TicketModel.find({ 'attachments.0': { $exists: true } });
  console.log(`Found ${tickets.length} tickets with attachments.`);
  
  for (const ticket of tickets) {
    console.log(`Ticket: ${ticket.ticketNumber} - ${ticket.title}`);
    for (const att of ticket.attachments) {
      console.log(`  Attachment: ${att.originalName}
    ID: ${att._id}
    Status: ${att.status}
    URL: "${att.url}"
    publicId: "${att.publicId}"
    tempPath: "${att.tempPath}"
    uploadedBy: ${att.uploadedBy}
    fileHash: ${att.fileHash}`);
    }
  }
  
  await mongoose.disconnect();
};

checkPending().catch(console.error);
