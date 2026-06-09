import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Use a custom port/instance of mongodb-memory-server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Set JWT_SECRET in environment for tests
  process.env.JWT_SECRET = 'testsecretkey123';
  process.env.JWT_EXPIRES_IN = '1d';

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
