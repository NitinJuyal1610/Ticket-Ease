import { Comment } from './comments.interface';
import { Types } from 'mongoose';
import { User } from './users.interface';
import { TicketLog } from './ticketLog.interface';

export interface Ticket {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  status?: string;
  priority: string;
  createdBy: Types.ObjectId | User;
  category: string;
  assignedAgent: Types.ObjectId | User;
  comments: Comment[] | Types.ObjectId[];
  history: TicketLog[] | Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateTicket {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
}
