import TicketModel from '../models/Ticket.model';
import AuditLogModel from '../models/AuditLog.model';
import { IUser } from '../models/User.model';

export const getDashboardStats = async (user: IUser) => {
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

  const getCount = (arr: Array<{ _id: string; count: number }>, id: string) => 
    arr.find(x => x._id === id)?.count || 0;

  let extraStats: Record<string, any> = {};
  if (user.role === 'Admin') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [createdToday, createdThisWeek, unassignedOpen, overdue, recentActivity] = await Promise.all([
      TicketModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      TicketModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
      TicketModel.countDocuments({ assignedTo: null, status: { $ne: 'Closed' } }),
      TicketModel.countDocuments({ status: { $in: ['Open', 'In Progress'] }, createdAt: { $lt: sevenDaysAgo } }),
      AuditLogModel.find()
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    extraStats = {
      createdToday,
      createdThisWeek,
      unassignedOpen,
      overdue,
      recentActivity,
    };
  }

  return {
    total: await TicketModel.countDocuments(filter),
    open: getCount(statusCounts, 'Open'),
    inProgress: getCount(statusCounts, 'In Progress'),
    resolved: getCount(statusCounts, 'Resolved'),
    closed: getCount(statusCounts, 'Closed'),
    byPriority: priorityCounts as Array<{ _id: string; count: number }>,
    ...extraStats,
  };
};
