import { Comment } from './comments.interface';

export interface Ticket {
  _id?: string;
  title: string;
  description: string;
  status?: string;
  priority: string;
  createdBy: string;
  category: string;
  comments: Comment[];
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
