/**
 * Settings Hook
 * Manages Fizzy API tokens and accounts from IndexedDB
 * Supports multiple accounts with switching
 * Now using TanStack Query for efficient caching and state management
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { accountOps } from "../db/indexed-db";
import type { StoredAccount } from "../db/schema";
import {
	accountKeys,
	useAddAccount,
	useRemoveAccount,
	useSwitchAccount,
} from "../queries/useAccounts";
import { SETTINGS_KEYS, settingsOps } from "../services/settings";

export interface SettingsState {
	fizzyToken: string | null;
	accountSlug: string | null;
	userId: string | null;
	deviceId: string | null;
	isSetup: boolean;
	loading: boolean;
	// Multi-account
	accounts: StoredAccount[];
	activeAccount: StoredAccount | null;
}

export interface SettingsActions {
	setFizzyToken: (token: string) => Promise<void>;
	setAccountSlug: (slug: string) => Promise<void>;
	setUserId: (userId: string) => Promise<void>;
	clearSettings: () => Promise<void>;
	refresh: () => Promise<void>;
	// Multi-account actions
	switchAccount: (accountId: string) => Promise<void>;
	addAccount: (token: string) => Promise<void>;
	removeAccount: (accountId: string) => Promise<void>;
}

/**
 * Query keys for settings (device ID and legacy settings)
 */
const settingsKeys = {
	deviceId: ["settings", "deviceId"] as const,
} as const;

/**
 * Hook for managing app settings with multi-account support
 * Uses TanStack Query for efficient caching and state management
 */
export function useSettings(): SettingsState & SettingsActions {
	// Get device ID with Query (this rarely changes, long stale time)
	const { data: deviceId = null } = useQuery({
		queryKey: settingsKeys.deviceId,
		queryFn: async () => {
			return await settingsOps.getDeviceId();
		},
		staleTime: Number.POSITIVE_INFINITY, // Device ID never changes
		gcTime: Number.POSITIVE_INFINITY,
	});

	// Get all accounts
	const { data: accounts = [], isLoading: accountsLoading } = useQuery({
		queryKey: accountKeys.all,
		queryFn: async () => {
			const accs = await accountOps.getAll();
			return accs;
		},
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000,
	});

	// Get active account separately for more frequent updates
	const { data: activeAccount = null, isLoading: activeLoading } = useQuery({
		queryKey: accountKeys.active,
		queryFn: async () => {
			return await accountOps.getActive();
		},
		staleTime: 1 * 60 * 1000, // 1 minute - more frequent for active account
		gcTime: 10 * 60 * 1000,
	});

	// Use mutations
	const switchAccountMutation = useSwitchAccount();
	const addAccountMutation = useAddAccount();
	const removeAccountMutation = useRemoveAccount();

	// Legacy settings operations (kept for backward compatibility)
	const setFizzyToken = async (token: string) => {
		await settingsOps.set(SETTINGS_KEYS.FIZZY_API_TOKEN, token);
	};

	const setAccountSlug = async (slug: string) => {
		await settingsOps.set(SETTINGS_KEYS.ACCOUNT_SLUG, slug);
	};

	const setUserId = async (userId: string) => {
		await settingsOps.set(SETTINGS_KEYS.USER_ID, userId);
	};

	const clearSettings = async () => {
		await settingsOps.clearAll();
	};

	const refresh = async () => {
		// With TanStack Query, refresh is handled by query invalidation
		// This is kept for backward compatibility
		await Promise.all([
			window.location.reload(), // Simple reload to refetch all queries
		]);
	};

	/**
	 * Switch to a different account
	 * Auto-pauses timer if running (handled by caller)
	 */
	const switchAccount = useCallback(
		async (accountId: string) => {
			await switchAccountMutation.mutateAsync(accountId);
		},
		[switchAccountMutation],
	);

	/**
	 * Add a new account by token
	 * Validates token and fetches account info
	 */
	const addAccount = useCallback(
		async (token: string) => {
			try {
				await addAccountMutation.mutateAsync(token);
			} catch {
				// Error handling is done in the mutation
			}
		},
		[addAccountMutation],
	);

	/**
	 * Remove an account
	 * Sessions are kept in DB but won't be shown
	 */
	const removeAccount = useCallback(
		async (accountId: string) => {
			try {
				await removeAccountMutation.mutateAsync(accountId);
			} catch {
				// Error handling is done in the mutation
			}
		},
		[removeAccountMutation],
	);

	return {
		fizzyToken: activeAccount?.token ?? null,
		accountSlug: activeAccount?.slug ?? null,
		userId: activeAccount?.userId ?? null,
		deviceId,
		isSetup: !!activeAccount,
		loading: accountsLoading || activeLoading,
		accounts,
		activeAccount,
		setFizzyToken,
		setAccountSlug,
		setUserId,
		clearSettings,
		refresh,
		switchAccount,
		addAccount,
		removeAccount,
	};
}
