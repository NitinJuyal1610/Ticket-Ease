import { Service } from 'typedi';
import { HttpException } from '@exceptions/httpException';
import { TicketModel } from '@models/tickets.model';
import { Ticket, UpdateTicket } from '@/interfaces/tickets.interface';

@Service()
export class TicketsService {
  public async findAllTickets(): Promise<Ticket[]> {
    try {
      const tickets: Ticket[] = await TicketModel.find();
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

  public async getTicketById(ticketId: string): Promise<Ticket> {
    try {
      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) {
        throw new HttpException(404, 'Ticket not found');
      }
      return ticket;
    } catch (error) {
      throw new HttpException(500, `Failed to retrieve ticket with ID ${ticketId}: ${error.message}`);
    }
  }

  public async updateTicketById(ticketId: string, updateData: UpdateTicket): Promise<Ticket> {
    try {
      const ticket = await TicketModel.findById(ticketId);
      if (ticket) {
        const updatedTicket = await TicketModel.findByIdAndUpdate(ticketId, updateData, { new: true });
        return updatedTicket;
      }
      throw new HttpException(404, 'Ticket not found');
    } catch (error) {
      throw new HttpException(500, `Failed to update ticket with ID ${ticketId}: ${error.message}`);
    }
  }
}
