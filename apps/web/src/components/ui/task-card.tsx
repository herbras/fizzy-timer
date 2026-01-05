/**
 * Task Card Component
 * Displays a Fizzy card with status, metadata, and time credit
 * Dark Theme with Gold/Amber Accent
 * WCAG AA Compliant
 */

import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import type { Card } from '@/lib/db/schema';
import { Link } from '@tanstack/react-router';
import { Star, User, Play, Clock } from 'lucide-react';

interface TaskCardProps {
  card: Card;
  boardName?: string;
  boardColor?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  showBoard?: boolean;
  totalSeconds?: number; // Total time credit for this card
}

const statusStyles: Record<Card['status'], string> = {
  todo: 'status-todo',
  'in-progress': 'status-in-progress',
  done: 'status-done',
};

const statusLabels: Record<Card['status'], string> = {
  todo: 'Akan Dikerjakan',
  'in-progress': 'Sedang Dikerjakan',
  done: 'Selesai',
};

// Format seconds to human readable time
function formatTimeCredit(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function TaskCard({
  card,
  boardName,
  boardColor,
  to,
  onClick,
  className,
  showBoard = true,
  totalSeconds = 0,
}: TaskCardProps) {
  const content = (
    <div className="flex gap-3 sm:gap-4">
      {/* Left: Card Info */}
      <div className="flex-1 min-w-0">
        {/* Status & Number */}
        <div className="flex items-center gap-2 mb-2">
          {card.golden && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" aria-label="Golden card" />
          )}
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" aria-label="Card number">
            #{card.number}
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide flex-shrink-0',
              statusStyles[card.status]
            )}
            aria-label={`Status: ${statusLabels[card.status]}`}
          >
            {statusLabels[card.status]}
          </span>
        </div>

        {/* Column Name */}
        <div className="text-[10px] font-semibold text-zinc-500 mb-1 truncate uppercase tracking-wide">
          {card.columnName}
        </div>

        {/* Card Title - High contrast for WCAG AA */}
        <h3 className="font-bold text-white mb-2 leading-snug break-words line-clamp-2">
          {card.title}
        </h3>

        {/* Owner */}
        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
          <User className="w-3 h-3" aria-hidden="true" />
          <span className="truncate">{card.creatorName}</span>
          {card.isOwner && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[8px] font-bold border border-amber-500/30" aria-label="Your card">
              YOU
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
          {showBoard && card.boardName && (
            <span
              className="text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap max-w-[100px] sm:max-w-[120px] truncate inline-block"
              style={{
                color: boardColor || '#a1a1aa',
                backgroundColor: `${boardColor || '#71717a'}20`,
                borderColor: `${boardColor || '#71717a'}40`,
              }}
            >
              {card.boardName}
            </span>
          )}
          {card.tags.length > 0 && (
            <div className="flex gap-1 overflow-hidden">
              {card.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wide bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 flex-shrink-0"
                >
                  {tag}
                </span>
              ))}
              {card.tags.length > 2 && (
                <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wide bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 flex-shrink-0">
                  +{card.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Time Credit & Play Button */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {/* Time Credit Display */}
        {totalSeconds > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <Clock className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-bold text-emerald-400 tabular-nums" aria-label={`Total time: ${formatTimeCredit(totalSeconds)}`}>
              {formatTimeCredit(totalSeconds)}
            </span>
          </div>
        )}

        {/* Play Button */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-800/60 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:bg-amber-500 group-hover:text-black transition-all flex-shrink-0 border border-zinc-700/60 group-hover:border-amber-500" aria-label="Start timer">
          <Play size={18} sm:size={20} fill="currentColor" className="ml-0.5" />
        </div>
      </div>
    </div>
  );

  const cardClass = cn(
    // Base styles - Dark card bevel effect
    'p-5 card-bevel rounded-2xl',
    // Hover effects
    'group cursor-pointer transition-all duration-200',
    className
  );

  if (to) {
    return (
      <Link to={to} className={cardClass}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cardClass}>
      {content}
    </button>
  );
}

interface TaskCardListProps {
  cards: Card[];
  boardsMap?: Map<string, { name: string; color: string }>;
  onCardClick?: (card: Card) => void;
  loading?: boolean;
  className?: string;
  cardTimes?: Map<string, number>; // Map cardId -> total seconds
}

export function TaskCardList({
  cards,
  boardsMap,
  onCardClick,
  loading,
  className,
  cardTimes,
}: TaskCardListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 animate-pulse"
          >
            <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-zinc-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12" role="status" aria-live="polite">
        <p className="text-zinc-500">Tidak ada kartu ditemukan</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {cards.map((card) => {
        const board = boardsMap?.get(card.boardId);
        const totalSeconds = cardTimes?.get(card.id) || 0;
        return (
          <TaskCard
            key={card.id}
            card={card}
            boardName={board?.name}
            boardColor={board?.color}
            totalSeconds={totalSeconds}
            onClick={() => onCardClick?.(card)}
          />
        );
      })}
    </div>
  );
}
