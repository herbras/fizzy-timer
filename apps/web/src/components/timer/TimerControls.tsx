/**
 * Timer Controls Component
 * Play/pause/stop buttons for the timer
 */

import { cn } from '@/lib/utils';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface TimerControlsProps {
  state: 'idle' | 'running' | 'paused' | 'completed';
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  loading?: boolean;
  className?: string;
}

const baseButtonClass =
  'rounded-full border transition-all flex items-center justify-center';

export function TimerControls({
  state,
  onPause,
  onResume,
  onStop,
  onReset,
  loading = false,
  className,
}: TimerControlsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {state === 'running' && (
        <>
          <ButtonPrimitive
            className={cn(baseButtonClass, 'w-16 h-16 border-gray-300 bg-white hover:bg-gray-50')}
            onClick={onPause}
            disabled={loading}
          >
            <Pause className="w-6 h-6" />
          </ButtonPrimitive>
          <ButtonPrimitive
            className={cn(baseButtonClass, 'w-16 h-16 border-red-300 bg-red-50 hover:bg-red-100 text-red-600')}
            onClick={onStop}
            disabled={loading}
          >
            <Square className="w-6 h-6" />
          </ButtonPrimitive>
        </>
      )}

      {state === 'paused' && (
        <>
          <ButtonPrimitive
            className={cn(baseButtonClass, 'w-16 h-16 bg-teal-500 hover:bg-teal-600 text-white border-transparent')}
            onClick={onResume}
            disabled={loading}
          >
            <Play className="w-6 h-6 ml-1" />
          </ButtonPrimitive>
          <ButtonPrimitive
            className={cn(baseButtonClass, 'w-16 h-16 border-gray-300 bg-white hover:bg-gray-50')}
            onClick={onReset}
            disabled={loading}
          >
            <RotateCcw className="w-6 h-6" />
          </ButtonPrimitive>
          <ButtonPrimitive
            className={cn(baseButtonClass, 'w-16 h-16 border-red-300 bg-red-50 hover:bg-red-100 text-red-600')}
            onClick={onStop}
            disabled={loading}
          >
            <Square className="w-6 h-6" />
          </ButtonPrimitive>
        </>
      )}

      {state === 'completed' && onReset && (
        <ButtonPrimitive
          className={cn(baseButtonClass, 'px-6 h-12 border-gray-300 bg-white hover:bg-gray-50')}
          onClick={onReset}
          disabled={loading}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Start New Session
        </ButtonPrimitive>
      )}
    </div>
  );
}

interface CompactTimerControlsProps {
  state: 'idle' | 'running' | 'paused' | 'completed';
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  className?: string;
}

/**
 * Compact version for smaller displays
 */
export function CompactTimerControls({
  state,
  onPause,
  onResume,
  onStop,
  className,
}: CompactTimerControlsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {state === 'running' && (
        <>
          <ButtonPrimitive
            className="px-3 h-8 border border-gray-300 bg-white hover:bg-gray-50 rounded flex items-center gap-1"
            onClick={onPause}
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </ButtonPrimitive>
          <ButtonPrimitive
            className="px-3 h-8 border border-red-300 bg-red-50 hover:bg-red-100 text-red-600 rounded flex items-center gap-1"
            onClick={onStop}
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </ButtonPrimitive>
        </>
      )}

      {state === 'paused' && (
        <>
          <ButtonPrimitive
            className="px-3 h-8 bg-teal-500 hover:bg-teal-600 text-white border-transparent rounded flex items-center gap-1"
            onClick={onResume}
          >
            <Play className="w-4 h-4" />
            <span>Resume</span>
          </ButtonPrimitive>
          <ButtonPrimitive
            className="px-3 h-8 border border-red-300 bg-red-50 hover:bg-red-100 text-red-600 rounded flex items-center gap-1"
            onClick={onStop}
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </ButtonPrimitive>
        </>
      )}
    </div>
  );
}
