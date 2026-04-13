import { useState, useEffect, useRef } from 'react';
import { idmApi } from '../../lib/idmApi';
import { Search, Loader2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  type: string;
}

interface GroupSearchSelectProps {
  value: string;
  onChange: (groupId: string) => void;
  placeholder?: string;
  className?: string;
}

export const GroupSearchSelect = ({ value, onChange, placeholder = "Search group by name...", className = "" }: GroupSearchSelectProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load selected group if value exists but selectedGroup is null
  useEffect(() => {
    if (!value) {
      setSelectedGroup(null);
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

    const searchGroups = async () => {
      setLoading(true);
      try {
        const resp = await idmApi.getGroups(query);
        setResults(resp?.data || resp || []);
      } catch (err) {
        console.error("Failed to search groups", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceFn = setTimeout(searchGroups, 300);
    return () => clearTimeout(debounceFn);
  }, [query, isOpen]);

  const handleSelect = (group: Group) => {
    setSelectedGroup(group);
    setQuery(group.name || group.id);
    onChange(group.id);
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
                setSelectedGroup(null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedGroup ? selectedGroup.name : placeholder}
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
             <div className="p-3 text-center text-sm text-on-surface-variant">No groups found</div>
          ) : (
             <ul className="divide-y divide-outline-variant/10">
               {results.map(group => (
                 <li 
                   key={group.id} 
                   onClick={() => handleSelect(group)}
                   className="p-2 px-3 hover:bg-surface-container cursor-pointer transition-colors"
                 >
                   <div className="font-medium text-sm text-on-surface">{group.name}</div>
                   <div className="text-xs text-on-surface-variant font-mono">{group.id} • {group.type}</div>
                 </li>
               ))}
             </ul>
          )}
        </div>
      )}
    </div>
  );
};
