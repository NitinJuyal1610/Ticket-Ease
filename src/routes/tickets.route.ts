import { Router } from 'express';
import { TicketController } from '@controllers/tickets.controller';
import { CreateTicketDto, UpdateTicketDto } from '@dtos/tickets.dto';
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
    this.router.get(`${this.path}`, AuthMiddleware(['admin', 'support']), this.ticket.getTickets);
    this.router.get(`${this.path}/:id`, AuthMiddleware(['admin', 'support', 'user']), this.ticket.getTicketById);
    this.router.post(`${this.path}`, AuthMiddleware(['user']), ValidationMiddleware(CreateTicketDto, true), this.ticket.createTicket);
    this.router.put(`${this.path}/:id`, AuthMiddleware(['admin', 'user']), ValidationMiddleware(UpdateTicketDto, true), this.ticket.updateTicket);
    // this.router.delete(`${this.path}/:id`, this.user.deleteUser);
  }
}
