import { model, Schema, Document } from 'mongoose';
import { Ticket } from '@interfaces/tickets.interface';

const TicketSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'open',
    },
    priority: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comments: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Comment',
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const TicketModel = model<Ticket & Document>('Ticket', TicketSchema);
