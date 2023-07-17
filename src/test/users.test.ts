import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { App } from '@/app';
import supertest from 'supertest';
import { UserRoute } from '@routes/users.route';
import { UserModel } from '@/models/users.model';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CreateUserDto } from '@/dtos/users.dto';

beforeAll(async () => {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoose.connection.close();
});

describe('Testing Users', () => {
  const usersRoute = new UserRoute();
  let request: supertest.SuperTest<supertest.Test>;
  beforeEach(() => {
    const usersRoute = new UserRoute();
    const app = new App([usersRoute]);
    request = supertest(app.getServer());
  });
  describe('[GET] /users', () => {
    test('response findAll Users with role user', async () => {
      // Setup

      const customReturnValue: CreateUserDto[] = [
        {
          email: 'a@email.com',
          password: 'hashedPassword1',
          role: 'support',
        },
        {
          email: 'b@email.com',
          password: 'hashedPassword2',
          role: 'user',
        },
        {
          email: 'd@email.com',
          password: 'hashedPassword4',
          role: 'user',
        },
        {
          email: 'c@email.com',
          password: 'hashedPassword3',
          role: 'admin',
        },
      ];

      // Insert the custom data into the in-memory MongoDB database
      await UserModel.insertMany(customReturnValue);
      // Act
      const response = await request.get(`${usersRoute.path}`);
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('[GET] /users/:id', () => {
    it('response findOne User', async () => {
      const userId = 'qpwoeiruty';
      const usersRoute = new UserRoute();
      jest.spyOn(UserModel, 'findOne').mockResolvedValue({
        _id: 'qpwoeiruty',
        email: 'a@email.com',
        password: await bcrypt.hash('q1w2e3r4!', 10),
        role: 'support',
      });

      const res = await request.get(`${usersRoute.path}/${userId}`);
      expect(res.status).toBe(200);
    });
  });

  describe('[POST] /users', () => {
    it('response Create User', async () => {
      const userData: CreateUserDto = {
        email: 'test@email.com',
        password: 'q1w2e3r4789',
        role: 'user',
      };

      const usersRoute = new UserRoute();
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);
      const res = await request.post(`${usersRoute.path}`).send(userData);
      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe(userData.email);
    });
  });

  describe('[PUT] /users/:id', () => {
    it('response Update User', async () => {
      //setup
      const usersRoute = new UserRoute();

      const userData = await UserModel.create({
        email: 'test2.gmail.com',
        password: 'aiohngfdnlasn254',
        role: 'user',
      });

      const updateUserData = {
        email: 'testupdated@email.com',
      };

      const res = await request.put(`${usersRoute.path}/${userData._id}`).send(updateUserData);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toEqual(updateUserData.email);
    });
  });

  describe('[DELETE] /users/:id', () => {
    it('response Delete User', async () => {
      const userData = await UserModel.create({
        email: 'test2.gmail.com',
        password: 'aiohngfdnlasn254',
        role: 'user',
      });

      const usersRoute = new UserRoute();

      const res = await request.delete(`${usersRoute.path}/${userData._id}`);

      expect(res.body.message).toEqual('deleted');
      expect(res.status).toBe(200);
    });
  });
});
