import { Service } from 'typedi';
import { HttpException } from '@exceptions/httpException';
import { TicketModel } from '@models/tickets.model';
import { Ticket } from '@/interfaces/tickets.interface';

@Service()
export class TicketsService {
  public async findAllTickets(): Promise<Ticket[]> {
    const tickets: Ticket[] = await TicketModel.find();
    console.log('Retrieved tickets:', tickets);
    return tickets;
  }

  public async newTicket(ticketData: Ticket): Promise<Ticket> {
    const ticket = await TicketModel.create(ticketData);
    return ticket;
  }

  public async getTicketById(ticketId: string): Promise<Ticket> {
    const ticket = await TicketModel.findById(ticketId);
    if (!ticket) {
      throw new HttpException(404, 'Ticket not found');
    }
    return ticket;
  }
}
