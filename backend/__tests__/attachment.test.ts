import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import app from '../src/app';
import UserModel from '../src/models/User.model';
import TicketModel from '../src/models/Ticket.model';
import AuditLogModel from '../src/models/AuditLog.model';
import IdempotencyModel from '../src/models/Idempotency.model';
import { uploadStream, deleteFromCloudinary } from '../src/config/cloudinary';
import { initializeQueue, getQueue } from '../src/services/queue/queueFactory';

// Mock Cloudinary config and uploader methods
jest.mock('../src/config/cloudinary', () => ({
  uploadStream: jest.fn(),
  deleteFromCloudinary: jest.fn(),
}));

beforeAll(async () => {
  await initializeQueue();
});

const signTestToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
};

describe('File Attachments System (Enterprise Grade)', () => {
  let user: any;
  let agent: any;
  let admin: any;
  let tokenUser: string;
  let tokenAgent: string;
  let tokenAdmin: string;
  let ticket: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup Users
    user = await UserModel.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      role: 'User',
    });
    tokenUser = signTestToken(user._id.toString(), 'User');

    agent = await UserModel.create({
      name: 'Test Agent',
      email: 'agent@test.com',
      password: 'password123',
      role: 'Agent',
    });
    tokenAgent = signTestToken(agent._id.toString(), 'Agent');

    admin = await UserModel.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'Admin',
    });
    tokenAdmin = signTestToken(admin._id.toString(), 'Admin');

    // Create a base Ticket owned by user
    ticket = await TicketModel.create({
      ticketNumber: 'TKT-9999',
      title: 'Upload Test Ticket',
      description: 'Need file uploads tested',
      category: 'Bug',
      priority: 'High',
      status: 'Open',
      createdBy: user._id,
    });
  });

  afterEach(async () => {
    try {
      const queue = getQueue();
      if (queue && queue.drain) {
        await queue.drain();
      }
    } catch (e) {
      // Ignore
    }
  });

  describe('POST /api/v1/tickets - Create with files', () => {
    it('should successfully create ticket and schedule uploads', async () => {
      (uploadStream as jest.Mock).mockResolvedValue({
        secure_url: 'https://cloudinary/image.png',
        public_id: 'cloudinary_public_id',
      });

      const res = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${tokenUser}`)
        .field('title', 'Ticket with file')
        .field('description', 'Test body')
        .field('category', 'Bug')
        .field('priority', 'Low')
        .attach('attachments', Buffer.from('hello text content'), 'hello.txt');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attachments.length).toBe(1);
      
      const attachment = res.body.data.attachments[0];
      expect(attachment.originalName).toBe('hello.txt');
      expect(attachment.status).toBe('pending');
    });

    it('should successfully process background upload and update status to uploaded', async () => {
      (uploadStream as jest.Mock).mockResolvedValue({
        secure_url: 'https://cloudinary/image.png',
        public_id: 'cloudinary_public_id',
      });

      const res = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${tokenUser}`)
        .field('title', 'Ticket for processing check')
        .field('description', 'Test body')
        .field('category', 'Bug')
        .field('priority', 'Low')
        .attach('attachments', Buffer.from('hello text content'), 'hello-process.txt');

      expect(res.status).toBe(201);
      const ticketId = res.body.data._id;
      const attachmentId = res.body.data.attachments[0]._id;

      // Wait for background worker processing to finish
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Fetch ticket from database and verify status has updated
      const updatedTicket = await TicketModel.findById(ticketId);
      expect(updatedTicket).toBeTruthy();
      const attachment = updatedTicket!.attachments.find((a) => a._id.toString() === attachmentId);
      expect(attachment).toBeTruthy();
      expect(attachment!.status).toBe('uploaded');
      expect(attachment!.url).toBe('https://cloudinary/image.png');
      expect(attachment!.publicId).toBe('cloudinary_public_id');
      expect(attachment!.tempPath).toBe('');
    });

    it('should reject invalid file extensions/types early', async () => {
      const res = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${tokenUser}`)
        .field('title', 'Invalid file test')
        .field('description', 'Test body')
        .field('category', 'Bug')
        .field('priority', 'Low')
        .attach('attachments', Buffer.from('console.log("unsafe")'), 'script.js');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only images, PDFs, and text files are allowed');
    });
  });

  describe('Idempotency Checks', () => {
    it('should return identical cached response on duplicate request keys', async () => {
      const idempotencyKey = 'key-12345';

      // First request
      const res1 = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${tokenUser}`)
        .set('Idempotency-Key', idempotencyKey)
        .field('title', 'Unique Ticket')
        .field('description', 'First execution')
        .field('category', 'Bug')
        .field('priority', 'Low');

      expect(res1.status).toBe(201);

      // Second request with same key
      const res2 = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${tokenUser}`)
        .set('Idempotency-Key', idempotencyKey)
        .field('title', 'Unique Ticket')
        .field('description', 'Second execution')
        .field('category', 'Bug')
        .field('priority', 'Low');

      expect(res2.status).toBe(200); // Idempotency returns 200 Cached
      expect(res2.body.data._id).toBe(res1.body.data._id);
      expect(res2.body.data.title).toBe('Unique Ticket');
    });
  });

  describe('Authorization Rules', () => {
    it('should deny upload to user if ticket belongs to another user', async () => {
      const anotherUser = await UserModel.create({
        name: 'Another User',
        email: 'another@test.com',
        password: 'password123',
        role: 'User',
      });
      const tokenAnother = signTestToken(anotherUser._id.toString(), 'User');

      const res = await request(app)
        .post(`/api/v1/tickets/${ticket._id}/attachments`)
        .set('Authorization', `Bearer ${tokenAnother}`)
        .attach('attachments', Buffer.from('test text'), 'test.txt');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('should allow upload to agent if assigned to the ticket', async () => {
      ticket.assignedTo = agent._id;
      await ticket.save();

      const res = await request(app)
        .post(`/api/v1/tickets/${ticket._id}/attachments`)
        .set('Authorization', `Bearer ${tokenAgent}`)
        .attach('attachments', Buffer.from('test text'), 'agent.txt');

      expect(res.status).toBe(200);
      expect(res.body.data.attachments[0].originalName).toBe('agent.txt');
    });

    it('should deny upload to agent if not assigned to the ticket', async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticket._id}/attachments`)
        .set('Authorization', `Bearer ${tokenAgent}`)
        .attach('attachments', Buffer.from('test text'), 'agent.txt');

      expect(res.status).toBe(403);
    });

    it('should always allow admin to upload and delete attachments', async () => {
      const resUpload = await request(app)
        .post(`/api/v1/tickets/${ticket._id}/attachments`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .attach('attachments', Buffer.from('admin content'), 'admin.txt');

      expect(resUpload.status).toBe(200);
      expect(resUpload.body.data.attachments.length).toBe(1);

      const attachmentId = resUpload.body.data.attachments[0]._id;
      
      const resDelete = await request(app)
        .delete(`/api/v1/tickets/${ticket._id}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resDelete.status).toBe(200);
      expect(resDelete.body.data.attachments.length).toBe(0);
    });
  });
});
