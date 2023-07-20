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
import { CreateTicketDto } from '@/dtos/tickets.dto';

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

  //---------------------------------------------------------------------------------------------//
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

  //---------------------------------------------------------------------------------------------//
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

  //------------------------------------------------------------------------------------------------/

  describe('[POST]/tickets', () => {
    const ticketData: CreateTicketDto = {
      //ticket data
      title: 'hello',
      description: 'world of coders',
      priority: 'high',
      category: 'Performance Problem',
    };
    // jest.spyOn(TicketModel, 'find').mockResolvedValue(ticketData);
    describe('when the user is not authenticated', () => {
      it('should throw 404 error if token is missing', async () => {
        //execute
        const response = await request.post(`${ticketRoute.path}`).send(ticketData);
        //assert
        expect(response.status).toBe(404);
        expect(response.body.message).toEqual('Authentication token missing');
      });

      it('should throw 401 error if token is wrong', async () => {
        //setup
        const token = '21AOHO35EOFQO9U0AIABALBL';
        //execute
        const response = await request.post(`${ticketRoute.path}`).set('Cookie', `Authorization=${token}`).send(ticketData);
        //assert
        expect(response.status).toBe(401);
      });
    });
    describe('when the user is authenticated', () => {
      it('should create a new ticket with status 201', async () => {
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

        //execute
        const response = await request.post(`${ticketRoute.path}`).send(ticketData).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response.status).toBe(201);
        expect(response.body.message).toEqual('Ticket creation successfull');
        expect(response.body.data.createdBy).toEqual(userData._id);
      });
    });
  });

  //----------------------------------------------------------------------------------------------//
  describe('[PUT]/tickets/:id', () => {
    const ticketData = {
      //ticket data
      title: 'hello',
      description: 'world of coders',
      priority: 'high',
      category: 'Performance Problem',
      createdBy: '60706478aad6c9ad19a31c22',
    };
    // jest.spyOn(TicketModel, 'find').mockResolvedValue(ticketData);
    describe('when the user is not authenticated', () => {
      it('should throw 404 error if token is missing', async () => {
        //execute
        const response = await request.put(`${ticketRoute.path}/1`).send({ description: 'world of coders updated' });
        //assert
        expect(response.status).toBe(404);
        expect(response.body.message).toEqual('Authentication token missing');
      });

      it('should throw 401 error if token is wrong', async () => {
        //setup
        const token = '21AOHO35EOFQO9U0AIABALBL';
        //execute
        const response = await request
          .put(`${ticketRoute.path}/2`)
          .send({ description: 'world of coders updated' })
          .set('Cookie', `Authorization=${token}`);
        //assert
        expect(response.status).toBe(401);
      });
    });
    describe('when the user is authenticated', () => {
      it('should update the ticket with status 201', async () => {
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

        //create ticket

        const newTicket = await TicketModel.create(ticketData);
        const ticketId = newTicket._id;
        const updateData = {
          description: 'world of coders updated',
        };
        //execute
        const response = await request.put(`${ticketRoute.path}/${ticketId}`).send(updateData).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response.status).toBe(201);
        expect(response.body.message).toEqual('Ticket update successfull');
        expect(response.body.data.description).toEqual(updateData.description);
      });

      it('should throw error when unauthorized access', async () => {
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

        //when updating user is not the ticket owner
        ticketData.createdBy = '60706478aad6c9ad19a31c28';
        //create ticket

        const newTicket = await TicketModel.create(ticketData);
        const ticketId = newTicket._id;
        const updateData = {
          description: 'world of coders updated',
        };

        //execute
        const response = await request.put(`${ticketRoute.path}/${ticketId}`).send(updateData).set('Cookie', `Authorization=${token}`);
        //assert
        expect(response.status).toBe(403);
        expect(response.body.message).toEqual('Unauthorized Access');

        //when support tries to update ticket
        const supportData: User = {
          _id: '60706478aad6c9ad19a31c28',
          email: 'testsupport@email.com',
          role: 'support',
          password: await bcrypt.hash('q1w2e3s4!', 10),
        };
        /*Fake login by generarting token and mocking auth middleware call to findUser*/
        const tokenSupport = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
        jest.spyOn(UserModel, 'findById').mockResolvedValue(supportData);

        const updateData2 = {
          description: 'world of coders updated by support',
        };
        //execute
        const response2 = await request.put(`${ticketRoute.path}/${ticketId}`).send(updateData2).set('Cookie', `Authorization=${tokenSupport}`);

        //asserts
        expect(response2.status).toBe(401);
        expect(response2.body.message).toEqual('Wrong authentication token or Not authorized');
      });
    });

    //-------------------------------------------------------------------------------------------//
    describe('[PUT]/tickets/claim/:id', () => {
      const ticketData = {
        //ticket data
        title: 'hello',
        description: 'world of coders',
        priority: 'high',
        category: 'Performance Problem',
        createdBy: '60706478aad6c9ad19a31c22',
      };

      describe('when the user is not authenticated', () => {
        it('should throw 404 error if token is missing', async () => {
          //execute
          const response = await request.put(`${ticketRoute.path}/claim/1`);
          //assert
          expect(response.status).toBe(404);
          expect(response.body.message).toEqual('Authentication token missing');
        });

        it('should throw 401 error if token is wrong', async () => {
          //setup
          const token = '21AOHO35EOFQO9U0AIABALBL';
          //execute
          const response = await request.put(`${ticketRoute.path}/claim/2`).set('Cookie', `Authorization=${token}`);
          //assert
          expect(response.status).toBe(401);
        });
      });
      describe('when the user is authenticated', () => {
        it('should update the ticket with status 201', async () => {
          //setup
          const userData: User = {
            _id: '60706478aad6c9ad19a31c28',
            email: 'testsupport@email.com',
            role: 'support',
            password: await bcrypt.hash('q1w2e3s4!', 10),
          };
          /*Fake login by generarting token and mocking auth middleware call to findUser*/
          const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
          jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

          //create ticket

          const newTicket = await TicketModel.create(ticketData);
          const ticketId = newTicket._id;

          //execute
          const response = await request.put(`${ticketRoute.path}/claim/${ticketId}`).set('Cookie', `Authorization=${token}`);
          //assert
          expect(response.status).toBe(201);
          expect(response.body.message).toEqual('Ticket claim successfull');
          expect(response.body.data.assignedAgent).toEqual(userData._id);
        });

        it('should throw error when unauthorized access by role user', async () => {
          //setup
          const userData: User = {
            _id: '60706478aad6c9ad19a31c27',
            email: 'testuser@email.com',
            role: 'user',
            password: await bcrypt.hash('q1w2e3s4!', 10),
          };
          /*Fake login by generarting token and mocking auth middleware call to findUser*/
          const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c27' }, SECRET_KEY, { expiresIn: '1d' });
          jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

          //create ticket
          const newTicket = await TicketModel.create(ticketData);
          const ticketId = newTicket._id;

          //execute
          const response = await request.put(`${ticketRoute.path}/claim/${ticketId}`).set('Cookie', `Authorization=${token}`);

          //assert
          expect(response.status).toBe(401);
        });

        it('should throw 404 error when ticket is not found or is already assigned', async () => {
          const userData: User = {
            _id: '60706478aad6c9ad19a31c28',
            email: 'testsupport@email.com',
            role: 'support',
            password: await bcrypt.hash('q1w2e3s4!', 10),
          };
          /*Fake login by generarting token and mocking auth middleware call to findUser*/
          const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
          jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

          //execute
          const response = await request.put(`${ticketRoute.path}/claim/60706478aad6c9ad19a31c22`).set('Cookie', `Authorization=${token}`);
          //assert
          expect(response.status).toBe(404);
          expect(response.body.message).toEqual('Ticket not found/Ticket already assigned');
        });
      });

      //-------------------------------------------------------------------------------------------//
      describe('[PUT]/tickets/reassign/:id', () => {
        const ticketData = {
          //ticket data
          title: 'hello',
          description: 'world of coders',
          priority: 'high',
          category: 'Performance Problem',
          createdBy: '60706478aad6c9ad19a31c22',
        };

        describe('when the user is not authenticated', () => {
          it('should throw 404 error if token is missing', async () => {
            //execute
            const response = await request.put(`${ticketRoute.path}/reassign/1`);
            //assert
            expect(response.status).toBe(404);
            expect(response.body.message).toEqual('Authentication token missing');
          });

          it('should throw 401 error if token is wrong', async () => {
            //setup
            const token = '21AOHO35EOFQO9U0AIABALBL';
            //execute
            const response = await request.put(`${ticketRoute.path}/reassign/2`).set('Cookie', `Authorization=${token}`);
            //assert
            expect(response.status).toBe(401);
          });
        });
        describe('when the user is authenticated', () => {
          it('should reassign the ticket with status 201', async () => {
            //setup
            const userData: User = {
              _id: '60706478aad6c9ad19a31c28',
              email: 'testsupport@email.com',
              role: 'support',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };
            const mockReassignData = {
              _id: 'qpwoeiruty',
              title: 'hello',
              description: 'world',
              status: 'open',
              priority: 'high',
              createdBy: '60706478aad6c9ad19a31c22',
              category: 'Performance Problem',
              assignedAgent: '60706478aad6c9ad19a31c28',
              comments: [],
              history: ['ajpfaj'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const agentId = '60706478aad6c9ad19a31c21';
            //reassign mock
            mockReassignData.assignedAgent = agentId;
            const ticketId = '60706578aa96c9ad19a36221';
            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

            //mock for reassign
            jest.spyOn(TicketModel, 'findOne').mockResolvedValue(ticketData);
            const findOneAndUpdateMock = jest.spyOn(TicketModel, 'findOneAndUpdate');
            findOneAndUpdateMock.mockReturnValue({
              populate: jest.fn().mockResolvedValue(mockReassignData),
            } as any);

            //execute
            const response = await request
              .put(`${ticketRoute.path}/reassign/${ticketId}`)
              .send({ agentId: agentId })
              .set('Cookie', `Authorization=${token}`);
            //assert
            expect(response.status).toBe(201);
            expect(response.body.message).toEqual('Ticket reassign successfull');
            expect(response.body.data.assignedAgent).toEqual(agentId);
          });

          it('should throw 404 error when ticket is not found or not assigned to agent', async () => {
            const userData: User = {
              _id: '60706478aad6c9ad19a31c28',
              email: 'testsupport@email.com',
              role: 'support',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };
            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

            const agentId = '60706478aad6c9ad19a31c21';
            //reassign mock
            const ticketId = '60706578aa96c9ad19a36221';

            //mock for reassign
            jest.spyOn(TicketModel, 'findOne').mockResolvedValue(null);
            const findOneAndUpdateMock = jest.spyOn(TicketModel, 'findOneAndUpdate');
            findOneAndUpdateMock.mockReturnValue({
              populate: jest.fn().mockResolvedValue(null),
            } as any);

            //execute
            const response = await request
              .put(`${ticketRoute.path}/reassign/${ticketId}`)
              .send({ agentId: agentId })
              .set('Cookie', `Authorization=${token}`);
            //assert
            expect(response.status).toBe(404);
            expect(response.body.message).toEqual('Ticket not found or Unauthorized access');
          });
        });
      });

      //-----------------------------------------------------------------------------------------------//
      describe('[PUT]/tickets/resolve/:id', () => {
        const ticketData = {
          //ticket data
          title: 'hello',
          description: 'world of coders',
          priority: 'high',
          category: 'Performance Problem',
          createdBy: '60706478aad6c9ad19a31c22',
        };

        describe('when the user is not authenticated', () => {
          it('should throw 404 error if token is missing', async () => {
            //execute
            const response = await request.put(`${ticketRoute.path}/resolve/1`);
            //assert
            expect(response.status).toBe(404);
            expect(response.body.message).toEqual('Authentication token missing');
          });

          it('should throw 401 error if token is wrong', async () => {
            //setup
            const token = '21AOHO35EOFQO9U0AIABALBL';
            //execute
            const response = await request.put(`${ticketRoute.path}/resolve/2`).set('Cookie', `Authorization=${token}`);
            //assert
            expect(response.status).toBe(401);
          });
        });
        describe('when the user is authenticated', () => {
          it('should resolve the ticket with status 201', async () => {
            //setup
            const userData: User = {
              _id: '60706478aad6c9ad19a31c28',
              email: 'testsupport@email.com',
              role: 'support',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };
            const mockResolveData = {
              _id: 'qpwoeiruty',
              title: 'hello',
              description: 'world',
              status: 'open',
              priority: 'high',
              createdBy: '60706478aad6c9ad19a31c22',
              category: 'Performance Problem',
              assignedAgent: '60706478aad6c9ad19a31c28',
              comments: [],
              history: ['ajpfaj'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

            //resolve mock
            mockResolveData.status = 'closed';
            const ticketId = '60706578aa96c9ad19a36221';
            //mock for resolving & checking
            jest.spyOn(TicketModel, 'findOne').mockResolvedValue(ticketData);
            const findOneAndUpdateMock = jest.spyOn(TicketModel, 'findOneAndUpdate');
            findOneAndUpdateMock.mockReturnValue({
              populate: jest.fn().mockResolvedValue(mockResolveData),
            } as any);

            //execute
            const response = await request.put(`${ticketRoute.path}/resolve/${ticketId}`).set('Cookie', `Authorization=${token}`);
            //assert
            expect(response.status).toBe(201);
            expect(response.body.message).toEqual('Ticket resolved');
            expect(response.body.data.status).toEqual('closed');
          });

          it('should throw an error if ticket is not assigned to agent performing operation', async () => {
            //setup
            const userData: User = {
              _id: '60706478aad6c9ad19a31c28',
              email: 'testsupport@email.com',
              role: 'support',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };
            const mockResolveData = {
              _id: 'qpwoeiruty',
              title: 'hello',
              description: 'world',
              status: 'open',
              priority: 'high',
              createdBy: '60706478aad6c9ad19a31c22',
              category: 'Performance Problem',
              assignedAgent: '60706478aad6c9ad19a31c28',
              comments: [],
              history: ['ajpfaj'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

            //resolve mock
            mockResolveData.status = 'closed';
            const ticketId = '60706578aa96c9ad19a36221';
            //mock for resolving & checking
            jest.spyOn(TicketModel, 'findOne').mockResolvedValue(null);
            const findOneAndUpdateMock = jest.spyOn(TicketModel, 'findOneAndUpdate');
            findOneAndUpdateMock.mockReturnValue({
              populate: jest.fn().mockResolvedValue(mockResolveData),
            } as any);

            //execute
            const response = await request.put(`${ticketRoute.path}/resolve/${ticketId}`).set('Cookie', `Authorization=${token}`);
            //assert
            expect(response.status).toBe(404);
            expect(response.body.message).toEqual('Ticket not found or Unauthorized access');
          });
        });
      });
      //---------------------------------------------------------------------------------------------------------------------//
      describe('[POST]/tickets/comments/:id', () => {
        const ticketData = {
          //ticket data
          title: 'hello',
          description: 'world of coders',
          priority: 'high',
          category: 'Performance Problem',
          createdBy: '60706478aad6c9ad19a31c22',
        };

        describe('when the user is not authenticated', () => {
          it('should throw 404 error if token is missing', async () => {
            //execute
            const response = await request.post(`${ticketRoute.path}/comments/1`);
            //assert
            expect(response.status).toBe(404);
            expect(response.body.message).toEqual('Authentication token missing');
          });

          it('should throw 401 error if token is wrong', async () => {
            //setup
            const token = '21AOHO35EOFQO9U0AIABALBL';
            //execute
            const response = await request.post(`${ticketRoute.path}/comments/1`).set('Cookie', `Authorization=${token}`);
            //assert
            expect(response.status).toBe(401);
          });
        });
        describe('when the user is authenticated', () => {
          it('should create a comment returning status 201', async () => {
            //setup
            const userData: User = {
              _id: '60706478aad6c9ad19a31c28',
              email: 'testsupport@email.com',
              role: 'support',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };

            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

            //create ticket
            const ticket = await TicketModel.create(ticketData);
            await TicketModel.findByIdAndUpdate(ticket._id, {
              $set: {
                assignedAgent: '60706478aad6c9ad19a31c28',
                status: 'inProgress',
              },
            });
            //execute
            const response = await request
              .post(`${ticketRoute.path}/comments/${ticket._id}`)
              .send({ text: 'hello this is my comment' })
              .set('Cookie', `Authorization=${token}`);
            //assert

            expect(response.status).toBe(201);
            expect(response.body.message).toEqual('Ticket comment added');
            expect(response.body.data.comments).toHaveLength(1);
            expect(response.body.data.comments[0].text).toEqual('hello this is my comment');
          });

          it('should handle edge cases when creating comment', async () => {
            //setup
            const userData: User = {
              _id: '60706478aad6c9ad19a31c22',
              email: 'testuser@email.com',
              role: 'user',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };

            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c22' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

            //throw error when user create comment without any assigned agent
            //create ticket
            const ticket = await TicketModel.create(ticketData);

            //execute
            const response = await request
              .post(`${ticketRoute.path}/comments/${ticket._id}`)
              .send({ text: 'hello this is my comment as user' })
              .set('Cookie', `Authorization=${token}`);
            //assert

            expect(response.status).toBe(409);
            expect(response.body.message).toEqual('Ticket not yet assigned to an agent');

            //unauthorized operation by support

            //setup
            const userData2: User = {
              _id: '60706478aad6c9ad19a31c28',
              email: 'testsupport@email.com',
              role: 'support',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };

            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token2 = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData2);

            //assign different agent
            await TicketModel.findByIdAndUpdate(ticket._id, {
              $set: {
                assignedAgent: '60706478aad6c9ad19a31c30',
                status: 'inProgress',
              },
            });

            //execute
            const response2 = await request
              .post(`${ticketRoute.path}/comments/${ticket._id}`)
              .send({ text: 'hello this is my comment as support' })
              .set('Cookie', `Authorization=${token2}`);
            //assert

            expect(response2.status).toBe(403);
            expect(response2.body.message).toEqual('Unauthorized Operation');
          });
        });
      });

      //-------------------------------------------------------------------------------//

      describe('[DELETE]/tickets/:id', () => {
        const ticketData = {
          //ticket data
          title: 'hello',
          description: 'world of coders',
          priority: 'high',
          category: 'Performance Problem',
          createdBy: '60706478aad6c9ad19a31c22',
        };

        describe('when the user is not authenticated', () => {
          it('should throw 404 error if token is missing', async () => {
            //execute
            const response = await request.delete(`${ticketRoute.path}/1`);
            //assert
            expect(response.status).toBe(404);
            expect(response.body.message).toEqual('Authentication token missing');
          });

          it('should throw 401 error if token is wrong', async () => {
            //setup
            const token = '21AOHO35EOFQO9U0AIABALBL';
            //execute
            const response = await request.delete(`${ticketRoute.path}/1`).set('Cookie', `Authorization=${token}`);
            //assert
            expect(response.status).toBe(401);
          });
        });
        describe('when the user is authenticated', () => {
          it('should delete a ticket with an id returning status 201', async () => {
            //setup
            const userData: User = {
              _id: '60706478aad6c9ad19a31c28',
              email: 'testsupport@email.com',
              role: 'support',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };

            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

            //create ticket
            const ticket = await TicketModel.create(ticketData);
            await TicketModel.findByIdAndUpdate(ticket._id, {
              $set: {
                assignedAgent: '60706478aad6c9ad19a31c28',
                status: 'inProgress',
              },
            });
            //execute
            const response = await request.delete(`${ticketRoute.path}/${ticket._id}`).set('Cookie', `Authorization=${token}`);
            //assert

            expect(response.status).toBe(200);
            expect(response.body.message).toEqual('Ticket deleted');
          });

          it('should handle edge cases when creating comment', async () => {
            //setup
            const userData: User = {
              _id: '60706478aad6c9ad19a31c22',
              email: 'testuser@email.com',
              role: 'user',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };

            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token = await jwt.sign({ _id: '60706478aad6c9ad19a31c22' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData);

            //throw error when user tries to delete the ticket

            //create ticket
            const ticket = await TicketModel.create(ticketData);

            //execute
            const response = await request.delete(`${ticketRoute.path}/${ticket._id}`).set('Cookie', `Authorization=${token}`);
            //assert

            expect(response.status).toBe(401);
            expect(response.body.message).toEqual('Wrong authentication token or Not authorized');

            //ticket not found

            //setup
            const userData2: User = {
              _id: '60706478aad6c9ad19a31c28',
              email: 'testsupport@email.com',
              role: 'support',
              password: await bcrypt.hash('q1w2e3s4!', 10),
            };

            /*Fake login by generarting token and mocking auth middleware call to findUser*/
            const token2 = await jwt.sign({ _id: '60706478aad6c9ad19a31c28' }, SECRET_KEY, { expiresIn: '1d' });
            jest.spyOn(UserModel, 'findById').mockResolvedValue(userData2);

            //WRONG TICKET ID
            const ticketId = '60706578aa96c9ad19a36222';
            //execute
            const response2 = await request.delete(`${ticketRoute.path}/${ticketId}`).set('Cookie', `Authorization=${token2}`);
            //assert
            expect(response2.status).toBe(404);
            expect(response2.body.message).toEqual(`Ticket with the id ${ticketId} not found`);
          });
        });
      });
    });
  });
});
