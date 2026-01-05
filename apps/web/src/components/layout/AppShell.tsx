/**
 * AppShell Component
 * Main layout with bottom navigation
 * Dark Theme with Gold/Amber Accent
 */

import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  Home,
  Settings,
  History,
  BarChart3,
  Timer,
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'History', to: '/history', icon: History },
  { label: 'Report', to: '/report', icon: BarChart3 },
  { label: 'Settings', to: '/setup', icon: Settings },
];

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#050505] pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#050505]/90 backdrop-blur-sm border-b border-zinc-800/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gradient-gold">Fizzy Focus</h1>
          <Link to="/setup" className="text-sm text-zinc-500 hover:text-amber-500 transition">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {children || <Outlet />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#050505]/95 backdrop-blur-sm border-t border-zinc-800/50">
        <div className="flex justify-around max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const location = useLocation();
  const isActive = location.pathname === item.to;

  return (
    <Link
      to={item.to}
      className={cn(
        'flex flex-col items-center justify-center py-2 px-3 min-w-16 transition-colors',
        isActive
          ? 'text-amber-500'
          : 'text-zinc-600 hover:text-zinc-400'
      )}
    >
      <item.icon className="w-5 h-5" />
      <span className="text-xs mt-1">{item.label}</span>
    </Link>
  );
}
