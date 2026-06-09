import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import UserModel from '../src/models/User.model';
import TicketModel from '../src/models/Ticket.model';
import { generateTicketNumber } from '../src/utils/generateTicketNumber';

const signTestToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
};

describe('Ticket Service & Endpoints', () => {
  describe('Ticket Number Generation', () => {
    it('should generate ticket numbers in sequence starting with TKT-0001', async () => {
      const num1 = await generateTicketNumber();
      const num2 = await generateTicketNumber();
      const num3 = await generateTicketNumber();

      expect(num1).toBe('TKT-0001');
      expect(num2).toBe('TKT-0002');
      expect(num3).toBe('TKT-0003');
    });
  });

  describe('GET /api/tickets - User Role Isolation', () => {
    let userA: any;
    let userB: any;
    let tokenA: string;
    let tokenB: string;

    beforeEach(async () => {
      // Create user A and B
      userA = await UserModel.create({
        name: 'User A',
        email: 'userA@test.com',
        password: 'password123',
        role: 'User',
      });
      tokenA = signTestToken(userA._id.toString(), 'User');

      userB = await UserModel.create({
        name: 'User B',
        email: 'userB@test.com',
        password: 'password123',
        role: 'User',
      });
      tokenB = signTestToken(userB._id.toString(), 'User');

      // Create a ticket for User A
      await TicketModel.create({
        ticketNumber: 'TKT-0010',
        title: "Ticket for User A",
        description: "Need help A",
        category: "Bug",
        priority: "Low",
        status: "Open",
        createdBy: userA._id,
      });

      // Create a ticket for User B
      await TicketModel.create({
        ticketNumber: 'TKT-0011',
        title: "Ticket for User B",
        description: "Need help B",
        category: "Bug",
        priority: "Low",
        status: "Open",
        createdBy: userB._id,
      });
    });

    it('should only return User A\'s own tickets when requested by User A', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tickets.length).toBe(1);
      expect(res.body.data.tickets[0].title).toBe("Ticket for User A");
    });

    it('should only return User B\'s own tickets when requested by User B', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tickets.length).toBe(1);
      expect(res.body.data.tickets[0].title).toBe("Ticket for User B");
    });
  });
});
