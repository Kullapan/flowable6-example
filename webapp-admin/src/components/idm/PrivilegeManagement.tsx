import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Users, Plus, Trash2, Check, ExternalLink } from 'lucide-react';
import { idmApi } from '../../lib/idmApi';
import { User } from './UserManagement';
import { UserSearchSelect } from './UserSearchSelect';
import { GroupSearchSelect } from './GroupSearchSelect';

type Privilege = {
  id: string;
  name: string;
};

type Group = {
  id: string;
  name: string;
  type: string;
};

export const PrivilegeManagement = () => {
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection
  const [selectedPrivilege, setSelectedPrivilege] = useState<Privilege | null>(null);
  
  // Assigned subjects
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<'user' | 'group'>('user');
  const [subjectId, setSubjectId] = useState('');

  const loadPrivileges = async () => {
    setLoading(true);
    try {
      const resp = await idmApi.getPrivileges();
      setPrivileges(resp?.data || resp || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrivileges();
  }, []);

  useEffect(() => {
    if (selectedPrivilege) {
      loadAssignedSubjects(selectedPrivilege.id);
    }
  }, [selectedPrivilege]);

  const loadAssignedSubjects = async (privId: string) => {
    setLoadingSubjects(true);
    try {
      const [usersResp, groupsResp] = await Promise.all([
        idmApi.getPrivilegeUsers(privId),
        idmApi.getPrivilegeGroups(privId)
      ]);
      setAssignedUsers(usersResp?.data || usersResp || []);
      setAssignedGroups(groupsResp?.data || groupsResp || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrivilege || !subjectId) return;
    try {
      if (assignType === 'user') {
        if (assignedUsers.some(u => u.id === subjectId)) {
          alert('This user is already assigned to this privilege.');
          return;
        }
        await idmApi.assignPrivilegeToUser(selectedPrivilege.id, subjectId);
      } else {
        if (assignedGroups.some(g => g.id === subjectId)) {
          alert('This group is already assigned to this privilege.');
          return;
        }
        await idmApi.assignPrivilegeToGroup(selectedPrivilege.id, subjectId);
      }
      setSubjectId('');
      setIsAssignModalOpen(false);
      loadAssignedSubjects(selectedPrivilege.id);
    } catch (error: any) {
      console.error('Failed to assign right', error);
      alert(`Failed to assign privilege: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRevokeUser = async (userId: string) => {
    if (!selectedPrivilege || !confirm('Revoke this privilege from the user?')) return;
    try {
      await idmApi.revokePrivilegeFromUser(selectedPrivilege.id, userId);
      loadAssignedSubjects(selectedPrivilege.id);
    } catch (error) {
      console.error('Failed to revoke', error);
      alert('Failed to revoke privilege.');
    }
  };

  const handleRevokeGroup = async (groupId: string) => {
    if (!selectedPrivilege || !confirm('Revoke this privilege from the group?')) return;
    try {
      await idmApi.revokePrivilegeFromGroup(selectedPrivilege.id, groupId);
      loadAssignedSubjects(selectedPrivilege.id);
    } catch (error) {
      console.error('Failed to revoke', error);
      alert('Failed to revoke privilege.');
    }
  };

  const getPrivilegeIcon = (name: string) => {
    if (name.includes('admin')) return <ShieldAlert className="w-5 h-5 text-error" />;
    return <Shield className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel: Privileges */}
      <div className={`flex flex-col flex-1 bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden ${selectedPrivilege ? 'w-1/3' : 'w-full'}`}>
        <div className="p-5 border-b border-outline-variant/30 bg-surface-container sticky top-0 z-10">
          <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Application Privileges
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Manage broad system rights like Admin or Modeler access.</p>
        </div>
        
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant">Loading privileges...</div>
          ) : privileges.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">No privileges found in the system.</div>
          ) : (
            privileges.map((priv) => (
              <div 
                key={priv.id} 
                onClick={() => setSelectedPrivilege(priv)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedPrivilege?.id === priv.id 
                    ? 'border-primary bg-primary/10 shadow-sm' 
                    : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container hover:border-outline-variant/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getPrivilegeIcon(priv.name)}
                  <div>
                    <h3 className="font-bold text-on-surface text-body-lg">{priv.name}</h3>
                    <p className="text-body-sm text-on-surface-variant font-mono">{priv.id}</p>
                  </div>
                </div>
                {selectedPrivilege?.id === priv.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Assigned Users & Groups */}
      {selectedPrivilege && (
        <div className="w-2/3 flex flex-col bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden animate-in slide-in-from-right-8 duration-300">
          <div className="p-5 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-start">
            <div>
              <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
                {getPrivilegeIcon(selectedPrivilege.name)}
                {selectedPrivilege.name} 
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-1 font-mono">ID: {selectedPrivilege.id}</p>
            </div>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-label-md font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Assign
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-surface-container-low/30 p-4 space-y-6">
            {loadingSubjects ? (
              <div className="p-8 text-center text-on-surface-variant">Loading assigned subjects...</div>
            ) : (
              <>
                {/* Users Assignees */}
                <div>
                  <h3 className="text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2 px-2">
                    <Users className="w-5 h-5" />
                    Assigned Users ({assignedUsers.length})
                  </h3>
                  {assignedUsers.length === 0 ? (
                    <div className="bg-surface-container rounded-xl p-4 text-center text-body-sm text-on-surface-variant border border-dashed border-outline-variant/50">
                      No users have explicit access to this privilege.
                    </div>
                  ) : (
                    <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
                      <ul className="divide-y divide-outline-variant/20">
                        {assignedUsers.map(user => (
                          <li key={user.id} className="p-3 pl-4 flex items-center justify-between hover:bg-surface-container-lowest group transition-colors">
                            <div>
                              <span className="font-semibold text-on-surface mr-2">{user.firstName} {user.lastName}</span>
                              <span className="text-on-surface-variant font-mono text-sm block md:inline mt-0.5 md:mt-0">{user.id} • {user.email}</span>
                            </div>
                            <button
                              onClick={() => handleRevokeUser(user.id)}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Revoke Permission"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Groups Assignees */}
                <div>
                  <h3 className="text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2 px-2 mt-2">
                    <ExternalLink className="w-5 h-5" />
                    Assigned Groups ({assignedGroups.length})
                  </h3>
                  {assignedGroups.length === 0 ? (
                    <div className="bg-surface-container rounded-xl p-4 text-center text-body-sm text-on-surface-variant border border-dashed border-outline-variant/50">
                      No groups have explicit access to this privilege.
                    </div>
                  ) : (
                    <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
                      <ul className="divide-y divide-outline-variant/20">
                        {assignedGroups.map(group => (
                          <li key={group.id} className="p-3 pl-4 flex items-center justify-between hover:bg-surface-container-lowest group transition-colors">
                            <div>
                              <span className="font-semibold text-on-surface flex items-center gap-2">
                                {group.name} 
                              </span>
                              <span className="text-on-surface-variant font-mono text-sm block mt-0.5">{group.id} ({group.type})</span>
                            </div>
                            <button
                              onClick={() => handleRevokeGroup(group.id)}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Revoke Permission"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container-lowest">
              <h2 className="text-title-lg font-bold text-on-surface">Assign Privilege</h2>
              <p className="text-body-sm font-semibold text-primary mt-1">{selectedPrivilege?.name}</p>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-5">
              <div>
                <label className="block text-label-md font-medium text-on-surface mb-2">Subject Type</label>
                <div className="flex bg-surface-container p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAssignType('user')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${assignType === 'user' ? 'bg-surface shadow text-on-surface border border-outline-variant/20' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
                  >
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignType('group')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${assignType === 'group' ? 'bg-surface shadow text-on-surface border border-outline-variant/20' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
                  >
                    Group
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-label-md font-medium text-on-surface mb-1">
                  {assignType === 'user' ? 'Select User *' : 'Select Group *'}
                </label>
                {assignType === 'user' ? (
                  <UserSearchSelect
                    value={subjectId}
                    onChange={setSubjectId}
                    className="w-full"
                  />
                ) : (
                  <GroupSearchSelect
                    value={subjectId}
                    onChange={setSubjectId}
                    className="w-full"
                  />
                )}
              </div>

              <div className="pt-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors font-medium border border-outline-variant/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors font-medium shadow-sm hover:shadow"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
