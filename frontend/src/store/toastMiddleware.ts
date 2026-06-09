import { Middleware } from '@reduxjs/toolkit';
import { toast } from 'sonner';

export const toastMiddleware: Middleware = () => (next) => (action: any) => {
  if (action && action.type && typeof action.type === 'string') {
    const isFulfilled = action.type.endsWith('/fulfilled');
    const isRejected = action.type.endsWith('/rejected');

    if (isFulfilled) {
      let message = '';
      if (action.type.includes('auth/login')) {
        message = 'Welcome back! Successfully logged in.';
      } else if (action.type.includes('auth/register')) {
        message = 'Registration successful! Please sign in.';
      } else if (action.type.includes('auth/updateProfile')) {
        message = 'Profile updated successfully!';
      } else if (action.type.includes('auth/changePassword')) {
        message = 'Password changed successfully!';
      } else if (action.type.includes('tickets/createTicket')) {
        message = 'Ticket created successfully!';
      } else if (action.type.includes('tickets/updateTicket')) {
        message = 'Ticket updated successfully!';
      } else if (action.type.includes('tickets/deleteTicket')) {
        message = 'Ticket deleted successfully!';
      } else if (action.type.includes('tickets/updateStatus')) {
        message = 'Ticket status updated successfully!';
      } else if (action.type.includes('tickets/assign')) {
        message = 'Ticket assigned successfully!';
      } else if (action.type.includes('tickets/addComment')) {
        message = 'Comment added successfully!';
      } else if (action.type.includes('users/updateUser')) {
        message = 'User role updated successfully!';
      } else if (action.type.includes('users/toggleStatus')) {
        message = 'User account status updated successfully!';
      }

      if (message) {
        toast.success(message);
      }
    } else if (isRejected) {
      // Don't show toast errors for read/fetch actions automatically
      const isFetch = action.type.includes('fetch') || action.type.includes('get');
      if (!isFetch) {
        const errorMsg = action.payload || action.error?.message || 'An error occurred';
        toast.error(errorMsg);
      }
    }
  }
  return next(action);
};
