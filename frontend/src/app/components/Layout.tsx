import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Plus, Search, Settings, User, Lock, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfile, changePassword } from '../../store/slices/authSlice';
import Sidebar from './Sidebar';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';

const getInitials = (name?: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

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
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors } } = useForm<ProfileFormData>({
    defaultValues: { name: user?.name || '', email: user?.email || '' }
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<PasswordFormData>();

  const onUpdateProfile = async (data: ProfileFormData) => {
    const result = await dispatch(updateProfile(data));
    if (updateProfile.fulfilled.match(result)) {
      toast.success("Profile updated successfully");
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const result = await dispatch(changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }));
    if (changePassword.fulfilled.match(result)) {
      toast.success("Password changed successfully");
      resetPassword();
    }
  };

  return (
    <DialogContent className="max-w-md bg-white/95 backdrop-blur-lg border border-white/40 rounded-3xl p-6 shadow-2xl transition-all duration-300">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-2xl font-bold tracking-tight text-gray-800">User Settings</DialogTitle>
        <p className="text-sm text-gray-500">Manage your profile details and security.</p>
      </DialogHeader>

      {/* Tabs Menu */}
      <div className="flex bg-gray-100/60 p-1.5 rounded-2xl mb-6 border border-gray-200/30">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-emerald-600 shadow-sm border border-gray-100'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white/20'
          }`}
        >
          <User className="w-4 h-4" />
          Profile Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white text-emerald-600 shadow-sm border border-gray-100'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white/20'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'profile' ? (
          <div className="space-y-5">
            {/* User Profile Card */}
            <div className="flex flex-col items-center p-5 bg-gradient-to-b from-white/60 to-white/40 border border-white/30 rounded-2xl shadow-sm">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md text-2xl font-bold mb-3 border-2 border-white">
                {getInitials(user?.name)}
              </div>
              <h3 className="font-semibold text-lg text-gray-850">{user?.name}</h3>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  user?.role === 'Admin'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : user?.role === 'Agent'
                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {user?.role}
                </span>
                {user?.createdAt && (
                  <span className="px-3 py-0.5 rounded-full text-[10px] text-gray-550 bg-gray-50 border border-gray-100 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    Joined {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner text-gray-800"
                  {...registerProfile('name', { required: 'Name is required' })}
                />
                {profileErrors.name && <span className="text-xs text-red-500 mt-1 block">{profileErrors.name.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner text-gray-800"
                  {...registerProfile('email', { required: 'Email is required' })}
                />
                {profileErrors.email && <span className="text-xs text-red-500 mt-1 block">{profileErrors.email.message}</span>}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Update Profile
              </button>
            </form>
          </div>
        ) : (
          /* Password Form */
          <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner text-gray-800"
                {...registerPassword('currentPassword', { required: 'Current password is required' })}
              />
              {passwordErrors.currentPassword && <span className="text-xs text-red-500 mt-1 block">{passwordErrors.currentPassword.message}</span>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner text-gray-800"
                {...registerPassword('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
              />
              {passwordErrors.newPassword && <span className="text-xs text-red-500 mt-1 block">{passwordErrors.newPassword.message}</span>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner text-gray-800"
                {...registerPassword('confirmPassword', { required: 'Please confirm your new password' })}
              />
              {passwordErrors.confirmPassword && <span className="text-xs text-red-500 mt-1 block">{passwordErrors.confirmPassword.message}</span>}
            </div>
            <button
              type="submit"
              className="w-full py-2.5 mt-2 bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Change Password
            </button>
          </form>
        )}
      </div>
    </DialogContent>
  );
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user } = useAppSelector((s) => s.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const getUserInitials = () => getInitials(user?.name);

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
