import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { Ticket, UpdateTicket } from '@/interfaces/tickets.interface';
import { TicketsService } from '@/services/tickets.service';
import { RequestWithUser, RequestQuery } from '@/interfaces/auth.interface';

export class TicketController {
  public ticket = Container.get(TicketsService);
  public getTickets = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { status, priority, category, assigned, sortBy, sortOrder } = req.query as RequestQuery;
      const ticketsData: Ticket[] = await this.ticket.findAllTickets(req.user, status, priority, category, assigned, sortBy, sortOrder);
      res.status(200).json({ data: ticketsData, message: 'tickets' });
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
      res.status(200).json({ data: ticket, message: 'Ticket Retrieval successfull' });
    } catch (error) {
      next(error);
    }
  };

  public updateTicket = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
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

  public claimTicket = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;
      const ticket = await this.ticket.assignTicket(ticketId, req.user);

      if (ticket) res.status(201).json({ data: ticket, message: 'Ticket claim successfull' });
      else res.status(409).json({ data: ticket, message: 'Ticket already claimed' });
    } catch (error) {
      next(error);
    }
  };

  public getClaimedTickets = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketsData: Ticket[] = await this.ticket.findTickets(req.user);
      res.status(200).json({ data: ticketsData, message: 'Claimed tickets' });
    } catch (error) {
      next(error);
    }
  };

  public reassignTicket = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;
      const newAgentId = req.body.agentId;
      const agentId = req.user._id;

      const ticket = await this.ticket.changeAgent(ticketId, newAgentId, agentId);
      res.status(201).json({ data: ticket, message: 'Ticket reassign successfull' });
    } catch (error) {
      next(error);
    }
  };

  public resolveTicket = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;
      const agentId = req.user._id;
      const ticket: Ticket = await this.ticket.closeTicket(ticketId, agentId);

      res.status(201).json({ message: 'Ticket resolved', data: ticket });
    } catch (err) {
      next(err);
    }
  };
}
