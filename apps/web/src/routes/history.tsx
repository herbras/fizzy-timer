/**
 * History Route
 * Shows all tracking sessions grouped by date
 * Dark Theme with Gold/Amber Accent
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { useEffect } from 'react';

import { SessionList } from '@/components/ui/session-item';
import { BottomNav } from '@/components/layout/BottomNav';
import { SettingsSheet } from '@/components/SettingsSheet';
import { GifMascotAvatar } from '@/components/Mascot';
import { useSessionsByDate } from '@/lib/hooks/useSessions';
import { useSettings } from '@/lib/hooks/useSettings';
import { useAppSettings } from '@/lib/hooks/useAppSettings';
import { formatDuration } from '@/lib/utils/time';
import { exportToExcel, exportToCSV, getSessionDateRange } from '@/lib/utils/export';
import { useState } from 'react';

export const Route = createFileRoute('/history')({
  component: HistoryComponent,
});

function HistoryComponent() {
  const navigate = useNavigate();
  const { fizzyToken, accountSlug, loading: settingsLoading } = useSettings();
  const { grouped, dates, loading, deleteSession } = useSessionsByDate();
  const { settings: appSettings, updateSettings } = useAppSettings();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Redirect to setup if not authenticated (only after loading is done)
  useEffect(() => {
    if (!settingsLoading && (!fizzyToken || !accountSlug)) {
      navigate({ to: '/setup' });
    }
  }, [fizzyToken, accountSlug, settingsLoading, navigate]);

  // Don't render anything while loading
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-zinc-600">Memuat...</div>
      </div>
    );
  }

  const allSessions = Object.values(grouped).flat();
  const dateRange = getSessionDateRange(allSessions);

  // Calculate total time
  const totalSeconds = dates.reduce((acc, date) => {
    return acc + grouped[date].reduce((sum, s) => sum + s.duration, 0);
  }, 0);

  const totalSessions = dates.reduce((acc, date) => acc + grouped[date].length, 0);

  const handleExportExcel = () => {
    exportToExcel(allSessions);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    exportToCSV(allSessions);
    setShowExportMenu(false);
  };

  const handleExportCurrentMonth = () => {
    const now = new Date();
    exportToExcel(allSessions, { month: now });
    setShowExportMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#050505]/80 backdrop-blur-md px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <GifMascotAvatar mood={appSettings.moodType} />
            <span className="text-xl font-bold text-zinc-100 tracking-tight">
              Riwayat
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              aria-label="Ekspor log kerja"
              aria-expanded={showExportMenu}
              className="p-2.5 bg-amber-500/10 rounded-xl shadow-sm border border-amber-500/30 text-amber-500 active:scale-90 transition-all hover:bg-amber-500/20 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              <Download size={18} aria-hidden="true" />
            </button>

            {/* Export Dropdown Menu */}
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-12 z-20 w-56 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800/50 overflow-hidden" role="menu" aria-label="Menu ekspor">
                  <div className="px-4 py-3 border-b border-zinc-800/50">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                      Ekspor Log Kerja
                    </p>
                    {dateRange && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {allSessions.length} sesi
                      </p>
                    )}
                  </div>
                  <div className="py-2">
                    <button
                      onClick={handleExportCurrentMonth}
                      role="menuitem"
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-zinc-800/50 transition-colors focus:bg-zinc-800/50 focus:ring-2 focus:ring-inset focus:ring-amber-500"
                    >
                      <FileSpreadsheet size={18} className="text-amber-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">Bulan Ini (Excel)</p>
                        <p className="text-xs text-zinc-500">Ekspor bulan berjalan</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportExcel}
                      role="menuitem"
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-zinc-800/50 transition-colors focus:bg-zinc-800/50 focus:ring-2 focus:ring-inset focus:ring-amber-500"
                    >
                      <FileSpreadsheet size={18} className="text-green-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">Semua Data (Excel)</p>
                        <p className="text-xs text-zinc-500">Multi-sheet dengan summary</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportCSV}
                      role="menuitem"
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-zinc-800/50 transition-colors focus:bg-zinc-800/50 focus:ring-2 focus:ring-inset focus:ring-amber-500"
                    >
                      <FileJson size={18} className="text-blue-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">Format CSV</p>
                        <p className="text-xs text-zinc-500">Untuk import ke aplikasi lain</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Summary Card */}
        <div className="glass-effect rounded-[2rem] p-6 shadow-sm border border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-1">
                Total Terlacak
              </p>
              <p className="text-3xl font-black text-zinc-100">
                {formatDuration(totalSeconds)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-1">
                Sesi
              </p>
              <p className="text-3xl font-black text-amber-500">{totalSessions}</p>
            </div>
          </div>
          {dateRange && (
            <div className="mt-4 pt-4 border-t border-zinc-800/50">
              <p className="text-xs text-zinc-600">
                <span className="font-semibold">Rentang Tanggal:</span> {dateRange.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - {dateRange.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {/* Sessions List */}
        <SessionList
          sessions={Object.values(grouped).flat()}
          grouped={grouped}
          onDelete={deleteSession}
          loading={loading}
          emptyMessage="Belum ada sesi. Mulai mencatat untuk melihat riwayat di sini"
        />
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        onSettingsClick={() => setShowSettings(true)}
        timerRunning={false}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={appSettings}
        onSettingsChange={updateSettings}
      />
    </div>
  );
}
