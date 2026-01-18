import type { Table } from "dexie";
import Dexie from "dexie";
import type { Session, StoredAccount, UserSettings } from "./schema";

/**
 * Delete the entire database - use for debugging/fresh start
 */
export async function deleteDatabase() {
	await Dexie.delete("FizzyFocusDB");
	console.log("[DB] Database deleted");
}

/**
 * Fizzy Focus IndexedDB database using Dexie
 * Stores sessions, accounts, and user settings locally
 */
export class FizzyDB extends Dexie {
	sessions!: Table<Session>;
	settings!: Table<UserSettings>;
	accounts!: Table<StoredAccount>;

	constructor() {
		super("FizzyFocusDB");

		// Define database schema and indexes
		this.version(1).stores({
			sessions: "id, startTime, boardId, synced",
			settings: "key",
		});

		// Version 2: Add multi-account support
		this.version(2)
			.stores({
				sessions: "id, accountId, userId, startTime, boardId, synced",
				settings: "key",
				accounts: "id, isActive, lastUsed",
			})
			.upgrade(async (tx) => {
				// Migration: Add accountId to existing sessions
				console.log(
					"[DB Migration] Upgrading to v2 - adding multi-account support",
				);

				// Get existing account info from settings
				const settingsTable = tx.table<UserSettings>("settings");
				const token = await settingsTable.get("fizzy-api-token");
				const slug = await settingsTable.get("account-slug");
				const userId = await settingsTable.get("user-id");

				if (token && slug && userId) {
					// Create first account from existing settings
					const accountId = slug.value; // Use slug as account ID
					const accountsTable = tx.table<StoredAccount>("accounts");

					await accountsTable.add({
						id: accountId,
						token: token.value,
						slug: slug.value,
						userId: userId.value,
						name: slug.value, // Use slug as name initially
						isActive: true,
						lastUsed: Date.now(),
					});

					// Update all existing sessions with accountId and userId
					const sessionsTable = tx.table<Session>("sessions");
					const sessions = await sessionsTable.toArray();

					for (const session of sessions) {
						await sessionsTable.update(session.id, {
							accountId: accountId,
							userId: userId.value,
						} as Partial<Session>);
					}

					console.log(
						"[DB Migration] Migrated",
						sessions.length,
						"sessions to account",
						accountId,
					);
				} else {
					console.log(
						"[DB Migration] No existing account found, skipping session migration",
					);
				}
			});
	}
}

// Export singleton instance
export const db = new FizzyDB();

// Get the active account ID
async function getActiveAccountId(): Promise<string | null> {
	try {
		const accounts = await db.accounts.toArray();
		const activeAccount = accounts.find((a) => a.isActive);
		return activeAccount?.id ?? null;
	} catch (e) {
		console.error("[getActiveAccountId] Error:", e);
		return null;
	}
}

// Session operations
export const sessionOps = {
	async getAll(accountId?: string): Promise<Session[]> {
		try {
			const targetAccountId = accountId ?? (await getActiveAccountId());
			if (!targetAccountId) return [];
			// Use toArray() then filter and sort in JS
			const sessions = await db.sessions.toArray();
			return sessions
				.filter((s) => s.accountId === targetAccountId)
				.sort((a, b) => b.startTime - a.startTime);
		} catch (e) {
			console.error("[sessionOps.getAll] Error:", e);
			return [];
		}
	},

	async getById(id: string): Promise<Session | undefined> {
		return await db.sessions.get(id);
	},

	async save(session: Session): Promise<void> {
		await db.sessions.put(session);
	},

	async delete(id: string): Promise<void> {
		await db.sessions.delete(id);
	},

	async deleteAll(): Promise<void> {
		const targetAccountId = await getActiveAccountId();
		if (targetAccountId) {
			const sessions = await db.sessions.toArray();
			for (const session of sessions) {
				if (session.accountId === targetAccountId) {
					await db.sessions.delete(session.id);
				}
			}
		}
	},

	async getUnsynced(): Promise<Session[]> {
		try {
			const targetAccountId = await getActiveAccountId();
			if (!targetAccountId) return [];
			const sessions = await db.sessions.toArray();
			return sessions.filter(
				(s) => s.accountId === targetAccountId && !s.synced,
			);
		} catch (e) {
			console.error("[sessionOps.getUnsynced] Error:", e);
			return [];
		}
	},

	async markAsSynced(id: string): Promise<void> {
		await db.sessions.update(id, { synced: true });
	},
};

// Account operations for multi-account support
export const accountOps = {
	async getAll(): Promise<StoredAccount[]> {
		try {
			// Use toArray() then sort in JS to avoid IDBKeyRange bound error
			const accounts = await db.accounts.toArray();
			return accounts.sort((a, b) => b.lastUsed - a.lastUsed);
		} catch (e) {
			console.error("[accountOps.getAll] Error:", e);
			return [];
		}
	},

	async getActive(): Promise<StoredAccount | null> {
		try {
			const accounts = await db.accounts.toArray();
			return accounts.find((a) => a.isActive) ?? null;
		} catch (e) {
			console.error("[accountOps.getActive] Error:", e);
			return null;
		}
	},

	async getById(id: string): Promise<StoredAccount | undefined> {
		return await db.accounts.get(id);
	},

	async add(account: Omit<StoredAccount, "id" | "lastUsed">): Promise<string> {
		const id = account.slug; // Use slug as ID
		const newAccount: StoredAccount = {
			...account,
			id,
			lastUsed: Date.now(),
		};
		await db.accounts.put(newAccount);
		return id;
	},

	async setActive(accountId: string): Promise<void> {
		await db.transaction("rw", db.accounts, async () => {
			// Deactivate all accounts
			await db.accounts.toCollection().modify({ isActive: false });
			// Activate the selected account
			await db.accounts.update(accountId, {
				isActive: true,
				lastUsed: Date.now(),
			});
		});
	},

	async remove(accountId: string): Promise<void> {
		await db.accounts.delete(accountId);
		// Note: Sessions are NOT deleted - they remain in DB but won't be shown
	},

	async switchTo(accountId: string): Promise<StoredAccount | null> {
		await this.setActive(accountId);
		return await this.getActive();
	},
};

// Settings operations (legacy, kept for backward compatibility)
export const settingsOps = {
	async get(key: string): Promise<string | null> {
		const setting = await db.settings.get(key);
		return setting?.value ?? null;
	},

	async set(key: string, value: string): Promise<void> {
		await db.settings.put({ key, value, updatedAt: Date.now() });
	},

	async delete(key: string): Promise<void> {
		await db.settings.delete(key);
	},

	async clearAll(): Promise<void> {
		await db.settings.clear();
	},

	// These now use the active account from accounts table
	async getFizzyToken(): Promise<string | null> {
		const activeAccount = await accountOps.getActive();
		return activeAccount?.token ?? null;
	},

	async getAccountSlug(): Promise<string | null> {
		const activeAccount = await accountOps.getActive();
		return activeAccount?.slug ?? null;
	},

	async getDeviceId(): Promise<string | null> {
		let deviceId = await this.get("device-id");
		if (!deviceId) {
			// Generate and store device ID
			deviceId = crypto.randomUUID();
			await this.set("device-id", deviceId);
		}
		return deviceId;
	},

	async getUserId(): Promise<string | null> {
		const activeAccount = await accountOps.getActive();
		return activeAccount?.userId ?? null;
	},
};
