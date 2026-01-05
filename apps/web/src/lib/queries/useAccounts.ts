/**
 * Account Query Hooks
 * TanStack Query hooks for account management with proper caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountOps } from '@/lib/db/indexed-db';
import { testToken, createFizzyClient } from '@/lib/services/fizzy';
import { toast } from 'sonner';
import type { StoredAccount } from '@/lib/db/schema';

/**
 * Query keys factory for accounts
 */
export const accountKeys = {
  all: ['accounts'] as const,
  active: ['accounts', 'active'] as const,
  detail: (id: string) => ['accounts', id] as const,
} as const;

/**
 * Hook: Get all accounts
 * Local data, long cache time
 */
export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: async () => {
      const accounts = await accountOps.getAll();
      // Sort by lastUsed descending (most recent first)
      return accounts.sort((a, b) => b.lastUsed - a.lastUsed);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - local data rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook: Get active account
 */
export function useActiveAccount() {
  return useQuery({
    queryKey: accountKeys.active,
    queryFn: async () => {
      const active = await accountOps.getActive();
      return active;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook: Add new account
 * Validates token and fetches account info before adding
 */
export function useAddAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      // Validate token
      const isValid = await testToken(token);
      if (!isValid) {
        throw new Error('Invalid API token. Please check and try again.');
      }

      // Fetch account info
      const client = createFizzyClient(token);
      const result = await client.getIdentity();

      if (!result.accounts || result.accounts.length === 0) {
        throw new Error('No accounts found for this token');
      }

      // Use the first account (most common case)
      const fizzyAccount = result.accounts[0];
      const slug = fizzyAccount.slug.replace(/^\//, '');

      // Check if account already exists
      const existing = await accountOps.getById(slug);
      if (existing) {
        throw new Error('This account is already connected');
      }

      // Add the account (not active by default, let user switch manually)
      await accountOps.add({
        token,
        slug,
        userId: fizzyAccount.user.id,
        name: fizzyAccount.name || slug,
        isActive: false,
      });

      return { id: slug, name: fizzyAccount.name || slug };
    },
    onSuccess: (data) => {
      // Invalidate accounts query to refetch
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success(`Account "${data.name}" added! You can now switch to it.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add account');
    },
  });
}

/**
 * Hook: Switch to a different account
 */
export function useSwitchAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const account = await accountOps.getById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      await accountOps.setActive(accountId);
      return account;
    },
    onSuccess: (account) => {
      // Invalidate both accounts and active account queries
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.active });
      toast.success(`Switched to ${account.name}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to switch account');
    },
  });
}

/**
 * Hook: Remove an account
 */
export function useRemoveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const account = await accountOps.getById(accountId);
      const isActive = account?.isActive;

      await accountOps.remove(accountId);

      // If we removed the active account, check if we need to switch to another
      if (isActive) {
        const remainingAccounts = await accountOps.getAll();
        if (remainingAccounts.length > 0) {
          // Switch to the most recently used account
          await accountOps.setActive(remainingAccounts[0].id);
          return { removed: account, needsSwitch: true, newAccount: remainingAccounts[0] };
        }
        return { removed: account, needsSwitch: false, newAccount: null };
      }

      return { removed: account, needsSwitch: false, newAccount: null };
    },
    onSuccess: (result) => {
      // Invalidate both accounts and active account queries
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.active });

      if (result.needsSwitch && result.newAccount) {
        toast.info(`Switched to ${result.newAccount.name}`);
      } else if (result.needsSwitch && !result.newAccount) {
        toast.info('All accounts removed. Please set up a new account.');
      } else {
        toast.success('Account removed');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove account');
    },
  });
}
