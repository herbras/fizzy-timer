/**
 * Account Switcher Component
 * Dropdown for switching between multiple Fizzy accounts
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { StoredAccount } from '@/lib/db/schema';
import { useTimer } from '@/lib/hooks/useTimer';

interface AccountSwitcherProps {
  accounts: StoredAccount[];
  activeAccount: StoredAccount | null;
  onSwitch: (accountId: string) => Promise<void>;
  onAdd: (token: string) => Promise<void>;
  onRemove: (accountId: string) => Promise<void>;
  timerRunning?: boolean;
}

export function AccountSwitcher({
  accounts,
  activeAccount,
  onSwitch,
  onAdd,
  onRemove,
  timerRunning = false,
}: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
        setNewToken('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSwitch = async (accountId: string) => {
    if (accountId === activeAccount?.id) return;

    // Auto-pause timer if running
    if (timerRunning) {
      toast.info('Switching accounts will pause the timer');
    }

    await onSwitch(accountId);
    setIsOpen(false);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = newToken.trim();

    if (!token) {
      toast.error('Please enter your API token');
      return;
    }

    setIsAdding(true);
    try {
      await onAdd(token);
      setNewToken('');
      setShowAddForm(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (accounts.length === 1) {
      toast.error('Cannot remove the last account');
      return;
    }

    if (timerRunning) {
      toast.error('Cannot switch accounts while timer is running');
      return;
    }

    if (confirm('Remove this account? Their tracking data will be kept but hidden.')) {
      await onRemove(accountId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800/50 hover:border-amber-500/50 transition-all min-w-[160px] max-w-[200px]"
      >
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">
            {accounts.length > 1 ? `${accounts.length} Accounts` : 'Account'}
          </p>
          <p className="text-sm font-medium text-zinc-100 truncate">
            {activeAccount?.name || 'Select Account'}
          </p>
        </div>
        <ChevronDown size={16} className="text-zinc-500 shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800/50 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800/50">
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
              Switch Account
            </p>
          </div>

          {/* Account List */}
          <div className="max-h-64 overflow-y-auto">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleSwitch(account.id)}
                disabled={timerRunning && account.id !== activeAccount?.id}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar with first letter */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                    account.isActive
                      ? 'bg-amber-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                  }`}>
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className={`text-sm font-medium truncate ${
                      account.isActive ? 'text-zinc-100' : 'text-zinc-400'
                    }`}>
                      {account.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {account.isActive && (
                    <Check size={16} className="text-amber-500" />
                  )}
                  {!account.isActive && accounts.length > 1 && (
                    <button
                      onClick={(e) => handleRemove(account.id, e)}
                      className="p-1.5 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Add Account Form */}
          {showAddForm ? (
            <div className="p-3 border-t border-zinc-800/50 bg-zinc-900/50">
              <form onSubmit={handleAddAccount}>
                <input
                  type="password"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="Paste API token..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isAdding || !newToken.trim()}
                    className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {isAdding ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewToken('');
                    }}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm font-medium rounded-xl transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-3 border-t border-zinc-800/50">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-medium rounded-xl transition flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Account
              </button>
            </div>
          )}

          {/* Timer warning */}
          {timerRunning && (
            <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20">
              <p className="text-xs text-amber-500 text-center">
                Pause timer to switch accounts
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
