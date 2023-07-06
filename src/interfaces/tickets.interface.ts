import { Comment } from './comments.interface';

export interface Ticket {
  _id?: string;
  title: string;
  description: string;
  status?: string;
  priority: string;
  createdBy: string;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
