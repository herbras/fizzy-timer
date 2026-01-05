/**
 * Query Keys Factory
 * Centralized query keys for TanStack Query cache management
 */

import { accountOps, sessionOps } from '@/lib/db/indexed-db';
import type { Session, StoredAccount } from '@/lib/db/schema';

/**
 * Account Query Keys
 */
export const accountKeys = {
  all: ['accounts'] as const,
  active: ['accounts', 'active'] as const,
  detail: (id: string) => ['accounts', id] as const,
} as const;

/**
 * Session Query Keys
 */
export const sessionKeys = {
  all: (accountId?: string) => ['sessions', accountId ?? 'active'] as const,
  detail: (id: string) => ['sessions', id] as const,
  unsynced: (accountId?: string) => ['sessions', 'unsynced', accountId ?? 'active'] as const,
} as const;

/**
 * Query Functions for TanStack Query
 */
export const queryFunctions = {
  // Accounts
  getAccounts: async (): Promise<StoredAccount[]> => {
    return await accountOps.getAll();
  },
  getActiveAccount: async (): Promise<StoredAccount | null> => {
    return await accountOps.getActive();
  },
  getAccountById: async (id: string): Promise<StoredAccount | undefined> => {
    return await accountOps.getById(id);
  },

  // Sessions
  getSessions: async (accountId?: string): Promise<Session[]> => {
    return await sessionOps.getAll(accountId);
  },
  getSessionById: async (id: string): Promise<Session | undefined> => {
    return await sessionOps.getById(id);
  },
  getUnsyncedSessions: async (accountId?: string): Promise<Session[]> => {
    const targetAccountId = accountId ?? await (await accountOps.getActive())?.id;
    if (!targetAccountId) return [];
    const sessions = await sessionOps.getAll();
    return sessions.filter(s => s.accountId === targetAccountId && !s.synced);
  },
} as const;

/**
 * Mutation Functions for TanStack Query
 */
export const mutationFunctions = {
  // Account mutations
  addAccount: async (account: Omit<StoredAccount, 'id' | 'lastUsed'>) => {
    await accountOps.add(account);
  },
  switchAccount: async (accountId: string) => {
    await accountOps.setActive(accountId);
  },
  removeAccount: async (accountId: string) => {
    await accountOps.remove(accountId);
  },

  // Session mutations
  saveSession: async (session: Session) => {
    await sessionOps.save(session);
  },
  deleteSession: async (id: string) => {
    await sessionOps.delete(id);
  },
  deleteAllSessions: async () => {
    await sessionOps.deleteAll();
  },
} as const;
