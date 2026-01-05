/**
 * Duration Selector Component
 * Allows user to select focus duration before starting timer
 */

import { cn } from '@/lib/utils';

export const TIMER_PRESETS = [
  { label: '25m', value: 25 * 60, display: '25 menit' },
  { label: '50m', value: 50 * 60, display: '50 menit' },
  { label: '1j', value: 60 * 60, display: '1 jam' },
  { label: '1.5j', value: 90 * 60, display: '1,5 jam' },
  { label: '2j', value: 120 * 60, display: '2 jam' },
  { label: '∞', value: undefined, display: 'Tanpa batas' },
] as const;

interface DurationSelectorProps {
  selectedDuration: number | undefined;
  onSelect: (duration: number | undefined) => void;
  disabled?: boolean;
}

export function DurationSelector({ selectedDuration, onSelect, disabled }: DurationSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="group" aria-label="Pilih durasi fokus">
      {TIMER_PRESETS.map((preset) => {
        const isSelected = selectedDuration === preset.value;
        return (
          <button
            key={preset.label}
            onClick={() => onSelect(preset.value)}
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={preset.display}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all",
              "border-2",
              isSelected
                ? "bg-amber-500 text-black border-amber-500"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
