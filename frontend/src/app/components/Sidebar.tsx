import { NavLink, useNavigate, useMatch } from 'react-router';
import { Home, Ticket, Users, LogOut, PlusCircle, FileText, MessageSquare, LucideIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  end?: boolean;
  isSubItem?: boolean;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const matchById = useMatch('/agent/:id');
  const matchByComments = useMatch('/agent/:id/comments');
  const currentAgentTicketId = matchByComments?.params?.id ?? matchById?.params?.id ?? null;

  const getMenuItems = (): MenuItem[] => {
    if (user?.role === 'Admin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard', end: true },
        { icon: Ticket, label: 'Tickets', path: '/tickets', end: true },
        { icon: Users, label: 'Users', path: '/users', end: true },
      ];
    } else if (user?.role === 'Agent') {
      const items: MenuItem[] = [
        { icon: Home, label: 'Dashboard', path: '/dashboard', end: true },
        { icon: Ticket, label: 'Assigned Tickets', path: '/agent', end: true },
      ];

      if (currentAgentTicketId) {
        items.push(
          { icon: FileText, label: 'Ticket Details', path: `/agent/${currentAgentTicketId}`, end: true, isSubItem: true },
          { icon: MessageSquare, label: 'Comments', path: `/agent/${currentAgentTicketId}/comments`, end: true, isSubItem: true }
        );
      }

      return items;
    } else {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard', end: true },
        { icon: Ticket, label: 'My Tickets', path: '/tickets', end: true },
        { icon: PlusCircle, label: 'Create Ticket', path: '/tickets/create', end: true },
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="fixed left-2 md:left-6 top-2 md:top-6 bottom-2 md:bottom-6 w-16 md:w-20 backdrop-blur-[16px] bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.2)] rounded-[32px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] flex flex-col items-center py-[33px] px-px">
      {/* Logo */}
      <div className="mb-10">
        <div className="w-12 h-12 rounded-full bg-[#10b981] flex items-center justify-center shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
          <Ticket className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col w-full px-2 md:px-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const nextItem = menuItems[index + 1];
          const isLastSubItem = item.isSubItem && !nextItem?.isSubItem;

          return (
            <div
              key={item.label}
              className={item.isSubItem ? 'flex items-center relative' : 'mb-5'}
            >
              {/* Vertical connector line */}
              {item.isSubItem && (
                <div className="flex flex-col items-center mr-2 self-stretch">
                  <div className="w-px flex-1 bg-emerald-300/50" />
                  {isLastSubItem && <div className="w-px h-0 bg-transparent" />}
                </div>
              )}

              {/* Horizontal branch line */}
              {item.isSubItem && (
                <div className="w-3 h-px bg-emerald-300/50 mr-1 flex-shrink-0" />
              )}

              <NavLink
                to={item.path}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center justify-center transition-all my-1.5 ${
                    item.isSubItem ? 'w-8 h-8 rounded-2xl' : 'w-12 h-12 rounded-full'
                  } ${
                    isActive
                      ? 'bg-emerald-500/80 backdrop-blur-sm text-white shadow-md border border-emerald-400/30'
                      : item.isSubItem
                      ? 'bg-white/20 backdrop-blur-sm text-[#3C4A42] hover:bg-white/30 border border-white/20'
                      : 'bg-white/20 text-[#3C4A42] hover:bg-white/30'
                  }`
                }
              >
                <Icon className={item.isSubItem ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]'} />
              </NavLink>
            </div>
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
