import { Types } from 'mongoose';
import { User } from './users.interface';
export interface TicketLog {
  _id?: string;
  userId: Types.ObjectId | User;
  updateFields: object;
  updateType: string;
}
