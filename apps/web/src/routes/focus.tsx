/**
 * Focus Route
 * Full-screen focus mode timer
 * Dark Theme with Gold/Amber Accent
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Pause, Play, Sparkles } from 'lucide-react';

import { useTimer } from '@/lib/hooks/useTimer';
import { useAppSettings } from '@/lib/hooks/useAppSettings';
import { useSettings } from '@/lib/hooks/useSettings';
import { useNotification } from '@/lib/hooks/useNotification';
import { useSaveSession } from '@/lib/queries/useSessions';
import { GifMascot } from '@/components/Mascot';
import { MIN_SESSION_DURATION } from '@/lib/constants';
import { createSession } from '@/lib/hooks/useSessions';

export const Route = createFileRoute('/focus')({
  // Disable SSR for this route to prevent hydration mismatch
  // The timer displays real-time elapsed seconds which changes constantly
  ssr: false,
  component: FocusComponent,
});

function FocusComponent() {
  const navigate = useNavigate();
  const timer = useTimer();
  const { settings: appSettings } = useAppSettings();
  const { accountSlug, userId } = useSettings();
  const { requestPermission, showTimerCompleteNotification, supported } = useNotification();
  const saveSessionMutation = useSaveSession();
  const [notes, setNotes] = useState('');
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notificationRequested, setNotificationRequested] = useState(false);

  // Request notification permission on first visit
  useEffect(() => {
    if (supported && !notificationRequested && timer.state === 'running') {
      requestPermission();
      setNotificationRequested(true);
    }
  }, [supported, notificationRequested, timer.state, requestPermission]);

  // Handle countdown timer completion
  useEffect(() => {
    if (timer.state === 'completed' && timer.data && timer.mode === 'countdown') {
      // Show notification
      showTimerCompleteNotification(timer.data.card.title, timer.elapsed);
      // Also show in-app toast
      toast.success('Sesi fokus selesai. Kerja bagus!');
    }
  }, [timer.state, timer.data, timer.mode, timer.elapsed, showTimerCompleteNotification]);

  // Get card/board from URL search params if coming from fresh load
  // Also handle redirect after initialization is complete
  useEffect(() => {
    // Only run once
    if (isInitialized) return;

    const search = window.location.search;
    const params = new URLSearchParams(search);
    const cardId = params.get('cardId');
    const boardId = params.get('boardId');
    const cardTitle = params.get('cardTitle');
    const boardName = params.get('boardName');
    const cardNumber = params.get('cardNumber');
    const previousElapsedStr = params.get('previousElapsed');
    const previousElapsed = previousElapsedStr ? parseInt(previousElapsedStr, 10) : 0;

    // If timer is idle but params provided, restore timer state
    if (
      timer.state === 'idle' &&
      cardId &&
      boardId &&
      cardTitle &&
      boardName &&
      cardNumber
    ) {
      timer.start({
        card: {
          id: cardId,
          boardId,
          boardName,
          columnId: '',
          columnName: '',
          title: cardTitle,
          number: parseInt(cardNumber, 10),
          status: 'todo',
          description: null,
          tags: [],
          golden: false,
          createdAt: '',
          lastActiveAt: '',
          url: '',
          creatorId: '',
          creatorName: '',
          isOwner: false,
        },
        board: {
          id: boardId,
          name: boardName,
          color: '#71717a',
        },
        previousElapsed, // Start from accumulated time
      });
    }

    // Mark as initialized - timer state is now stable
    setIsInitialized(true);
  }, [timer, isInitialized]);

  // Exit focus mode if no timer running (but only after initialization)
  useEffect(() => {
    // Wait until initialization is complete before checking
    if (!isInitialized) return;

    // Only redirect if timer is idle and no confirmation dialog is showing
    if (timer.state === 'idle' && !showStopConfirm) {
      navigate({ to: '/' });
    }
  }, [timer.state, showStopConfirm, navigate, isInitialized]);

  // Pause timer when leaving page, resync when returning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timer.state === 'running') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Resync timer when user returns to the app
    // This ensures the displayed time matches actual elapsed time
    const handleVisibilityChange = () => {
      if (!document.hidden && timer.state === 'running') {
        timer.resync();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timer.state, timer.resync]);

  // Wake Lock - keep screen on while timer is running
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('[Focus] Wake Lock failed:', err);
      }
    };

    if (timer.state === 'running') {
      requestWakeLock();
    }

    return () => {
      wakeLock?.release();
    };
  }, [timer.state]);

  // Stop timer and save session
  const handleStop = useCallback(async () => {
    if (!timer.data) return;

    // Verify we have account info before creating session
    if (!accountSlug || !userId) {
      toast.error('Akun belum diatur dengan benar');
      timer.reset();
      navigate({ to: '/' });
      return;
    }

    const sessionBase = createSession(
      timer.data.card.id,
      timer.data.card.title,
      timer.data.card.number,
      timer.data.board.id,
      timer.data.board.name,
      accountSlug,  // accountId
      userId        // userId
    );

    // Use sessionElapsed (current session only) not total elapsed
    // timer.elapsed = total accumulated, timer.sessionElapsed = current session duration
    const currentSessionDuration = timer.sessionElapsed;

    const sessionData: import('@/lib/db/schema').Session = {
      ...sessionBase,
      duration: currentSessionDuration,
      endTime: Date.now(),
    };

    // Add notes
    if (notes.trim()) {
      sessionData.notes = notes.trim();
    }

    // Check minimum duration
    if (sessionData.duration < MIN_SESSION_DURATION) {
      toast.error(`Sesi terlalu singkat. Minimal ${MIN_SESSION_DURATION} detik.`);
      timer.reset();
      navigate({ to: '/' });
      return;
    }

    // Save session with mutation - will auto-invalidate queries
    try {
      await saveSessionMutation.mutateAsync(sessionData);
      toast.success('Sesi disimpan!');
      timer.reset();
      navigate({ to: '/' });
    } catch (error) {
      console.error('[Focus] Failed to save session:', error);
      toast.error('Gagal menyimpan sesi. Coba lagi.');
    }
  }, [timer, notes, navigate, accountSlug, userId, saveSessionMutation]);

  // Confirm stop
  const handleStopClick = useCallback(() => {
    if (timer.state === 'running' || timer.state === 'paused') {
      setShowStopConfirm(true);
    }
  }, [timer.state]);

  // Cancel stop
  const handleCancelStop = useCallback(() => {
    setShowStopConfirm(false);
  }, []);

  // Exit without saving
  const handleExit = useCallback(() => {
    timer.reset();
    navigate({ to: '/' });
  }, [timer, navigate]);

  if (!timer.data) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-zinc-500">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <button
          onClick={handleExit}
          aria-label="Keluar"
          className="p-2 text-zinc-600 hover:text-zinc-300 transition focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-lg"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
          <Sparkles size={12} className="text-amber-500" />
          <p className="text-amber-500 font-black uppercase tracking-[0.2em] text-[9px]">
            {timer.data.board.name}
          </p>
        </div>
        <div className="w-6" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 space-y-8 sm:space-y-12 animate-zoom-in-95 pb-safe">
        {/* Card Title */}
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-zinc-100 text-xl sm:text-2xl md:text-3xl font-black tracking-tight break-words">
            {timer.data.card.title}
          </h1>
        </div>

        {/* Mascot Display */}
        {appSettings.showAnimal && (
          <div className="relative">
            <GifMascot
              mood={appSettings.moodType}
              isVisible={true}
              size="xl"
            />
          </div>
        )}

        {/* Timer Display */}
        <div className="flex flex-col items-center gap-2 pt-2 sm:pt-4">
          <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter tabular-nums text-zinc-100 break-all" aria-live="polite" aria-atomic="true">
            <span aria-label={`${timer.mode === 'countdown' ? 'Waktu tersisa' : 'Waktu berjalan'}: ${timer.formattedTime}`}>
              {timer.formattedTime}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div
              className={`w-2 h-2 rounded-full ${
                timer.state === 'running'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-zinc-700'
              }`}
              aria-hidden="true"
            />
            <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[9px]">
              {timer.mode === 'countdown' ? 'Timer Hitung Mundur' : 'Sesi Fokus'}
            </p>
          </div>
          {timer.mode === 'countdown' && timer.remaining > 0 && (
            <p className="text-zinc-700 text-xs mt-1" aria-live="polite">
              {Math.floor(timer.remaining / 60)}:{(timer.remaining % 60).toString().padStart(2, '0')} tersisa
            </p>
          )}
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => {
              if (timer.state === 'running') {
                timer.pause();
              } else {
                timer.resume();
              }
            }}
            aria-label={timer.state === 'running' ? 'Jeda timer' : 'Lanjutkan timer'}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-full flex items-center justify-center backdrop-blur-xl border-2 border-zinc-600 transition-all active:scale-90 shadow-lg focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            {timer.state === 'running' ? (
              <Pause size={28} className="sm:hidden" fill="currentColor" stroke="none" aria-hidden="true" />
            ) : (
              <Play size={28} className="sm:hidden translate-x-1" fill="currentColor" stroke="none" aria-hidden="true" />
            )}
            {timer.state === 'running' ? (
              <Pause size={32} className="hidden sm:block" fill="currentColor" stroke="none" aria-hidden="true" />
            ) : (
              <Play size={32} className="hidden sm:block translate-x-1" fill="currentColor" stroke="none" aria-hidden="true" />
            )}
          </button>

          <button
            onClick={handleStopClick}
            aria-label="Akhiri sesi"
            className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 hover:bg-zinc-800 rounded-full flex items-center justify-center border-4 border-red-500 transition-all active:scale-95 shadow-xl focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-sm" aria-hidden="true" />
          </button>
        </div>

        {/* Notes Input */}
        {timer.state === 'paused' && (
          <div className="w-full max-w-md mt-4">
            <label htmlFor="session-notes" className="sr-only">Catatan sesi</label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambah catatan tentang sesi ini..."
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none backdrop-blur-xl"
              rows={3}
            />
          </div>
        )}

        {/* Confirm Stop Dialog */}
        {showStopConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div className="bg-zinc-900 rounded-[2rem] p-6 mx-4 max-w-sm w-full animate-zoom-in-95 border border-zinc-800">
              <h3 id="dialog-title" className="text-xl font-bold text-zinc-100 mb-2">
                Akhiri Sesi?
              </h3>
              <p className="text-zinc-500 text-sm mb-6">
                Simpan progres Anda dan keluar dari mode fokus.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelStop}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-semibold transition border border-zinc-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  Batal
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-2xl font-semibold transition focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  Simpan & Keluar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center">
        <p className="text-xs text-zinc-600 font-medium">
          {timer.state === 'running' ? 'Tetap fokus!' : 'Jeda'}
        </p>
      </footer>
    </div>
  );
}
