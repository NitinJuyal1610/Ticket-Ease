import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { App } from '@/app';
import { CreateUserDto } from '@dtos/users.dto';
import { TicketRoute } from '@/routes/tickets.route';
import { TicketModel } from '@/models/tickets.model';
import { UserModel } from '@/models/users.model';
import { Ticket } from '@/interfaces/tickets.interface';
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
  const ticketRoute = new TicketRoute();
  let request: supertest.SuperTest<supertest.Test>;
  beforeEach(() => {
    const app = new App([ticketRoute]);
    request = supertest(app.getServer());
    jest.spyOn(notificationUtils, 'sendMail').mockResolvedValue(true);
  });
  describe('[GET]/tickets', () => {
    const ticketData = [
      {
        //ticket data
        _id: 'qpwoeiruty',
        title: 'hello',
        description: 'world',
        status: 'open',
        priority: 'high',
        createdBy: '123',
        category: 'Performance Problem',
        assignedAgent: '123',
        comments: [],
        history: ['ajpfaj'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    jest.spyOn(TicketModel, 'find').mockResolvedValue(ticketData);
    describe('when the user is not authenticated', () => {
      it('should throw 404 error if token is missing', async () => {
        //execute
        const response = await request.get(`${ticketRoute.path}`);
        //assert
        expect(response.status).toBe(404);
        expect(response.body.message).toEqual('Authentication token missing');
      });

      it('should throw 401 error if token is missing', async () => {
        //setup
        const token = '21AOHO35EOFQO9U0AIABALBL';
        //execute
        const response = await request.get(`${ticketRoute.path}`).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response.status).toBe(401);
      });
    });
    // describe('when the user is authenticated', () => {});
  });
});
