import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Users, UserPlus, UserMinus } from 'lucide-react';
import { idmApi } from '../../lib/idmApi';
import { User } from './UserManagement';
import { UserSearchSelect } from './UserSearchSelect';

type Group = {
  id: string;
  name: string;
  type: string;
};

export const GroupManagement = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Group>>({});
  
  // Membership View
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [userIdToAdd, setUserIdToAdd] = useState('');

  const loadGroups = async () => {
    setLoading(true);
    try {
      const resp = await idmApi.getGroups(search);
      setGroups(resp?.data || resp || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [search]);

  useEffect(() => {
    if (selectedGroup) {
      loadMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const resp = await idmApi.getGroupMembers(groupId);
      setMembers(resp?.data || resp || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await idmApi.createGroup(formData as Group);
      setIsModalOpen(false);
      setFormData({});
      loadGroups();
    } catch (error) {
      console.error('Failed to create group', error);
      alert('Failed to create group.');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await idmApi.deleteGroup(groupId);
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      loadGroups();
    } catch (error) {
      console.error('Failed to delete group', error);
      alert('Failed to delete group.');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !userIdToAdd) return;
    try {
      if (members.some(m => m.id === userIdToAdd)) {
        alert('This user is already a member of the group.');
        return;
      }
      await idmApi.addGroupMember(selectedGroup.id, userIdToAdd);
      setUserIdToAdd('');
      loadMembers(selectedGroup.id);
    } catch (error) {
      console.error('Failed to add member', error);
      alert('Failed to add member. Please check if user ID is correct.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup || !confirm('Remove this user from the group?')) return;
    try {
      await idmApi.removeGroupMember(selectedGroup.id, userId);
      loadMembers(selectedGroup.id);
    } catch (error) {
      console.error('Failed to remove member', error);
      alert('Failed to remove member.');
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel: Groups List */}
      <div className={`flex flex-col flex-1 bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden ${selectedGroup ? 'w-1/2' : 'w-full'}`}>
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container flex justify-between items-center z-10 sticky top-0">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search groups..."
              className="w-full pl-9 pr-3 py-1.5 text-body-sm bg-surface-container-highest rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors text-label-md font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Group
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-2 space-y-2 relative">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">No groups found.</div>
          ) : (
            groups.map((group) => (
              <div 
                key={group.id} 
                onClick={() => setSelectedGroup(group)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-start ${
                  selectedGroup?.id === group.id 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container hover:border-outline-variant/60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className={`w-5 h-5 ${selectedGroup?.id === group.id ? 'text-primary' : 'text-on-surface-variant'}`} />
                    <h3 className="font-bold text-on-surface">{group.name}</h3>
                  </div>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
                    <span className="font-mono text-xs bg-surface-container-highest px-1.5 py-0.5 rounded">{group.id}</span>
                    &bull; {group.type}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                  className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  title="Delete Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Membership Management */}
      {selectedGroup && (
        <div className="w-1/2 flex flex-col bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden animate-in slide-in-from-right-8 duration-300">
          <div className="p-6 border-b border-outline-variant/30 bg-surface-container-low">
            <h2 className="text-title-lg font-bold text-on-surface">{selectedGroup.name} Members</h2>
            <p className="text-body-sm text-on-surface-variant font-mono mt-1">{selectedGroup.id}</p>
          </div>
          
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-lowest">
            <form onSubmit={handleAddMember} className="flex gap-2 relative">
              <div className="flex-1">
                <UserSearchSelect 
                  value={userIdToAdd} 
                  onChange={setUserIdToAdd}
                  className="w-full"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-lg hover:bg-primary-container/80 transition-colors font-medium text-label-md whitespace-nowrap h-[36px]"
              >
                <UserPlus className="w-4 h-4" />
                Add
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-auto relative bg-surface-container-low/30">
            {loadingMembers ? (
              <div className="p-8 text-center text-on-surface-variant">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">No members in this group.</div>
            ) : (
              <ul className="divide-y divide-outline-variant/20">
                {members.map(member => (
                  <li key={member.id} className="p-4 pl-6 flex items-center justify-between hover:bg-surface-container-lowest transition-colors group">
                    <div>
                      <div className="font-semibold text-on-surface text-body-lg">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-body-sm text-on-surface-variant font-mono mt-0.5">
                        {member.id} &bull; {member.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-on-surface-variant hover:text-error transition-colors bg-surface-container hover:bg-error/10 rounded-lg opacity-0 group-hover:opacity-100"
                      title="Remove Member"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-outline-variant/30">
              <h2 className="text-title-lg font-bold text-on-surface">Create Group</h2>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-label-md font-medium text-on-surface mb-1">Group ID *</label>
                <input
                  required
                  type="text"
                  value={formData.id || ''}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g. sales"
                  className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-label-md font-medium text-on-surface mb-1">Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sales Department"
                  className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30"
                />
              </div>
              <div>
                <label className="block text-label-md font-medium text-on-surface mb-1">Type *</label>
                <select
                  required
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30 appearance-none"
                >
                  <option value="" disabled>Select a type...</option>
                  <option value="assignment">Assignment</option>
                  <option value="security-role">Security Role</option>
                  <option value="system">System</option>
                </select>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
