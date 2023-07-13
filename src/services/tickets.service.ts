import { Service } from 'typedi';
import { HttpException } from '@exceptions/httpException';
import { TicketModel } from '@models/tickets.model';
import { CommentModel } from '@/models/comments.model';
import { Ticket, UpdateTicket } from '@/interfaces/tickets.interface';
import { User } from '@/interfaces/users.interface';
import { Comment } from '@/interfaces/comments.interface';
import { TicketLog } from '@/interfaces/ticketLog.interface';
import { TicketLogModel } from '@/models/ticketLogs.model';

@Service()
export class TicketsService {
  public async findAllTickets(
    user: User,
    status: string,
    priority: string,
    category: string,
    assigned: string,
    sortBy: string,
    sortOrder: string,
  ): Promise<Ticket[]> {
    try {
      const filter = {};
      const sorter = {};
      let tickets = [];
      if (user.role === 'user') filter['createdBy'] = user._id;

      if (status) filter['status'] = status;

      if (priority) filter['priority'] = priority;

      if (assigned) {
        if (assigned === 'true') filter['assignedAgent'] = { $not: { $eq: null } };
        else if (assigned === 'false') filter['assignedAgent'] = null;
      }

      if (category) filter['category'] = category;

      if (sortBy) sorter[sortBy] = sortOrder;

      console.log(filter);
      tickets = await TicketModel.find(filter).populate('comments').sort(sorter);
      return tickets;
    } catch (error) {
      throw new HttpException(500, `Failed to retrieve tickets: ${error.message}`);
    }
  }

  public async newTicket(ticketData: Ticket): Promise<Ticket> {
    try {
      // logging the ticket creation
      const updateData = {
        userId: ticketData.createdBy,
        updateType: 'newTicket',
        updateFields: ticketData,
      };

      const logData = await TicketLogModel.create(updateData);
      if (!logData) {
        throw new HttpException(500, 'Failed to create the log');
      }
      ticketData['history'] = [logData._id];

      //creating a ticket
      const ticket = await TicketModel.create(ticketData);
      return ticket;
    } catch (error) {
      throw new HttpException(500, `Failed to create ticket: ${error.message}`);
    }
  }

  public async getTicketById(ticketId: string, user: User): Promise<Ticket> {
    try {
      const ticket = await TicketModel.findById(ticketId).populate('comments');
      if (!ticket) {
        throw new HttpException(404, 'Ticket not found');
      }

      if (ticket.createdBy.toString() !== user._id.toString() && user.role === 'user') {
        throw new HttpException(403, 'Unauthorized Access');
      }

      return ticket;
    } catch (error) {
      throw new HttpException(500, `Failed to retrieve ticket with ID ${ticketId}: ${error.message}`);
    }
  }

  public async updateTicketById(ticketId: string, updateData: UpdateTicket, user: User): Promise<Ticket> {
    try {
      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) {
        throw new HttpException(404, 'Ticket not found');
      }
      if (ticket.createdBy.toString() !== user._id.toString() && user.role === 'user') {
        throw new HttpException(403, 'Unauthorized Access');
      }

      // logging the ticket updation
      const multiFieldUpdateData = {
        userId: user._id,
        updateType: 'updateTicket',
        updateFields: updateData,
      };

      const logData = await TicketLogModel.create(multiFieldUpdateData);
      if (!logData) {
        throw new HttpException(500, 'Failed to create the log');
      }

      const updatedTicket = await TicketModel.findByIdAndUpdate(
        ticketId,
        { $set: updateData, $push: { history: logData._id } },
        { new: true },
      ).populate('comments');
      return updatedTicket;
    } catch (error) {
      throw new HttpException(500, `Failed to update ticket with ID ${ticketId}: ${error.message}`);
    }
  }

  public async assignTicket(ticketId: string, user: User): Promise<Ticket> {
    try {
      // logging the ticket assigning
      const updateData = {
        userId: user._id,
        updateType: 'assignTicket',
        updateFields: {
          assignedAgent: user._id,
          status: 'inProgress',
        },
      };

      const logData = await TicketLogModel.create(updateData);
      if (!logData) {
        throw new HttpException(500, 'Failed to create the log');
      }

      //assigining ticket

      const ticket = await TicketModel.findOneAndUpdate(
        { _id: ticketId, assignedAgent: null, status: 'open' },
        { $set: { assignedAgent: user._id, status: 'inProgress' }, $push: { history: logData._id } },
        { new: true },
      ).populate({ path: 'createdBy', select: 'email' });

      if (!ticket) {
        throw new HttpException(404, 'Ticket not found/Ticket already assigned');
      }

      console.log('ticket update status -o- ', ticket);
      return ticket;
    } catch (error) {
      throw new HttpException(500, `Failed to assign ticket with ID ${ticketId}: ${error.message}`);
    }
  }

  public async findTickets(user: User): Promise<Ticket[]> {
    try {
      const tickets = await TicketModel.find({ assignedAgent: user._id });
      return tickets;
    } catch (error) {
      throw new HttpException(500, `Failed to retrieve tickets: ${error.message}`);
    }
  }

  public async changeAgent(ticketId: string, newAgentId: string, user: User): Promise<Ticket> {
    try {
      if (user.role == 'support') {
        const ticket = await TicketModel.findOne({ _id: ticketId, assignedAgent: user._id });
        if (!ticket) {
          throw new HttpException(404, 'Ticket not found or Unauthorized access');
        }
      }
      // logging the ticket assigning
      const updateData = {
        userId: user._id,
        updateType: 'reassignTicket',
        updateFields: {
          assignedAgent: newAgentId,
        },
      };

      const logData = await TicketLogModel.create(updateData);
      if (!logData) {
        throw new HttpException(500, 'Failed to create the log');
      }

      //reassigining ticket
      const updatedTicket = await TicketModel.findOneAndUpdate(
        { _id: ticketId },
        { $set: { assignedAgent: newAgentId }, $push: { history: logData._id } },
        { new: true },
      ).populate([
        { path: 'createdBy', select: 'email' },
        { path: 'assignedAgent', select: 'email' },
      ]);

      if (!updatedTicket) {
        throw new HttpException(404, `Ticket with the id ${ticketId} not found`);
      }

      return updatedTicket;
    } catch (error) {
      throw new HttpException(500, `Failed to reassign ticket with ID ${ticketId}: ${error.message}`);
    }
  }

  public async closeTicket(ticketId: string, user: User): Promise<Ticket> {
    try {
      if (user.role == 'support') {
        const ticket = await TicketModel.findOne({ _id: ticketId, assignedAgent: user._id });
        if (!ticket) {
          throw new HttpException(404, 'Ticket not found or Unauthorized access');
        }
      }
      // logging the ticket closing
      const updateData = {
        userId: user._id,
        updateType: 'closeTicket',
        updateFields: {
          status: 'closed',
        },
      };

      const logData = await TicketLogModel.create(updateData);
      if (!logData) {
        throw new HttpException(500, 'Failed to create the log');
      }

      //closing ticket
      const closedTicket = await TicketModel.findOneAndUpdate(
        { _id: ticketId },
        { $set: { status: 'closed' }, $push: { history: logData._id } },
        { new: true },
      ).populate([
        { path: 'createdBy', select: 'email' },
        { path: 'assignedAgent', select: 'email' },
      ]);

      if (!closedTicket) {
        throw new HttpException(404, `Ticket with the id ${ticketId} not found or Unauthorized Agent`);
      }

      return closedTicket;
    } catch (error) {
      throw new HttpException(500, `Failed to close ticket with ID ${ticketId}`);
    }
  }

  public async createComment(ticketId: string, commentData: string, user: User): Promise<Ticket> {
    try {
      // logging the comment creation
      const updateData = {
        userId: user._id,
        updateType: 'comment',
        updateFields: {
          comment: commentData,
        },
      };

      const logData = await TicketLogModel.create(updateData);
      if (!logData) {
        throw new HttpException(500, 'Failed to create the log');
      }

      //creating comment

      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) {
        throw new HttpException(404, `Ticket with the id ${ticketId} not found`);
      }

      if (!ticket.assignedAgent) {
        throw new HttpException(404, `Ticket not yet assigned to an agent`);
      }

      if (user.role == 'support' && ticket.assignedAgent.toString() != user._id.toString()) {
        throw new HttpException(403, 'Unauthorized Operation');
      }

      if (user.role == 'user' && ticket.createdBy.toString() != user._id.toString()) {
        throw new HttpException(403, 'Unauthorized Operation');
      }

      const comment = await CommentModel.create({ text: commentData, author: user._id });

      ticket.comments.push(comment._id);
      ticket.history.push(logData._id);
      await ticket.save();
      await ticket.populate(['comments', { path: 'createdBy', select: 'email' }, { path: 'assignedAgent', select: 'email' }]);
      return ticket;
    } catch (error) {
      throw new HttpException(500, `Failed to create comment: ${error.message}`);
    }
  }

  public async getComments(ticketId: string, user: User): Promise<Comment[]> {
    try {
      const ticket = await TicketModel.findById(ticketId).populate('comments');

      if (!ticket) {
        throw new HttpException(404, `Ticket with the id ${ticketId} not found`);
      }

      if (user.role == 'support' && ticket.assignedAgent.toString() != user._id.toString()) {
        throw new HttpException(403, 'Unauthorized Operation');
      }

      if (user.role == 'user' && ticket.createdBy.toString() != user._id.toString()) {
        throw new HttpException(403, 'Unauthorized Operation');
      }

      return ticket.comments as Comment[];
    } catch (error) {
      throw new HttpException(500, `Failed to retrieve comments: ${error.message}`);
    }
  }

  public async findAndDeleteTicket(ticketId: string, user: User): Promise<Ticket> {
    try {
      const ticket = await TicketModel.findById(ticketId);

      if (!ticket) {
        throw new HttpException(404, `Ticket with the id ${ticketId} not found`);
      }

      if (user.role == 'support' && ticket.assignedAgent.toString() != user._id.toString()) {
        throw new HttpException(403, 'Unauthorized Operation');
      }

      await CommentModel.deleteMany({ _id: { $in: ticket.comments } });
      await TicketLogModel.deleteMany({ _id: { $in: ticket.history } });

      const deletedTicket = await TicketModel.findByIdAndDelete(ticketId).populate({ path: 'createdBy', select: 'email' });

      return deletedTicket;
    } catch (error) {
      throw new HttpException(500, `Failed to delete ticket with ID ${ticketId}: ${error.message}`);
    }
  }

  public async getLogs(ticketId: string, user: User): Promise<TicketLog[]> {
    try {
      const ticket = await TicketModel.findById(ticketId).populate('history');

      if (!ticket) {
        throw new HttpException(404, `Ticket with the id ${ticketId} not found`);
      }

      if (user.role == 'support' && ticket.assignedAgent.toString() != user._id.toString()) {
        throw new HttpException(403, 'Unauthorized Operation');
      }

      if (user.role == 'user' && ticket.createdBy.toString() != user._id.toString()) {
        throw new HttpException(403, 'Unauthorized Operation');
      }

      return ticket.history as TicketLog[];
    } catch (error) {
      throw new HttpException(500, `Failed to retrieve updates: ${error.message}`);
    }
  }
}
