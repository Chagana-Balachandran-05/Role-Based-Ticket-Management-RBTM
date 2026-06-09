import request from 'supertest';
import app from '../src/app';
import UserModel from '../src/models/User.model';

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and force their role to User even if Admin is passed', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Admin',
          email: 'admin@test.com',
          password: 'password123',
          role: 'Admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('User');

      // Check DB
      const userInDb = await UserModel.findOne({ email: 'admin@test.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb!.role).toBe('User');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create user directly in db
      await UserModel.create({
        name: 'Test Login User',
        email: 'login@test.com',
        password: 'password123',
        role: 'User',
      });
    });

    it('should successfully log in with correct credentials and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('login@test.com');
    });

    it('should reject login with incorrect credentials with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
