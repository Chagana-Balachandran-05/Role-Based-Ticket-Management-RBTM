import { NavLink, useNavigate } from 'react-router';
import { Home, Ticket, Users, LogOut, PlusCircle, FileText, MessageSquare } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export default function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const getMenuItems = () => {
    if (user?.role === 'Admin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Ticket, label: 'Tickets', path: '/tickets' },
        { icon: Users, label: 'Users', path: '/users' },
      ];
    } else if (user?.role === 'Agent') {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Ticket, label: 'Assigned Tickets', path: '/tickets' },
        { icon: FileText, label: 'Ticket Details', path: '/tickets' },
        { icon: MessageSquare, label: 'Comments', path: '/tickets#comments' },
      ];
    } else {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Ticket, label: 'My Tickets', path: '/tickets' },
        { icon: PlusCircle, label: 'Create Ticket', path: '/tickets/create' },
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="fixed left-6 top-6 bottom-6 w-20 backdrop-blur-[16px] bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.2)] rounded-[32px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] flex flex-col items-center py-[33px] px-px">
      {/* Logo */}
      <div className="mb-10">
        <div className="w-12 h-12 rounded-full bg-[#10b981] flex items-center justify-center shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
          <Ticket className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col gap-6 w-full px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#10b981] text-white shadow-md'
                    : 'bg-[rgba(255,255,255,0.2)] text-[#3C4A42] hover:bg-[rgba(255,255,255,0.3)]'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.2)] text-[#BA1A1A] transition-all hover:bg-[rgba(255,255,255,0.3)] cursor-pointer"
      >
        <LogOut className="w-[18px] h-[18px]" />
      </button>
    </aside>
  );
}
