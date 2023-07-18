import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { App } from '@/app';
import { CreateUserDto } from '@dtos/users.dto';
import { TicketRoute } from '@/routes/tickets.route';
import { AuthRoute } from '@/routes/auth.route';
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

describe('Testing Tickets', () => {
  const ticketRoute = new TicketRoute();

  let request: supertest.SuperTest<supertest.Test>;
  beforeEach(() => {
    const app = new App([ticketRoute]);
    request = supertest(app.getServer());

    //mocking mailing service
    jest.spyOn(notificationUtils, 'sendMail').mockResolvedValue(true);

    //mocking login service
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        //ticket data
        _id: 'qpuytdhjpo',
        title: 'hello1',
        description: 'world123',
        status: 'inProgress',
        priority: 'low',
        createdBy: '125',
        category: 'Performance Problem',
        assignedAgent: '122',
        comments: [],
        history: ['ajpzsaj'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

      it('should throw 401 error if token is wrong', async () => {
        //setup
        const token = '21AOHO35EOFQO9U0AIABALBL';
        //execute
        const response = await request.get(`${ticketRoute.path}`).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response.status).toBe(401);
      });
    });
    describe('when the user is authenticated', () => {
      it('should return all tickets with status 200', async () => {
        //setup
        const userData: User = {
          _id: '60706478aad6c9ad19a31c22',
          email: 'test@email.com',
          role: 'user',
          password: await bcrypt.hash('q1w2e3s4!', 10),
        };
        /*Fake login by generarting token and mocking auth middleware call to findUser*/
        const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c22' }, SECRET_KEY, { expiresIn: '1d' });
        jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

        //mock find function
        const findMock = jest.spyOn(TicketModel, 'find');
        findMock.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue(ticketData),
        } as any);
        //execute
        const response = await request.get(`${ticketRoute.path}`).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('tickets');
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data).toEqual(ticketData);
      });
    });
  });

  describe('[GET]/tickets/:id', () => {
    const ticketData = {
      //ticket data
      _id: 'qpwoeiruty',
      title: 'hello',
      description: 'world',
      status: 'open',
      priority: 'high',
      createdBy: '60706478aad6c9ad19a31c22',
      category: 'Performance Problem',
      assignedAgent: '123',
      comments: [],
      history: ['ajpfaj'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // jest.spyOn(TicketModel, 'find').mockResolvedValue(ticketData);
    describe('when the user is not authenticated', () => {
      it('should throw 404 error if token is missing', async () => {
        //execute
        const response = await request.get(`${ticketRoute.path}/1`);
        //assert
        expect(response.status).toBe(404);
        expect(response.body.message).toEqual('Authentication token missing');
      });

      it('should throw 401 error if token is wrong', async () => {
        //setup
        const token = '21AOHO35EOFQO9U0AIABALBL';
        //execute
        const response = await request.get(`${ticketRoute.path}/2`).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response.status).toBe(401);
      });
    });
    describe('when the user is authenticated', () => {
      it('should return all tickets with status 200', async () => {
        //setup
        const userData: User = {
          _id: '60706478aad6c9ad19a31c22',
          email: 'test@email.com',
          role: 'user',
          password: await bcrypt.hash('q1w2e3s4!', 10),
        };
        /*Fake login by generarting token and mocking auth middleware call to findUser*/
        const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c22' }, SECRET_KEY, { expiresIn: '1d' });
        jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

        //mock find function
        const findByIdMock = jest.spyOn(TicketModel, 'findById');
        findByIdMock.mockReturnValue({
          populate: jest.fn().mockResolvedValue(ticketData),
        } as any);
        //execute
        const response = await request.get(`${ticketRoute.path}/qpwoeiruty`).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('Ticket Retrieval successfull');
        expect(response.body.data).toEqual(ticketData);
      });

      it('should handle all the edge cases', async () => {
        //setup
        const userData: User = {
          _id: '60706478aad6c9ad19a31c22',
          email: 'test@email.com',
          role: 'user',
          password: await bcrypt.hash('q1w2e3s4!', 10),
        };
        /*Fake login by generarting token and mocking auth middleware call to findUser*/
        const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c22' }, SECRET_KEY, { expiresIn: '1d' });
        jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

        // Test scenario 1: Invalid ticket ID
        //mock find function
        const findByIdMock1 = jest.spyOn(TicketModel, 'findById');
        findByIdMock1.mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        } as any);

        //execute
        const response1 = await request.get(`${ticketRoute.path}/qpwoeiruty`).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response1.status).toBe(404);
        expect(response1.body.message).toEqual('Ticket not found');
        // Test scenario 3: Unauthorized access

        //mock find function
        const UnauthorizedTicket = ticketData;
        UnauthorizedTicket.createdBy = '60706478aad6c9ad19a31c25';
        const findByIdMock2 = jest.spyOn(TicketModel, 'findById');
        findByIdMock2.mockReturnValue({
          populate: jest.fn().mockResolvedValue(ticketData),
        } as any);

        //execute
        const response2 = await request.get(`${ticketRoute.path}/qpwoeiruty`).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response2.status).toBe(403);
        expect(response2.body.message).toEqual('Unauthorized Access');
      });
    });
  });
});
