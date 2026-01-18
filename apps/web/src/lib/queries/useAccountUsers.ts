/**
 * Account Users Hook
 * Fetches and caches list of users from Fizzy account
 * Used for filtering reports by user
 */

import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/lib/hooks/useSettings";
import type { FizzyUser } from "@/lib/services/fizzy";
import { createFizzyClient } from "@/lib/services/fizzy";

/**
 * Query keys for account users
 */
const accountUsersKeys = {
	all: ["accountUsers"] as const,
	forAccount: (accountSlug: string | null) =>
		["accountUsers", accountSlug] as const,
};

/**
 * Hook for fetching users from the active account
 */
export function useAccountUsers() {
	const { activeAccount } = useSettings();

	return useQuery({
		queryKey: accountUsersKeys.forAccount(activeAccount?.slug ?? null),
		queryFn: async () => {
			if (!activeAccount?.slug || !activeAccount?.token) {
				return [];
			}

			const client = createFizzyClient(activeAccount.token);
			const users = await client.getUsers(activeAccount.slug);

			return users;
		},
		enabled: !!activeAccount?.slug && !!activeAccount?.token,
		staleTime: 10 * 60 * 1000, // 10 minutes - user list doesn't change often
		gcTime: 30 * 60 * 1000, // 30 minutes cache
		retry: 1,
	});
}

/**
 * Export types and utilities
 */
export type { FizzyUser };
export { accountUsersKeys };
