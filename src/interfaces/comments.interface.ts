import { Types } from 'mongoose';
import { User } from './users.interface';

export interface Comment {
  id?: Types.ObjectId;
  comment: string;
  author: Types.ObjectId | User;
  createdAt: Date;
}
