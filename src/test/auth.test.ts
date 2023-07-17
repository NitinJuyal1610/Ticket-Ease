import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { App } from '@/app';
import { CreateUserDto } from '@dtos/users.dto';
import { AuthRoute } from '@routes/auth.route';
import { UserModel } from '@/models/users.model';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as notificationUtils from '@/utils/notification';
import { User } from '@/interfaces/users.interface';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '@config';

beforeAll(async () => {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoose.connection.close();
});
describe('Testing Auth', () => {
  const authRoute = new AuthRoute();
  let request: supertest.SuperTest<supertest.Test>;
  beforeEach(() => {
    const app = new App([authRoute]);
    request = supertest(app.getServer());
    jest.spyOn(notificationUtils, 'sendMail').mockResolvedValue(true);
  });
  describe('[POST] /signup', () => {
    it('response should have the Create userData', async () => {
      //mock sendMail function in authController

      const userData: CreateUserDto = {
        email: 'test@email.com',
        password: 'q1w2e3r4!',
        role: 'user',
      };

      const authRoute = new AuthRoute();

      const res = await request.post(`${authRoute.path}signup`).send(userData);
      expect(res.status).toBe(201);
      expect(notificationUtils.sendMail).toHaveBeenCalled();
      expect(res.body.data.email).toEqual(userData.email);
    });
  });

  describe('[POST] /login', () => {
    it('response should have the Set-Cookie header with the Authorization token', async () => {
      const userData: CreateUserDto = {
        email: 'test@email.com',
        password: 'q1w2e3r4!',
        role: 'user',
      };

      const customReturnValue = {
        _id: '60706478aad6c9ad19a31c84',
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
        role: 'user',
      };

      const authRoute = new AuthRoute();
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(customReturnValue);

      const response = await request.post(`${authRoute.path}login`).send(userData);
      expect(response.headers['set-cookie'][0]).toMatch(/^Authorization=.+/);
    });
  });

  describe('[POST] /logout', () => {
    it('logout Set-Cookie Authorization=; Max-age=0', async () => {
      const userData: User = {
        _id: '60706478aad6c9ad19a31c84',
        email: 'test@email.com',
        role: 'user',
        password: await bcrypt.hash('q1w2e3r4!', 10),
      };

      const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c84' }, SECRET_KEY, { expiresIn: '1d' });

      const authRoute = new AuthRoute();

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(userData);
      const response = await request
        .post(`${authRoute.path}logout`)
        .send(userData)
        .set('Cookie', `Authorization=${token}`)
        .expect('Set-Cookie', /^Authorization=\; Max-age=0/)
        .expect(200);

      expect(response.body.message).toEqual('logout');
    });
  });
});
