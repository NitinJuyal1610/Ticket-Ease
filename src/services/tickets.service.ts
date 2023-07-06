import { Service } from 'typedi';
import { HttpException } from '@exceptions/httpException';
import { TicketModel } from '@models/tickets.model';
import { Ticket, UpdateTicket } from '@/interfaces/tickets.interface';
import { User } from '@/interfaces/users.interface';

@Service()
export class TicketsService {
  public async findAllTickets(user: User, status: string, priority: string, category: string, sortBy: string, sortOrder: string): Promise<Ticket[]> {
    try {
      const filter = {};
      const sorter = {};
      let tickets = [];
      if (user.role === 'user') {
        filter['createdBy'] = user._id;
      }

      if (status) {
        filter['status'] = status;
      }

      if (priority) {
        filter['priority'] = priority;
      }

      if (category) {
        filter['category'] = category;
      }
      if (sortBy) {
        sorter[sortBy] = sortOrder;
      }
      tickets = await TicketModel.find(filter).sort(sorter);
      console.log('Retrieved tickets:', tickets);
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
      const ticket = await TicketModel.findById(ticketId);
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
        const updatedTicket = await TicketModel.findByIdAndUpdate(ticketId, updateData, { new: true });
        return updatedTicket;
      }

      throw new HttpException(404, 'Ticket not found');
    } catch (error) {
      throw new HttpException(500, `Failed to update ticket with ID ${ticketId}: ${error.message}`);
    }
  }
}
