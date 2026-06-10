import mongoose from 'mongoose';
import UserModel, { IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { GetAllUsersQueryDTO, UpdateUserDTO, UpdateProfileDTO } from '../types/dtos';
import { createAuditLog } from './auditLog.service';

export const getAllUsers = async (query: GetAllUsersQueryDTO) => {
  const { search, role, page = 1, limit = 10 } = query;
  const filter: mongoose.FilterQuery<IUser> = {};
  
  if (role && role !== 'All') {
    filter.role = role;
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    UserModel.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  };
};

export const getUserById = async (id: string) => {
  const user = await UserModel.findById(id).select('-password');
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateUser = async (id: string, data: UpdateUserDTO) => {
  const user = await UserModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password');
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const deleteUser = async (id: string) => {
  const user = await UserModel.findByIdAndDelete(id);
  if (!user) throw new AppError('User not found', 404);
};

export const updateUserRole = async (id: string, role: string, adminId: string) => {
  // Fetch existing user to capture previous role
  const existingUser = await UserModel.findById(id).select('-password');
  if (!existingUser) throw new AppError('User not found', 404);

  const previousRole = existingUser.role;

  const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select('-password');
  if (!user) throw new AppError('User not found', 404);

  await createAuditLog({
    action: 'USER_ROLE_CHANGED',
    performedBy: adminId,
    targetType: 'User',
    targetId: id,
    changes: { from: previousRole, to: role },
    metadata: { userName: user.name, userEmail: user.email },
  });

  return user;
};

export const updateUserStatus = async (id: string, isActive: boolean, adminId: string) => {
  // Fetch existing user to capture previous status
  const existingUser = await UserModel.findById(id).select('-password');
  if (!existingUser) throw new AppError('User not found', 404);

  const previousStatus = existingUser.isActive;

  const user = await UserModel.findByIdAndUpdate(id, { isActive }, { new: true }).select('-password');
  if (!user) throw new AppError('User not found', 404);

  await createAuditLog({
    action: 'USER_STATUS_CHANGED',
    performedBy: adminId,
    targetType: 'User',
    targetId: id,
    changes: { from: previousStatus, to: isActive },
    metadata: { userName: user.name, userEmail: user.email },
  });

  return user;
};

export const getAgents = async () => {
  return UserModel.find({ role: 'Agent', isActive: true }).select('_id name email');
};

export const updateProfile = async (userId: string, data: UpdateProfileDTO) => {
  const user = await UserModel.findByIdAndUpdate(userId, data, { new: true, runValidators: true }).select('-password');
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await UserModel.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);
  user.password = newPassword;
  await user.save();
};
