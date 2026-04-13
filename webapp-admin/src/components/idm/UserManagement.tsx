import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, KeyRound } from 'lucide-react';
import { idmApi } from '../../lib/idmApi';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tenantId?: string;
  password?: string;
};

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<User>>({});

  const loadUsers = async () => {
    setLoading(true);
    try {
      const resp = await idmApi.getUsers(search);
      // Flowable endpoints might return { data: [...] } or the array itself
      setUsers(resp?.data || resp || []);
    } catch (err) {
      console.error(err);
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await idmApi.updateUser(editingUser.id, formData);
      } else {
        await idmApi.createUser(formData as User);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Failed to save user', error);
      alert('Failed to save user. Check console for details.');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await idmApi.deleteUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user', error);
      alert('Failed to delete user.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !formData.password) return;
    try {
      await idmApi.updateUser(editingUser.id, { password: formData.password });
      setIsPasswordModalOpen(false);
      alert('Password updated successfully');
    } catch (error) {
      console.error('Failed to change password', error);
      alert('Failed to update password.');
    }
  };

  const openEditModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        tenantId: user.tenantId
      });
    } else {
      setEditingUser(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const openPasswordModal = (user: User) => {
    setEditingUser(user);
    setFormData({ password: '' });
    setIsPasswordModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-xl shadow-sm border border-outline-variant/30">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-highest rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => openEditModal()}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Create User
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container sticky top-0 z-10 z-10 box-border border-b border-outline-variant/30">
              <tr>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface uppercase tracking-wider">First Name</th>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface uppercase tracking-wider">Last Name</th>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-highest/50 transition-colors group">
                    <td className="px-6 py-4 text-body-md text-on-surface font-medium">{user.id}</td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">{user.firstName}</td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">{user.lastName}</td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">{user.email}</td>
                    <td className="px-6 py-4">
                       <span className="px-2.5 py-1 rounded-full text-label-sm font-semibold bg-tertiary-container text-on-tertiary-container">
                        {user.tenantId || 'Default'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors bg-surface-container rounded-lg"
                          title="Change Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors bg-surface-container rounded-lg"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-on-surface-variant hover:text-error transition-colors bg-surface-container rounded-lg"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="text-title-lg font-bold text-on-surface">
                {editingUser ? 'Edit User' : 'Create User'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {!editingUser && (
                <div>
                  <label className="block text-label-md font-medium text-on-surface mb-1">User ID *</label>
                  <input
                    required
                    type="text"
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-medium text-on-surface mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-medium text-on-surface mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-md font-medium text-on-surface mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-label-md font-medium text-on-surface mb-1">Password *</label>
                  <input
                    required
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30"
                  />
                </div>
              )}
              <div>
                <label className="block text-label-md font-medium text-on-surface mb-1">Tenant ID (Optional)</label>
                <input
                  type="text"
                  value={formData.tenantId || ''}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/30 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors font-medium border border-outline-variant/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors font-medium shadow-sm hover:shadow"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-outline-variant/30">
              <h2 className="text-title-lg font-bold text-on-surface">Change Password</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">for {editingUser?.id}</p>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-label-md font-medium text-on-surface mb-1">New Password *</label>
                <input
                  required
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors font-medium shadow-sm hover:shadow"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
