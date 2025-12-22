import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, Shield, UserPlus, Trash2, Mail } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  email: string;
  role_name: string;
  role_id: string;
  branch_name: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

export function Users() {
  const { currentBranch, currentRole, user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized = currentRole?.name?.toLowerCase() === 'owner' || currentRole?.name?.toLowerCase() === 'admin';

  useEffect(() => {
    if (currentBranch) {
      loadUsers();
      loadRoles();
    }
  }, [currentBranch]);

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
      if (data && data.length > 0) {
        setSelectedRoleId(data.find(r => r.name === 'Kasir')?.id || data[0].id);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadUsers = async () => {
    if (!currentBranch) return;

    try {
      const { data, error } = await supabase
        .from('user_branch_roles')
        .select(`
          user_id,
          role_id,
          created_at,
          branch:branches(name),
          role:roles(name)
        `)
        .eq('branch_id', currentBranch.id);

      if (error) throw error;

      const userIds = [...new Set((data || []).map((item: any) => item.user_id))];

      let userMetadata: any[] = [];
      if (userIds.length > 0) {
        const { data: metadata } = await supabase
          .from('users_metadata')
          .select('user_id, email, full_name')
          .in('user_id', userIds);
        userMetadata = metadata || [];
      }

      const usersWithRoles: UserWithRole[] = (data || []).map((item: any) => {
        const metadata = userMetadata?.find(u => u.user_id === item.user_id);
        return {
          user_id: item.user_id,
          email: metadata?.email || 'Unknown',
          role_name: item.role?.name || 'No Role',
          role_id: item.role_id,
          branch_name: item.branch?.name || '',
          created_at: item.created_at
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !selectedRoleId) return;

    setSubmitting(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: inviteEmail,
        password: invitePassword,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: metadataError } = await supabase
          .from('users_metadata')
          .insert({
            user_id: authData.user.id,
            email: inviteEmail
          });

        if (metadataError) {
          console.error('Error creating user metadata:', metadataError);
        }

        const { error: roleError } = await supabase
          .from('user_branch_roles')
          .insert({
            user_id: authData.user.id,
            branch_id: currentBranch.id,
            role_id: selectedRoleId
          });

        if (roleError) throw roleError;
      }

      alert(`User ${inviteEmail} has been invited successfully!`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInvitePassword('');
      loadUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      alert(error.message || 'Failed to invite user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUser = async (userId: string, roleId: string) => {
    if (!currentBranch) return;
    if (userId === user?.id) {
      alert('You cannot remove yourself');
      return;
    }

    if (!confirm('Are you sure you want to remove this user from the branch?')) return;

    try {
      const { error } = await supabase
        .from('user_branch_roles')
        .delete()
        .eq('user_id', userId)
        .eq('branch_id', currentBranch.id)
        .eq('role_id', roleId);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user');
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'owner':
        return 'bg-red-100 text-red-700';
      case 'admin':
        return 'bg-blue-100 text-blue-700';
      case 'estimator':
        return 'bg-violet-100 text-violet-700';
      case 'kasir':
        return 'bg-green-100 text-green-700';
      case 'produksi':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to access this page.</p>
          <p className="text-sm text-slate-500 mt-2">Only owners and admins can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">Manage user access and roles for {currentBranch?.name}</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Invite User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Added</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((userData) => (
                <tr key={`${userData.user_id}-${userData.role_id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{userData.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(userData.role_name)}`}>
                      <Shield className="w-3 h-3" />
                      {userData.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(userData.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleRemoveUser(userData.user_id, userData.role_id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={userData.user_id === user?.id || userData.role_name.toLowerCase() === 'owner'}
                      title="Remove from branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No users found</p>
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Invite New User</h2>
              <p className="text-sm text-slate-600 mt-1">Add a new user to this branch</p>
            </div>
            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInvitePassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Inviting...' : 'Invite User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
