import { useState } from 'react';
import { UserManagement } from '../components/idm/UserManagement';
import { GroupManagement } from '../components/idm/GroupManagement';
import { PrivilegeManagement } from '../components/idm/PrivilegeManagement';
import { Users, UsersRound, Shield } from 'lucide-react';

export const IdmManagement = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'privileges'>('users');

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-display-sm font-bold text-on-surface">Identity Management</h1>
          <p className="text-body-lg text-on-surface-variant mt-2">Manage users, groups, and application privileges across the Flowable engine.</p>
        </div>
        
        {/* Sub-navigation */}
        <div className="flex bg-surface-container rounded-xl p-1.5 shadow-sm border border-outline-variant/30">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-label-md font-bold transition-all ${
              activeTab === 'users' 
                ? 'bg-surface text-primary shadow-sm border border-outline-variant/20' 
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-label-md font-bold transition-all ${
              activeTab === 'groups' 
                ? 'bg-surface text-primary shadow-sm border border-outline-variant/20' 
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
            }`}
          >
            <UsersRound className="w-4 h-4" />
            Groups
          </button>
          <button
            onClick={() => setActiveTab('privileges')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-label-md font-bold transition-all ${
              activeTab === 'privileges' 
                ? 'bg-surface text-primary shadow-sm border border-outline-variant/20' 
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
            }`}
          >
            <Shield className="w-4 h-4" />
            Privileges
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'groups' && <GroupManagement />}
        {activeTab === 'privileges' && <PrivilegeManagement />}
      </div>
    </div>
  );
};
