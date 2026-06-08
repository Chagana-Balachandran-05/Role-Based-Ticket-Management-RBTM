import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });
import mongoose from 'mongoose';
import UserModel from './src/models/User.model';
import TicketModel from './src/models/Ticket.model';
import CounterModel from './src/models/Counter.model';
import { generateTicketNumber } from './src/utils/generateTicketNumber';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected for seeding...');

  await UserModel.deleteMany({});
  await TicketModel.deleteMany({});
  await CounterModel.deleteMany({});

  const admin = await UserModel.create({ name: 'Admin User', email: 'admin@rbtm.com', password: 'Admin@123', role: 'Admin' });
  const agent = await UserModel.create({ name: 'Support Agent', email: 'agent@rbtm.com', password: 'Agent@123', role: 'Agent' });
  const user = await UserModel.create({ name: 'Regular User', email: 'user@rbtm.com', password: 'User@123', role: 'User' });

  const tickets = [
    { title: 'Login page broken on mobile', description: 'Users cannot log in on iOS Safari', category: 'Bug', priority: 'Urgent', status: 'Open', createdBy: user._id },
    { title: 'Add dark mode support', description: 'Feature request for dark mode across the app', category: 'Feature Request', priority: 'Low', status: 'Open', createdBy: user._id },
    { title: 'Payment gateway timeout', description: 'Stripe webhook timing out on production', category: 'Payment Issue', priority: 'High', status: 'In Progress', createdBy: admin._id, assignedTo: agent._id },
    { title: 'Cannot reset password', description: 'Password reset email not being received', category: 'Account Issue', priority: 'High', status: 'Open', createdBy: user._id },
    { title: 'Database query slow', description: 'Ticket list query takes over 5 seconds', category: 'Technical Issue', priority: 'Medium', status: 'In Progress', createdBy: admin._id, assignedTo: agent._id },
    { title: 'Export tickets to CSV', description: 'Admin needs ability to export ticket data', category: 'Feature Request', priority: 'Medium', status: 'Open', createdBy: admin._id },
    { title: 'Email notifications not sending', description: 'Ticket update emails not delivered', category: 'Bug', priority: 'High', status: 'Resolved', createdBy: user._id, assignedTo: agent._id },
    { title: 'Account billing page error', description: '500 error on billing settings page', category: 'Account Issue', priority: 'Urgent', status: 'Closed', createdBy: user._id },
    { title: 'API rate limiting needed', description: 'Public endpoints need rate limiting', category: 'Technical Issue', priority: 'Medium', status: 'Open', createdBy: admin._id },
    { title: 'Other: onboarding docs update', description: 'Update onboarding documentation', category: 'Other', priority: 'Low', status: 'Open', createdBy: admin._id },
  ];

  for (let i = 0; i < tickets.length; i++) {
    const ticketNumber = await generateTicketNumber();
    const t = await TicketModel.create({
      ...tickets[i],
      ticketNumber,
      statusHistory: [{ status: tickets[i].status, changedBy: admin._id, note: 'Seeded', changedAt: new Date() }],
    });

    // Add comments to some tickets
    if (i === 0) {
      t.comments.push({
        text: 'This is a test comment by user',
        author: user._id,
      } as any);
      await t.save();
    } else if (i === 2) {
      t.comments.push({
        text: 'Investigating this issue now',
        author: agent._id,
      } as any);
      await t.save();
    }
  }

  console.log('✅ Seeded: 3 users, 10 tickets, and reset counter');
  console.log('Admin:  admin@rbtm.com  / Admin@123');
  console.log('Agent:  agent@rbtm.com  / Agent@123');
  console.log('User:   user@rbtm.com   / User@123');
  process.exit(0);
};

seed().catch(console.error);

