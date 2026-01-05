/**
 * Sessions Hook
 * Manages tracking sessions (CRUD operations with IndexedDB)
 * Now using TanStack Query for efficient caching and state management
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { sessionOps } from '../db/indexed-db';
import { useSessions as useSessionsQuery, useDeleteSession as useDeleteSessionMutation } from '../queries/useSessions';
import type { Session } from '../db/schema';

/**
 * Hook for managing sessions (legacy - kept for backward compatibility)
 * For new code, use the query hooks from @/lib/queries/useSessions instead
 */
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const allSessions = await sessionOps.getAll();
      setSessions(allSessions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveSession = useCallback(async (session: Session) => {
    await sessionOps.save(session);
    await refresh();
  }, [refresh]);

  const deleteSession = useCallback(async (id: string) => {
    await sessionOps.delete(id);
    await refresh();
  }, [refresh]);

  const getSessionsByCardId = useCallback(
    (cardId: string) => sessions.filter((s) => s.cardId === cardId),
    [sessions]
  );

  const getSessionsByBoardId = useCallback(
    (boardId: string) => sessions.filter((s) => s.boardId === boardId),
    [sessions]
  );

  return {
    sessions,
    loading,
    refresh,
    saveSession,
    deleteSession,
    getSessionsByCardId,
    getSessionsByBoardId,
  };
}

/**
 * Hook for getting today's sessions (uses TanStack Query)
 */
export function useTodaySessions() {
  const { data: sessions = [], isLoading: loading } = useSessionsQuery();

  const todaySessions = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return sessions.filter((s) => s.startTime >= todayStart.getTime());
  }, [sessions]);

  const totalTodaySeconds = todaySessions.reduce((acc, s) => acc + s.duration, 0);

  return {
    sessions: todaySessions,
    allSessions: sessions,
    totalTodaySeconds,
    loading,
    refresh: () => window.location.reload(), // Simple reload to refetch
    deleteSession: (id: string) => sessionOps.delete(id), // Direct operation
  };
}

/**
 * Hook for getting sessions grouped by date (uses TanStack Query)
 * Sessions with same card on same date are merged into one entry
 */
export function useSessionsByDate() {
  const { data: sessions = [], isLoading: loading } = useSessionsQuery();
  const deleteSessionMutation = useDeleteSessionMutation();

  // Group sessions by date and card, then merge durations
  const grouped = useMemo(() => {
    // First, group by date
    const byDate: Record<string, Session[]> = sessions.reduce((acc, session) => {
      const date = new Date(session.startTime);
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(session);
      return acc;
    }, {} as Record<string, Session[]>);

    // Then, merge sessions with same card within each date
    const merged: Record<string, Session[]> = {};
    for (const [dateKey, dateSessions] of Object.entries(byDate)) {
      const cardMap = new Map<string, { session: Session; count: number; ids: string[] }>();

      for (const session of dateSessions) {
        const cardKey = `${session.cardId}-${session.boardId}`;

        if (cardMap.has(cardKey)) {
          // Merge with existing session
          const existing = cardMap.get(cardKey)!;
          existing.session.duration += session.duration;
          existing.session.startTime = Math.min(existing.session.startTime, session.startTime);
          if (session.endTime) {
            existing.session.endTime = Math.max(existing.session.endTime || 0, session.endTime);
          }
          existing.count += 1;
          existing.ids.push(session.id);
        } else {
          // Add new session
          cardMap.set(cardKey, { session: { ...session }, count: 1, ids: [session.id] });
        }
      }

      // Convert map to array and add sessionCount to each session
      merged[dateKey] = Array.from(cardMap.values()).map(({ session, count, ids }) => ({
        ...session,
        sessionCount: count,
        mergedIds: ids.length > 1 ? ids : undefined,
      }));
    }

    return merged;
  }, [sessions]);

  // Sort dates descending (newest first)
  const dates = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [grouped]);

  // Delete session with mutation - delete all merged sessions
  const deleteSession = useCallback(async (id: string) => {
    // Find the session and check if it has merged IDs
    for (const dateSessions of Object.values(grouped)) {
      const session = dateSessions.find(s => s.id === id);
      if (session?.mergedIds) {
        // Delete all merged sessions
        await Promise.all(session.mergedIds.map(sid => deleteSessionMutation.mutateAsync(sid)));
      } else {
        await deleteSessionMutation.mutateAsync(id);
      }
      break;
    }
  }, [grouped, deleteSessionMutation]);

  return {
    grouped,
    dates,
    loading,
    refresh: () => window.location.reload(), // Simple reload to refetch
    deleteSession,
  };
}

/**
 * Create a new session object
 * Requires accountId and userId for multi-account support
 */
export function createSession(
  cardId: string,
  cardTitle: string,
  cardNumber: number,
  boardId: string,
  boardName: string,
  accountId: string,
  userId: string
): Omit<Session, 'duration'> {
  return {
    id: crypto.randomUUID(),
    accountId,
    userId,
    cardId,
    cardTitle,
    cardNumber,
    boardId,
    boardName,
    startTime: Date.now(),
    synced: false,
  };
}

/**
 * Complete a session with duration
 */
export function completeSession(session: Omit<Session, 'duration'>): Session {
  const endTime = Date.now();
  const duration = Math.floor((endTime - session.startTime) / 1000);

  return {
    ...session,
    endTime,
    duration,
  };
}
