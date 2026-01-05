/**
 * Timer Display Component
 * Big timer display for focus mode
 * Dark Theme with Gold/Amber Accent
 */

import { cn } from '@/lib/utils';
import { Pause, Play } from 'lucide-react';

interface TimerDisplayProps {
  formattedTime: string;
  state: 'idle' | 'running' | 'paused' | 'completed';
  cardTitle: string;
  boardName: string;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
}

export function TimerDisplay({
  formattedTime,
  state,
  cardTitle,
  boardName,
  onPause,
  onResume,
  className,
}: TimerDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {/* Timer Display */}
      <div className="relative">
        {/* Outer Circle */}
        <div className="w-64 h-64 rounded-full border-8 border-zinc-800 flex items-center justify-center">
          {/* Inner Circle - changes based on state */}
          <div
            className={cn(
              'w-56 h-56 rounded-full flex items-center justify-center transition-colors',
              {
                'bg-amber-500': state === 'running',
                'bg-zinc-700': state === 'paused',
                'bg-zinc-800': state === 'idle' || state === 'completed',
              }
            )}
          >
            <div className={cn('text-center', {
              'text-black': state === 'running',
              'text-zinc-100': state !== 'running',
            })}>
              {/* Time */}
              <div className="text-6xl font-bold tracking-tight font-mono">
                {formattedTime}
              </div>

              {/* Status Icon */}
              {state === 'running' && onPause && (
                <button
                  onClick={onPause}
                  className="mt-4 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
                >
                  <Pause className="w-6 h-6" />
                </button>
              )}
              {state === 'paused' && onResume && (
                <button
                  onClick={onResume}
                  className="mt-4 p-2 rounded-full bg-zinc-600/50 hover:bg-zinc-600 transition-colors"
                >
                  <Play className="w-6 h-6 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pulsing animation for running state */}
        {state === 'running' && (
          <div className="absolute inset-0 rounded-full border-4 border-amber-500/50 animate-ping-slow" />
        )}
      </div>

      {/* Card Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-zinc-500 mb-1">{boardName}</p>
        <h2 className="text-xl font-semibold text-zinc-100">{cardTitle}</h2>
      </div>
    </div>
  );
}

interface SimpleTimerDisplayProps {
  formattedTime: string;
  state: 'idle' | 'running' | 'paused' | 'completed';
  className?: string;
}

/**
 * Smaller timer display for dashboard widgets
 */
export function SimpleTimerDisplay({
  formattedTime,
  state,
  className,
}: SimpleTimerDisplayProps) {
  return (
    <div
      className={cn(
        'font-mono text-2xl font-bold tabular-nums',
        {
          'text-amber-500': state === 'running',
          'text-zinc-400': state === 'paused',
          'text-zinc-500': state === 'idle' || state === 'completed',
        },
        className
      )}
    >
      {formattedTime}
    </div>
  );
}
