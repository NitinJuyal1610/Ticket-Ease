import { model, Schema, Document, Types } from 'mongoose';
import { TicketLog } from '@/interfaces/ticketLog.interface';

const LogSchema = new Schema(
  {
    updateType: {
      type: String,
      required: true,
    },

    updateFields: {
      type: Object,
      required: true,
    },

    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } },
);

export const TicketLogModel = model<TicketLog & Document>('TicketLog', LogSchema);
