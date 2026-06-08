import CounterModel from '../models/Counter.model';

export const generateTicketNumber = async (): Promise<string> => {
  const counter = await CounterModel.findOneAndUpdate(
    { _id: 'ticketNumber' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `TKT-${String(counter.seq).padStart(4, '0')}`;
};

