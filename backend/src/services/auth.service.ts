import jwt from 'jsonwebtoken';
import UserModel from '../models/User.model';
import { AppError } from '../utils/AppError';
import { RegisterUserDTO } from '../types/dtos';

const signToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const registerUser = async (data: RegisterUserDTO) => {
  const { name, email, password } = data;
  const existing = await UserModel.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await UserModel.create({
    name,
    email,
    password,
    role: 'User', // Forcibly set user role on registration
  });

  const token = signToken(user._id.toString(), user.role);
  return {
    token,
    user: {
      _id: user._id.toString(),
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('Account deactivated. Contact admin.', 403);

  const token = signToken(user._id.toString(), user.role);
  return {
    token,
    user: {
      _id: user._id.toString(),
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const getMe = async (userId: string) => {
  const user = await UserModel.findById(userId).select('-password');
  if (!user) throw new AppError('User not found', 404);
  return user;
};
