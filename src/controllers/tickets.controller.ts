import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { Ticket, UpdateTicket } from '@/interfaces/tickets.interface';
import { TicketsService } from '@/services/tickets.service';
import { RequestWithUser, RequestQuery } from '@/interfaces/auth.interface';
import { transporter } from '@/utils/transporter';

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
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: req.user.email,
        subject: 'Ticket Creation',
        html: `<h4>New Ticket Created!><h4>`,
      });

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
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: req.user.email,
        subject: 'Ticket Updation',
        html: `<h4>Ticket Updated Successfully!<h4>`,
      });

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
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: req.user.email,
        subject: 'Ticket Claimed',
        html: `<h5>Successfully Claimed Ticket with Id: <p>${ticket._id}</p> !<h5>`,
      });

      if (typeof ticket.createdBy == 'object' && 'email' in ticket.createdBy) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: ticket.createdBy.email,
          subject: 'Ticket Assigned',
          html: `<h5>Ticket with, Id: <p> ${ticket._id}</p> assigned to Agent with email ${req.user.email}<h5>`,
        });
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
      const agentId = req.user._id;
      const ticket = await this.ticket.changeAgent(ticketId, newAgentId, agentId);

      //email for prev agent
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: req.user.email,
        subject: 'Ticket Reassigned Successfully',
        html: `<h5>Successfully Reassigned Ticket with Id: <p>${ticket._id}</p> !<h5>`,
      });

      //email for new agent
      if (typeof ticket.assignedAgent == 'object' && 'email' in ticket.assignedAgent) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: ticket.assignedAgent.email,
          subject: 'Ticket Assigned',
          html: `<h5>Ticket with, Id: <p> ${ticket._id}</p> Assigned to you by the Agent with email ${req.user.email}<h5>`,
        });
      }

      //email for user
      if (typeof ticket.createdBy == 'object' && 'email' in ticket.createdBy) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: ticket.createdBy.email,
          subject: 'New Agent Assigned',
          html: `<h5>Ticket Assigned to a new Agent<h5>`,
        });
      }

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
      //email for support agent
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: req.user.email,
        subject: 'Ticket Closed',
        html: `<h5>Successfully Closed Ticket with Id: <p>${ticket._id}</p> !<h5>`,
      });

      if (typeof ticket.createdBy == 'object' && 'email' in ticket.createdBy) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: ticket.createdBy.email,
          subject: 'Ticket Closed',
          html: `<h5>Ticket with, Id: <p> ${ticket._id}</p> Closed by the Agent with email ${req.user.email}<h5>`,
        });
      }
      res.status(201).json({ message: 'Ticket resolved', data: ticket });
    } catch (err) {
      next(err);
    }
  };
}
