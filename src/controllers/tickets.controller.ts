import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { Ticket, UpdateTicket } from '@/interfaces/tickets.interface';
import { TicketsService } from '@/services/tickets.service';
import { RequestWithUser } from '@/interfaces/auth.interface';

export class TicketController {
  public ticket = Container.get(TicketsService);
  public getTickets = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      console.log(req.user);
      const ticketsData: Ticket[] = await this.ticket.findAllTickets(req.user);

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

  public getTicketById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;
      const ticket = await this.ticket.getTicketById(ticketId, req.user);
      res.status(201).json({ data: ticket, message: 'Ticket Retrieval successfull' });
    } catch (error) {
      next(error);
    }
  };

  public updateTicket = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      console.log(req.user);
      const ticketId = req.params.id;
      const updateData: UpdateTicket = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        category: req.body.category,
      };

      const updatedTicket = await this.ticket.updateTicketById(ticketId, updateData, req.user);
      res.status(201).json({ data: updatedTicket, message: 'Ticket update successfull' });
    } catch (error) {
      next(error);
    }
  };
}
