import { useState, useEffect, useRef } from 'react';
import { idmApi } from '../../lib/idmApi';
import { User } from './UserManagement';
import { Search, Loader2 } from 'lucide-react';

interface UserSearchSelectProps {
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  className?: string;
}

export const UserSearchSelect = ({ value, onChange, placeholder = "Search user by name or email...", className = "" }: UserSearchSelectProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load selected user if value exists but selectedUser is null
  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
      setQuery('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || query.length < 2) {
      setResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const resp = await idmApi.getUsers(query);
        setResults(resp?.data || resp || []);
      } catch (err) {
        console.error("Failed to search users", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceFn = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceFn);
  }, [query, isOpen]);

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    setQuery(`${user.firstName} ${user.lastName}`.trim() || user.id);
    onChange(user.id);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') {
                onChange('');
                setSelectedUser(null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : placeholder}
          className="w-full px-4 py-2 pl-9 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface border border-transparent focus:border-primary/30 text-sm"
        />
        <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
        {loading && <Loader2 className="w-4 h-4 text-primary absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-outline-variant/30 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {loading ? (
             <div className="p-3 text-center text-sm text-on-surface-variant">Searching...</div>
          ) : results.length === 0 ? (
             <div className="p-3 text-center text-sm text-on-surface-variant">No users found</div>
          ) : (
             <ul className="divide-y divide-outline-variant/10">
               {results.map(user => (
                 <li 
                   key={user.id} 
                   onClick={() => handleSelect(user)}
                   className="p-2 px-3 hover:bg-surface-container cursor-pointer transition-colors"
                 >
                   <div className="font-medium text-sm text-on-surface">{user.firstName} {user.lastName}</div>
                   <div className="text-xs text-on-surface-variant font-mono">{user.id} • {user.email}</div>
                 </li>
               ))}
             </ul>
          )}
        </div>
      )}
    </div>
  );
};
