import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Plus, Search, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfile, changePassword } from '../../store/slices/authSlice';
import Sidebar from './Sidebar';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';

interface LayoutProps {
  children: ReactNode;
}

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function SettingsModal() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors } } = useForm<ProfileFormData>({
    defaultValues: { name: user?.name || '', email: user?.email || '' }
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<PasswordFormData>();

  const onUpdateProfile = async (data: ProfileFormData) => {
    await dispatch(updateProfile(data));
  };

  const onChangePassword = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const result = await dispatch(changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }));
    if (changePassword.fulfilled.match(result)) {
      resetPassword();
    }
  };

  return (
    <DialogContent className="max-w-md bg-white/90 backdrop-blur-md border border-white/30 rounded-3xl p-8 shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold mb-1">User Settings</DialogTitle>
        <p className="text-sm text-gray-500 mb-6">Manage your profile details and security.</p>
      </DialogHeader>

      <div className="space-y-6">
        {/* Profile Form */}
        <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
          <h4 className="font-semibold text-lg border-b border-gray-100 pb-2">Profile Information</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-xl bg-white/50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              {...registerProfile('name', { required: 'Name is required' })}
            />
            {profileErrors.name && <span className="text-xs text-red-500">{profileErrors.name.message}</span>}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-xl bg-white/50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              {...registerProfile('email', { required: 'Email is required' })}
            />
            {profileErrors.email && <span className="text-xs text-red-500">{profileErrors.email.message}</span>}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Update Profile
          </button>
        </form>

        {/* Password Form */}
        <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4 pt-4 border-t border-gray-100">
          <h4 className="font-semibold text-lg border-b border-gray-100 pb-2">Security</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Current Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-xl bg-white/50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              {...registerPassword('currentPassword', { required: 'Current password is required' })}
            />
            {passwordErrors.currentPassword && <span className="text-xs text-red-500">{passwordErrors.currentPassword.message}</span>}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-xl bg-white/50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              {...registerPassword('newPassword', {
                required: 'New password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
            />
            {passwordErrors.newPassword && <span className="text-xs text-red-500">{passwordErrors.newPassword.message}</span>}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-xl bg-white/50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              {...registerPassword('confirmPassword', { required: 'Please confirm your new password' })}
            />
            {passwordErrors.confirmPassword && <span className="text-xs text-red-500">{passwordErrors.confirmPassword.message}</span>}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Change Password
          </button>
        </form>
      </div>
    </DialogContent>
  );
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user } = useAppSelector((s) => s.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const getUserInitials = () => {
    if (!user) return 'U';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex relative pl-32">
      {/* Background Blur Decorations */}
      <div className="fixed inset-0 pointer-events-none opacity-40 -z-10">
        <div className="absolute top-[51.5px] right-32 w-[500px] h-[500px] bg-[#10b981] rounded-full blur-[80px] opacity-30" />
        <div className="absolute bottom-[103px] left-16 w-[600px] h-[600px] bg-[#e8ddd3] rounded-full blur-[90px] opacity-50" />
        <div className="absolute top-[412px] left-64 w-[400px] h-[400px] bg-[#d4d9cc] rounded-full blur-[70px] opacity-40" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pr-12 py-6">
        {/* Top Navigation Bar */}
        <header className="backdrop-blur-[24px] bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.3)] rounded-[24px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] mb-6">
          <div className="flex items-center justify-between px-[33px] py-[17px]">
            {/* Search and Navigation */}
            <div className="flex items-center gap-8">
              {/* Search Bar */}
              <div className="backdrop-blur-[24px] bg-[rgba(255,255,255,0.3)] border border-[rgba(255,255,255,0.2)] rounded-full px-[17px] py-[9px] flex items-center gap-2">
                <Search className="w-[15px] h-[15px] text-[#10b981]" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 outline-none text-sm text-[#6b7280] placeholder:text-[#6b7280] w-48"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Settings Icon using Radix Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#3C4A42] hover:bg-[rgba(255,255,255,0.2)] transition-all cursor-pointer">
                    <Settings className="w-5 h-5" />
                  </button>
                </DialogTrigger>
                <SettingsModal />
              </Dialog>

              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] text-xs font-semibold">
                {getUserInitials()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>

        {/* Floating Action Button */}
        {(user?.role === 'Admin' || user?.role === 'User') && location.pathname !== '/tickets/create' && (
          <Link
            to="/tickets/create"
            className="fixed bottom-[73px] right-[97px] w-16 h-16 rounded-full bg-[#10b981] flex items-center justify-center shadow-[0px_20px_25px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform"
          >
            <Plus className="w-[17.5px] h-[17.5px] text-white" />
          </Link>
        )}
      </div>
    </div>
  );
}
