import { model, Schema, Document } from 'mongoose';
import { Comment } from '@/interfaces/comments.interface';

const CommentSchema: Schema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const CommentModel = model<Comment & Document>('Comment', CommentSchema);
