import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import { successResponse } from '../utils/apiResponse';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await AuthService.registerUser(name, email, password, role);
    res.status(201).json(successResponse(result, 'Registration successful'));
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(email, password);
    res.status(200).json(successResponse(result, 'Login successful'));
  } catch (err) { next(err); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await AuthService.getMe(req.user._id.toString());
    res.status(200).json(successResponse(user, 'Profile fetched'));
  } catch (err) { next(err); }
};

