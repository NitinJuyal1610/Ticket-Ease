import { Router } from 'express';
import { TicketController } from '@controllers/tickets.controller';
import { CreateTicketDto, UpdateTicketDto, CreateCommentDto } from '@dtos/tickets.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@/interfaces/middlewares/validation.middleware';
import { AuthMiddleware } from '@/interfaces/middlewares/auth.middleware';

export class TicketRoute implements Routes {
  public path = '/tickets';
  public router = Router();
  public ticket = new TicketController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware(['admin', 'support', 'user']), this.ticket.getTickets);
    this.router.get(`${this.path}/claimed`, AuthMiddleware(['admin', 'support']), this.ticket.getClaimedTickets);
    this.router.get(`${this.path}/:id`, AuthMiddleware(['admin', 'support', 'user']), this.ticket.getTicketById);
    this.router.get(`${this.path}/comments/:id`, AuthMiddleware(['admin', 'support', 'user']), this.ticket.getCommentsById);
    this.router.get(`${this.path}/history/:id`, AuthMiddleware(['admin', 'support', 'user']), this.ticket.getTicketLogs);
    this.router.put(`${this.path}/:id/reassign`, AuthMiddleware(['admin', 'support']), this.ticket.reassignTicket);
    this.router.put(`${this.path}/:id/resolve`, AuthMiddleware(['admin', 'support']), this.ticket.resolveTicket);
    this.router.post(
      `${this.path}/comment/:id`,
      AuthMiddleware(['admin', 'support', 'user']),
      ValidationMiddleware(CreateCommentDto, true),
      this.ticket.addComment,
    );

    this.router.post(`${this.path}`, AuthMiddleware(['user']), ValidationMiddleware(CreateTicketDto, true), this.ticket.createTicket);
    this.router.put(`${this.path}/:id`, AuthMiddleware(['admin', 'user']), ValidationMiddleware(UpdateTicketDto, true), this.ticket.updateTicket);
    this.router.put(`${this.path}/claim/:id`, AuthMiddleware(['admin', 'support']), this.ticket.claimTicket);
    this.router.delete(`${this.path}/:id`, AuthMiddleware(['admin', 'support']), this.ticket.deleteTicket);
  }
}
