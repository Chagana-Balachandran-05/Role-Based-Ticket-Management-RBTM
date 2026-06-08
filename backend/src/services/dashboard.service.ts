import TicketModel from '../models/Ticket.model';

export const getDashboardStats = async (user: any) => {
  const filter = user.role === 'Admin' ? {} 
    : user.role === 'Agent' ? { assignedTo: user._id } 
    : { createdBy: user._id };

  const [statusCounts, priorityCounts] = await Promise.all([
    TicketModel.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    TicketModel.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
  ]);

  const getCount = (arr: any[], id: string) => arr.find(x => x._id === id)?.count || 0;

  return {
    total: await TicketModel.countDocuments(filter),
    open: getCount(statusCounts, 'Open'),
    inProgress: getCount(statusCounts, 'In Progress'),
    resolved: getCount(statusCounts, 'Resolved'),
    closed: getCount(statusCounts, 'Closed'),
    byPriority: priorityCounts,
  };
};

