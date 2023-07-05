import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { Ticket } from '@/interfaces/tickets.interface';
import { TicketsService } from '@/services/tickets.service';
import { RequestWithUser } from '@/interfaces/auth.interface';

export class TicketController {
  public ticket = Container.get(TicketsService);
  public getTickets = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketsData: Ticket[] = await this.ticket.findAllTickets();

      res.status(201).json({ data: ticketsData, message: 'tickets' });
    } catch (error) {
      next(error);
    }
  };

  public createTicket = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketData = req.body;
      ticketData.createdBy = req.user._id;
      const ticket = await this.ticket.newTicket(ticketData);
      res.status(201).json({ data: ticket, message: 'Ticket creation successfull' });
    } catch (error) {
      next(error);
    }
  };
}
