import { useEffect, useState } from 'react';
import { Search, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchUsers, updateUser, toggleUserStatus, clearError } from '../../store/slices/usersSlice';

type RoleFilter = 'All' | 'Admin' | 'Agent' | 'User';

export default function UserManagement() {
  const dispatch = useAppDispatch();
  const { users, loading, error, page, pages, total } = useAppSelector((s) => s.users);
  const { user: currentUser } = useAppSelector((s) => s.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users when filters or page changes
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(roleFilter !== 'All' && { role: roleFilter }),
    };
    dispatch(fetchUsers(params));
  }, [dispatch, currentPage, debouncedSearch, roleFilter]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    await dispatch(updateUser({ id: userId, data: { role: newRole } }));
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    await dispatch(toggleUserStatus({ id: userId, isActive }));
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const totalUsers = total;
  // Calculate approximate counts based on current list or keep simple static labels
  const totalAgents = users.filter((u) => u.role === 'Agent').length;
  const totalAdmins = users.filter((u) => u.role === 'Admin').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl mb-2">User Management</h1>
            <p className="text-gray-600">Manage users and their roles</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 border border-white/30 backdrop-blur-md text-sm text-gray-600">
            <Info className="w-4 h-4 text-emerald-500" />
            Users register through the registration page
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Search + Role Filter */}
        <GlassCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as RoleFilter);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Agent">Agent</option>
              <option value="User">User</option>
            </select>
          </div>
        </GlassCard>

        {/* Users Table */}
        {loading && users.length === 0 ? (
          <GlassCard>
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Loading users...</p>
            </div>
          </GlassCard>
        ) : users.length === 0 ? (
          <GlassCard>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">No users found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filter</p>
            </div>
          </GlassCard>
        ) : (
          <>
            <GlassCard padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/30">
                      <th className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide">User</th>
                      <th className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide">Email</th>
                      <th className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide">Role</th>
                      <th className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide">Joined</th>
                      <th className="text-left p-6 text-sm text-gray-600 uppercase tracking-wide">Change Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, index) => (
                      <tr
                        key={u._id}
                        className={`border-b border-white/20 hover:bg-white/30 transition-all ${index % 2 === 0 ? 'bg-white/10' : ''
                          }`}
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                              {getInitials(u.name)}
                            </div>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-6 text-gray-600">{u.email}</td>
                        <td className="p-6">
                          <div className="flex flex-col gap-1.5 items-start">
                            <Badge variant={u.role}>{u.role}</Badge>
                            <Badge variant={u.isActive ? 'Active' : 'Inactive'}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-6 text-gray-600">
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="px-4 py-2 rounded-xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Agent">Agent</option>
                              <option value="User">User</option>
                            </select>
                            {u._id !== currentUser?._id && (
                              <button
                                onClick={() => handleToggleStatus(u._id, !u.isActive)}
                                className={`px-4 py-2 rounded-xl text-white font-medium text-sm transition-all shadow-md hover:shadow-lg ${u.isActive
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-emerald-500 hover:bg-emerald-600'
                                  }`}
                              >
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Page {page} of {pages}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl bg-white/50 border border-white/30 backdrop-blur-sm hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))}
                    disabled={currentPage === pages}
                    className="p-3 rounded-xl bg-white/50 border border-white/30 backdrop-blur-sm hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-4xl mb-2">{totalUsers}</div>
              <div className="text-gray-600 text-sm uppercase tracking-wide">Total Users</div>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="text-center">
              <div className="text-4xl mb-2">{totalAgents}</div>
              <div className="text-gray-600 text-sm uppercase tracking-wide">Agents (this page)</div>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="text-center">
              <div className="text-4xl mb-2">{totalAdmins}</div>
              <div className="text-gray-600 text-sm uppercase tracking-wide">Admins (this page)</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
