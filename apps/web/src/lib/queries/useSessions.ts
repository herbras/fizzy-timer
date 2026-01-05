/**
 * Session Query Hooks
 * TanStack Query hooks for session management with proper caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionOps } from '@/lib/db/indexed-db';
import { accountOps } from '@/lib/db/indexed-db';
import type { Session } from '@/lib/db/schema';

/**
 * Query keys factory for sessions
 * IMPORTANT: Keep keys stable - use 'all' for active account, or specific accountId
 */
export const sessionKeys = {
  all: 'sessions' as const,
  forAccount: (accountId: string) => ['sessions', accountId] as const,
  detail: (id: string) => ['sessions', 'detail', id] as const,
  unsynced: 'sessions-unsynced' as const,
  unsyncedForAccount: (accountId: string) => ['sessions', 'unsynced', accountId] as const,
} as const;

/**
 * Helper to get the current account ID for queries
 */
async function getCurrentAccountId(): Promise<string | null> {
  const activeAccount = await accountOps.getActive();
  return activeAccount?.id ?? null;
}

/**
 * Hook: Get all sessions for the active account
 * Uses 5 minute stale time - data is cached locally so no need to refetch often
 */
export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: async () => {
      const targetAccountId = await getCurrentAccountId();
      if (!targetAccountId) return [];

      const sessions = await sessionOps.getAll(targetAccountId);
      return sessions;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - sessions are local, no need to refetch
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data is fresh
  });
}

/**
 * Hook: Get unsynced sessions
 */
export function useUnsyncedSessions() {
  return useQuery({
    queryKey: sessionKeys.unsynced,
    queryFn: async () => {
      const targetAccountId = await getCurrentAccountId();
      if (!targetAccountId) return [];

      const sessions = await sessionOps.getUnsynced();
      return sessions;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: true,
  });
}

/**
 * Hook: Get session by ID
 */
export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: async () => {
      const session = await sessionOps.getById(id);
      return session ?? null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook: Save a session (create or update)
 */
export function useSaveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Session) => {
      await sessionOps.save(session);
      return session;
    },
    onSuccess: (_, session) => {
      // Invalidate the sessions list - use setQueryData to update cache immediately
      queryClient.invalidateQueries({
        queryKey: sessionKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.unsynced,
      });
    },
  });
}

/**
 * Hook: Delete a session
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await sessionOps.delete(id);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.unsynced,
      });
    },
  });
}

/**
 * Hook: Delete all sessions for the active account
 */
export function useDeleteAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await sessionOps.deleteAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.unsynced,
      });
    },
  });
}

/**
 * Hook: Mark session as synced
 */
export function useMarkSessionSynced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await sessionOps.markAsSynced(id);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.unsynced,
      });
    },
  });
}
