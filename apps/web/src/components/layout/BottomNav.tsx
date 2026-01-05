/**
 * Bottom Navigation Bar
 * Accessible bottom navigation for mobile-first design
 * WCAG AA Compliant with proper touch targets (44x44 min)
 */

import { useNavigate, useLocation } from '@tanstack/react-router';
import { Home, History, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import { useSettings } from '@/lib/hooks/useSettings';
import { useTimer } from '@/lib/hooks/useTimer';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Beranda', icon: Home, to: '/home' },
  { id: 'history', label: 'Riwayat', icon: History, to: '/history' },
];

export function BottomNav({
  onSettingsClick,
  timerRunning,
}: {
  onSettingsClick: () => void;
  timerRunning: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, activeAccount, switchAccount, addAccount, removeAccount } = useSettings();
  const timer = useTimer();

  const getIsActive = (to: string) => {
    return location.pathname === to;
  };

  const handleSwitch = async (accountId: string) => {
    // Auto-pause timer if running
    if (timer.state === 'running') {
      timer.pause();
    }
    await switchAccount(accountId);
  };

  const hasMultipleAccounts = accounts.length > 1;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/50 safe-area-bottom z-40"
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item.to);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate({ to: item.to })}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] min-h-[48px]',
                'active:scale-95',
                isActive
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={2.5} aria-hidden="true" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Account Switcher - only show if multiple accounts */}
        {hasMultipleAccounts && (
          <div className="px-1">
            <AccountSwitcher
              accounts={accounts}
              activeAccount={activeAccount}
              onSwitch={handleSwitch}
              onAdd={addAccount}
              onRemove={removeAccount}
              timerRunning={timer.state === 'running'}
            />
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={onSettingsClick}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] min-h-[48px]',
            'active:scale-95 text-zinc-500 hover:text-zinc-300'
          )}
          aria-label="Pengaturan"
        >
          <Settings size={20} strokeWidth={2.5} aria-hidden="true" />
          <span className="text-[9px] font-bold uppercase tracking-wider">
            Pengaturan
          </span>
        </button>

        {/* Focus Mode Indicator - shown when timer running */}
        {timerRunning && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" role="status" aria-live="polite">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 rounded-full border-2 border-zinc-900 shadow-lg">
              <Sparkles size={10} className="text-black" aria-hidden="true" />
              <span className="text-[8px] font-black text-black uppercase tracking-wider">
                Fokus
              </span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
