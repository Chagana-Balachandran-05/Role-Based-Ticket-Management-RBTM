import { Request, Response, NextFunction } from 'express';
import * as UserService from '../services/user.service';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.getAllUsers(req.query);
    res.status(200).json(successResponse(result, 'Users fetched'));
  } catch (err) { next(err); }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.status(200).json(successResponse(user, 'User fetched'));
  } catch (err) { next(err); }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role } = req.body;
    const user = await UserService.updateUser(req.params.id, { name, email, role });
    res.status(200).json(successResponse(user, 'User updated'));
  } catch (err) { next(err); }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (req.user!._id.toString() === id) {
      throw new AppError('Cannot delete self', 400);
    }
    await UserService.deleteUser(id);
    res.status(200).json(successResponse({}, 'User deleted'));
  } catch (err) { next(err); }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.updateUserRole(req.params.id, req.body.role, req.user!._id.toString());
    res.status(200).json(successResponse(user, 'Role updated'));
  } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.updateUserStatus(req.params.id, req.body.isActive, req.user!._id.toString());
    res.status(200).json(successResponse(user, 'Status updated'));
  } catch (err) { next(err); }
};

export const getAgents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await UserService.getAgents();
    res.status(200).json(successResponse(agents, 'Agents fetched'));
  } catch (err) { next(err); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.updateProfile(req.user!._id.toString(), req.body);
    res.status(200).json(successResponse(user, 'Profile updated'));
  } catch (err) { next(err); }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await UserService.changePassword(req.user!._id.toString(), req.body.currentPassword, req.body.newPassword);
    res.status(200).json(successResponse({}, 'Password changed successfully'));
  } catch (err) { next(err); }
};

