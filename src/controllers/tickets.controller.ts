import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { Ticket, UpdateTicket } from '@/interfaces/tickets.interface';
import { TicketsService } from '@/services/tickets.service';
import { RequestWithUser, RequestQuery } from '@/interfaces/auth.interface';
import { sendMail } from '@/utils/notification';

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
      await sendMail(req.user.email, 'Ticket Creation', `<h3>New Ticket Created!<h3>`);

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
      await sendMail(req.user.email, 'Ticket Updation', `<h3>Ticket Updated Successfully!<h3>`);

      res.status(201).json({ data: updatedTicket, message: 'Ticket update successfull' });
    } catch (error) {
      next(error);
    }
  };

  public claimTicket = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;
      const ticket = await this.ticket.assignTicket(ticketId, req.user);

      //email for support agent
      await sendMail(req.user.email, 'Ticket Claimed', `<h5>Successfully Claimed Ticket with Id: <p>${ticket._id}</p>!<h5>`);

      if (ticket.createdBy && typeof ticket.createdBy == 'object' && 'email' in ticket.createdBy) {
        await sendMail(
          ticket.createdBy.email,
          'Ticket Assigned',
          `<h5>Ticket with, Id: <p> ${ticket._id}</p> assigned to Agent with email ${req.user.email}<h5>`,
        );
      }

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

      const ticket = await this.ticket.changeAgent(ticketId, newAgentId, req.user);

      //email for prev agent
      await sendMail(req.user.email, 'Ticket Reassigned Successfully', `<h5>Successfully Reassigned Ticket with Id: <p>${ticket._id}</p><h5>`);

      //email for new agent
      if (ticket.assignedAgent && typeof ticket.assignedAgent == 'object' && 'email' in ticket.assignedAgent) {
        await sendMail(
          ticket.assignedAgent.email,
          'Ticket Assigned',
          `<h5>Ticket with, Id: <p> ${ticket._id}</p>Assigned to you by the Agent with email ${req.user.email}<h5>`,
        );
      }

      //email for user
      if (ticket.createdBy && typeof ticket.createdBy == 'object' && 'email' in ticket.createdBy) {
        await sendMail(ticket.createdBy.email, 'New Agent Assigned', `<h5>Ticket Assigned to a new Agent<h5>`);
      }

      res.status(201).json({ data: ticket, message: 'Ticket reassign successfull' });
    } catch (error) {
      next(error);
    }
  };

  public resolveTicket = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;

      const ticket: Ticket = await this.ticket.closeTicket(ticketId, req.user);
      //email for support agent
      await sendMail(req.user.email, 'Ticket Closed', `<h5>Successfully Closed Ticket with Id: <p>${ticket._id}</p>!<h5>`);

      if (ticket.createdBy && typeof ticket.createdBy == 'object' && 'email' in ticket.createdBy) {
        await sendMail(
          ticket.createdBy.email,
          'Ticket Closed',
          `<h5>Ticket with, Id: <p> ${ticket._id}</p> Closed by the Agent with email ${req.user.email}<h5>`,
        );
      }
      res.status(201).json({ message: 'Ticket resolved', data: ticket });
    } catch (err) {
      next(err);
    }
  };

  public addComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;
      const comment = req.body.text;
      const ticket = await this.ticket.createComment(ticketId, comment, req.user);

      //email for user/owner of ticket
      if (ticket.createdBy && typeof ticket.createdBy == 'object' && 'email' in ticket.createdBy) {
        await sendMail(ticket.createdBy.email, 'New Comment Added', `<h5>New Comment Added on the Ticket with Id: <p>${ticket._id}</p><h5>`);
      }
      //email for support agent
      if (ticket.assignedAgent && typeof ticket.assignedAgent == 'object' && 'email' in ticket.assignedAgent) {
        await sendMail(ticket.assignedAgent.email, 'New Comment Added', `<h5>New Comment Added on the Ticket with Id: <p>${ticket._id}</p> <h5>`);
      }
      res.status(201).json({ data: ticket, message: 'Ticket comment added' });
    } catch (error) {
      next(error);
    }
  };

  public getCommentsById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;
      const comments = await this.ticket.getComments(ticketId, req.user);
      res.status(200).json({ data: comments, message: 'Ticket comments' });
    } catch (error) {
      next(error);
    }
  };

  public deleteTicket = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;
      const ticket = await this.ticket.findAndDeleteTicket(ticketId, req.user);

      //email for user/owner of ticket
      //agent and admin can delete the ticket
      if (ticket.createdBy && typeof ticket.createdBy == 'object' && 'email' in ticket.createdBy) {
        await sendMail(
          ticket.createdBy.email,
          'Ticket Deleted',
          `<h5>Ticket with Id: <p>${ticket._id}</p> Deleted by the admin/agent with email ${req.user.email} <h5>`,
        );
      }

      //email for support agent
      await sendMail(req.user.email, 'Ticket Deleted', `<h5> Ticket with Id: <p>${ticket._id}</p> Deleted <h5>`);

      res.status(200).json({ data: ticket, message: 'Ticket deleted' });
    } catch (error) {
      next(error);
    }
  };

  public getTicketLogs = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.id;
      const history = await this.ticket.getLogs(ticketId, req.user);
      res.status(200).json({ data: history, message: 'Ticket history' });
    } catch (error) {
      next(error);
    }
  };
}
