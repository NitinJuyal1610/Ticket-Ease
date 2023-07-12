import { Service } from 'typedi';
import { HttpException } from '@exceptions/httpException';
import { TicketModel } from '@models/tickets.model';
import { CommentModel } from '@/models/comments.model';
import { Ticket, UpdateTicket } from '@/interfaces/tickets.interface';
import { User } from '@/interfaces/users.interface';
import { Comment } from '@/interfaces/comments.interface';

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
      if (ticket) {
        if (ticket.createdBy.toString() !== user._id.toString() && user.role === 'user') {
          throw new HttpException(403, 'Unauthorized Access');
        }
        const updatedTicket = await TicketModel.findByIdAndUpdate(ticketId, { $set: updateData }, { new: true }).populate('comments');
        return updatedTicket;
      }

      throw new HttpException(404, 'Ticket not found');
    } catch (error) {
      throw new HttpException(500, `Failed to update ticket with ID ${ticketId}: ${error.message}`);
    }
  }

  public async assignTicket(ticketId: string, user: User): Promise<Ticket> {
    try {
      const ticket = await TicketModel.findOneAndUpdate(
        { _id: ticketId, assignedAgent: null, status: 'open' },
        { $set: { assignedAgent: user._id, status: 'inProgress' } },
        { new: true },
      );

      if (!ticket) {
        throw new HttpException(404, 'Ticket not found');
      }

      await ticket.populate('createdBy');
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

  public async changeAgent(ticketId: string, newAgentId: string, agentId: string): Promise<Ticket> {
    try {
      const ticket = await TicketModel.findOneAndUpdate(
        { _id: ticketId, assignedAgent: agentId },
        { $set: { assignedAgent: newAgentId } },
        { new: true },
      );
      if (!ticket) {
        throw new HttpException(404, `Ticket with the id ${ticketId} not found`);
      }
      console.log('new ticket ', ticket);
      await ticket.populate('createdBy');
      await ticket.populate('assignedAgent');
      return ticket;
    } catch (error) {
      throw new HttpException(500, `Failed to reassign ticket with ID ${ticketId}: ${error.message}`);
    }
  }

  public async closeTicket(ticketId: string, agentId: string): Promise<Ticket> {
    try {
      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) {
        throw new HttpException(404, `Ticket with the id ${ticketId} not found`);
      }

      if (ticket.assignedAgent.toString() != agentId.toString()) {
        throw new HttpException(403, 'Unauthorized Operation');
      }

      ticket.status = 'closed';

      const closedTicket = await ticket.save();
      await closedTicket.populate(['createdBy', 'comments']);

      return closedTicket;
    } catch (error) {
      throw new HttpException(500, `Failed to close ticket with ID ${ticketId}`);
    }
  }

  public async createComment(ticketId: string, commentData: string, user: User): Promise<Ticket> {
    try {
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
      await ticket.save();
      await ticket.populate(['comments', 'createdBy', 'assignedAgent']);
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

      const deletedTicket = await TicketModel.findByIdAndDelete(ticketId).populate('createdBy');

      return deletedTicket;
    } catch (error) {
      throw new HttpException(500, `Failed to delete ticket with ID ${ticketId}: ${error.message}`);
    }
  }
}
