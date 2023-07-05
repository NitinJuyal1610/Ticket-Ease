export interface Ticket {
  _id?: string;
  title: string;
  description: string;
  status?: string;
  priority: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
