/**
 * Session Item Component
 * Displays a single tracking session
 * Dark Theme with Gold/Amber Accent
 */

import { cn } from '@/lib/utils';
import type { Session } from '@/lib/db/schema';
import { formatDuration, formatDate, formatTime } from '@/lib/utils/time';
import { Trash2 } from 'lucide-react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';

interface SessionItemProps {
  session: Session;
  onDelete?: (id: string) => void;
  showDate?: boolean;
  className?: string;
}

const deleteButtonClass =
  'text-zinc-500 hover:text-red-500 hover:bg-red-500/10 flex-shrink-0 flex items-center justify-center p-2 rounded-xl transition-colors';

export function SessionItem({ session, onDelete, showDate = false, className }: SessionItemProps) {
  const sessionCount = session.sessionCount || 1;

  return (
    <div
      className={cn(
        'p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 shadow-sm hover:shadow-md hover:border-zinc-700/50 transition-all',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Session Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-zinc-100 truncate text-sm">{session.cardTitle}</h4>
            {sessionCount > 1 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-500 rounded-full">
                {sessionCount}x
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wide mt-0.5">
            #{session.cardNumber} • {session.boardName}
          </p>

          {/* Time Info */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs font-mono font-medium text-zinc-500">
              {formatTime(session.startTime)}
            </span>
            <span className="text-zinc-700">→</span>
            {session.endTime && (
              <span className="text-xs font-mono text-zinc-500">{formatTime(session.endTime)}</span>
            )}
            <span className="ml-auto text-sm font-mono font-bold text-amber-500">
              {formatDuration(session.duration)}
            </span>
          </div>

          {/* Notes */}
          {session.notes && (
            <p className="mt-2 text-xs text-zinc-500 italic bg-zinc-800/50 rounded-lg px-2 py-1.5 line-clamp-2 border border-zinc-800/30">
              "{session.notes}"
            </p>
          )}
        </div>

        {/* Delete Button */}
        {onDelete && (
          <ButtonPrimitive
            className={deleteButtonClass}
            onClick={() => onDelete(session.id)}
          >
            <Trash2 className="w-4 h-4" />
          </ButtonPrimitive>
        )}
      </div>
    </div>
  );
}

interface SessionGroupProps {
  date: string;
  sessions: Session[];
  onDelete?: (id: string) => void;
  className?: string;
}

export function SessionGroup({ date, sessions, onDelete, className }: SessionGroupProps) {
  const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className={cn('mb-6', className)}>
      {/* Group Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-600">{date}</h3>
        <span className="text-xs font-bold text-amber-500">
          {formatDuration(totalDuration)}
        </span>
      </div>

      {/* Sessions */}
      <div className="space-y-2">
        {sessions.map((session) => (
          <SessionItem key={session.id} session={session} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

interface SessionListProps {
  sessions: Session[];
  grouped?: Record<string, Session[]>;
  onDelete?: (id: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function SessionList({
  sessions,
  grouped,
  onDelete,
  loading,
  emptyMessage = 'Belum ada sesi',
  className,
}: SessionListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 animate-pulse"
          >
            <div className="h-4 bg-zinc-800 rounded-full w-3/4 mb-3" />
            <div className="h-3 bg-zinc-800 rounded-full w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex p-4 bg-zinc-900 rounded-3xl shadow-sm border border-zinc-800/50 mb-4">
          <span className="text-4xl">📊</span>
        </div>
        <p className="text-zinc-600 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  if (grouped) {
    const sortedDates = Object.keys(grouped).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return (
      <div className={className}>
        {sortedDates.map((date) => (
          <SessionGroup
            key={date}
            date={date}
            sessions={grouped[date]}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionItem key={session.id} session={session} onDelete={onDelete} showDate />
      ))}
    </div>
  );
}
