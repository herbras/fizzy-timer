/**
 * Settings Sheet Component
 * Bottom sheet style settings modal
 * Dark Theme with Gold/Amber Accent
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { X, ChevronRight, Info, Sparkles, Users, Plus, Check, Trash2, HelpCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import type { AppSettings, MoodType, StoredAccount } from '@/lib/db/schema';
import { MOOD_INFO, MOOD_COLORS } from '@/lib/db/schema';
import { useSettings } from '@/lib/hooks/useSettings';
import { useTimer } from '@/lib/hooks/useTimer';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
}

const MOODS: { id: MoodType; name: string; color: string; description: string }[] = [
  { id: 'fire', name: 'Fire', color: 'bg-orange-500', description: 'Semua baik!' },
  { id: 'chill', name: 'Chill', color: 'bg-blue-500', description: 'Tetap rileks' },
  { id: 'focus', name: 'Focus', color: 'bg-purple-500', description: 'Kerja dalam' },
  { id: 'chaos', name: 'Chaos', color: 'bg-pink-500', description: 'Berputar!' },
  { id: 'determined', name: 'Determined', color: 'bg-amber-500', description: 'Ayo gas!' },
];

export function SettingsSheet({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsSheetProps) {
  const navigate = useNavigate();
  const { accounts, activeAccount, switchAccount, addAccount, removeAccount } = useSettings();
  const timer = useTimer();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleSwitch = async (accountId: string) => {
    if (accountId === activeAccount?.id) return;

    // Auto-pause timer if running
    if (timer.state === 'running') {
      timer.pause();
      toast.info('Timer dijeda');
    }

    await switchAccount(accountId);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = newToken.trim();

    if (!token) {
      toast.error('Masukkan token API Anda');
      return;
    }

    setIsAdding(true);
    try {
      await addAccount(token);
      setNewToken('');
      setShowAddAccount(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (accountId: string) => {
    if (accounts.length === 1) {
      toast.error('Tidak dapat menghapus akun terakhir');
      return;
    }

    if (timer.state === 'running') {
      toast.error('Tidak dapat menghapus akun saat timer berjalan');
      return;
    }

    if (confirm('Hapus akun ini? Data pencatatan akan disimpan namun disembunyikan.')) {
      await removeAccount(accountId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative bg-zinc-900 rounded-t-[2.5rem] shadow-2xl animate-slide-up max-w-md mx-auto w-full border-t border-zinc-800 max-h-[90vh] flex flex-col">
        {/* Drag Handle */}
        <button
          onClick={onClose}
          aria-label="Tutup pengaturan"
          className="w-16 h-1.5 bg-zinc-700 rounded-full mx-auto mt-4 mb-6 hover:bg-zinc-600 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-full"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-8 mb-6 flex-shrink-0">
          <h2 id="settings-title" className="text-3xl font-extrabold tracking-tight text-zinc-100">
            Pengaturan
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-100 active:scale-90 transition-all border border-zinc-700/50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 bottom-sheet-scroll">
          {/* Mood Selection with Icons8 */}
          <section className="space-y-4 mb-8">
            <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest px-2 flex items-center gap-2">
              <Sparkles size={12} className="text-amber-500" aria-hidden="true" />
              Pilih Suasana Anda
            </p>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((mood) => {
                const moodInfo = MOOD_INFO[mood.id];
                const isActive = settings.moodType === mood.id;

                return (
                  <button
                    key={mood.id}
                    onClick={() =>
                      onSettingsChange({ ...settings, moodType: mood.id })
                    }
                    aria-label={`Suasana ${mood.name}`}
                    aria-pressed={isActive}
                    className={cn(
                      'p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1',
                      isActive
                        ? 'border-amber-500 bg-zinc-800 shadow-md gold-glow-subtle'
                        : 'border-zinc-700 bg-zinc-800/50 opacity-60 hover:opacity-100'
                    )}
                  >
                    {/* Icon container with colored background */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: isActive ? moodInfo.color : moodInfo.color.replace('/20', '/10'),
                      }}
                    >
                      <Icon
                        icon={moodInfo.icon}
                        className={cn(
                          'text-xl',
                          isActive ? 'text-white' : 'text-zinc-500'
                        )}
                      />
                    </div>
                    <span className={cn(
                      'text-[9px] font-bold uppercase tracking-wider',
                      isActive ? 'text-amber-500' : 'text-zinc-400'
                    )}>
                      {mood.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-zinc-500 text-center px-4">
              {MOOD_INFO[settings.moodType].description}
            </p>
          </section>

          {/* App Config Toggles */}
          <section className="space-y-4 mb-8">
            <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest px-2">
              Konfigurasi Aplikasi
            </p>

            <div className="bg-zinc-800/50 rounded-[2rem] p-6 space-y-6 border border-zinc-700/50">
              {/* Visual Timer Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-base font-bold text-zinc-100">
                    Timer Visual
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    Tampilkan angka hitung mundur
                  </span>
                </div>
                <ToggleButton
                  enabled={settings.showNumbers}
                  onToggle={() =>
                    onSettingsChange({ ...settings, showNumbers: !settings.showNumbers })
                  }
                />
              </div>

              <div className="h-px bg-zinc-700/50 w-full" />

              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-base font-bold text-zinc-100">
                    Notifikasi
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    Suara saat timer selesai
                  </span>
                </div>
                <ToggleButton
                  enabled={settings.soundEnabled}
                  onToggle={() =>
                    onSettingsChange({
                      ...settings,
                      soundEnabled: !settings.soundEnabled,
                    })
                  }
                />
              </div>

              <div className="h-px bg-zinc-700/50 w-full" />

              {/* Mascot Display Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-base font-bold text-zinc-100">
                    Tampilan Maskot
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    Pertahankan teman Anda terlihat
                  </span>
                </div>
                <ToggleButton
                  enabled={settings.showAnimal}
                  onToggle={() =>
                    onSettingsChange({ ...settings, showAnimal: !settings.showAnimal })
                  }
                />
              </div>
            </div>
          </section>

          {/* Accounts Section */}
          <section className="space-y-3 mb-8">
            <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest px-2 flex items-center gap-2">
              <Users size={12} className="text-amber-500" aria-hidden="true" />
              Akun ({accounts.length})
            </p>
            <div className="bg-zinc-800/50 rounded-[2rem] border border-zinc-700/50 overflow-hidden">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={cn(
                    "flex items-center justify-between p-4 border-b border-zinc-700/50 last:border-b-0 transition-colors",
                    account.isActive ? "bg-amber-500/5" : "hover:bg-zinc-700/30"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0",
                      account.isActive ? "bg-amber-500 text-black" : "bg-zinc-700 text-zinc-400"
                    )}>
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        account.isActive ? "text-amber-500" : "text-zinc-300"
                      )}>
                        {account.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {account.isActive && (
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                        Aktif
                      </span>
                    )}
                    {!account.isActive && (
                      <button
                        onClick={() => handleSwitch(account.id)}
                        disabled={timer.state === 'running'}
                        className="text-xs font-medium text-zinc-500 hover:text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded px-1 py-0.5"
                      >
                        Ganti
                      </button>
                    )}
                    {!account.isActive && accounts.length > 1 && (
                      <button
                        onClick={() => handleRemove(account.id)}
                        disabled={timer.state === 'running'}
                        aria-label="Hapus akun"
                        className="p-1.5 text-zinc-600 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Account Form */}
              {showAddAccount ? (
                <form onSubmit={handleAddAccount} className="p-4 border-t border-zinc-700/50">
                  <input
                    type="password"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    placeholder="Tempel token API..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500 mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isAdding || !newToken.trim()}
                      className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold rounded-xl transition disabled:opacity-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                    >
                      {isAdding ? 'Menambahkan...' : 'Tambah Akun'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAccount(false);
                        setNewToken('');
                      }}
                      className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm font-medium rounded-xl transition focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddAccount(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30 transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded mx-2"
                >
                  <Plus size={18} aria-hidden="true" />
                  <span className="font-medium">Tambah Akun</span>
                </button>
              )}
            </div>
          </section>

          {/* General Section */}
          <section className="space-y-3 pb-8">
            <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest px-2">
              Umum
            </p>
            <div className="bg-zinc-800/50 rounded-[2rem] border border-zinc-700/50 overflow-hidden">
              {/* Tentang Fizzy Timer */}
              <button
                onClick={() => {
                  onClose();
                  navigate({ to: '/' });
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-700/30 transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-inset"
              >
                <div className="flex items-center gap-4">
                  <div className="text-amber-500" aria-hidden="true">
                    <Info size={18} />
                  </div>
                  <span className="font-semibold text-zinc-300">Tentang Fizzy Timer</span>
                </div>
                <ChevronRight size={18} className="text-zinc-600" aria-hidden="true" />
              </button>

              {/* Dukungan */}
              <a
                href="https://twitter.com/sarbeh_"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-700/30 transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-inset border-t border-zinc-700/50"
              >
                <div className="flex items-center gap-4">
                  <div className="text-amber-500" aria-hidden="true">
                    <HelpCircle size={18} />
                  </div>
                  <span className="font-semibold text-zinc-300">Dukungan</span>
                </div>
                <ChevronRight size={18} className="text-zinc-600" aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  enabled: boolean;
  onToggle: () => void;
}

function ToggleButton({ enabled, onToggle }: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      className={cn(
        'w-14 h-8 rounded-full transition-all relative flex-shrink-0 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900',
        enabled ? 'bg-amber-500' : 'bg-zinc-700'
      )}
    >
      <div
        className={cn(
          'absolute top-1 w-6 h-6 bg-zinc-100 rounded-full shadow-sm transition-all',
          enabled ? 'left-7' : 'left-1'
        )}
      />
    </button>
  );
}
