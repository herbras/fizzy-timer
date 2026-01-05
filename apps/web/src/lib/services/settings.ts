/**
 * Settings service - exports the database settings and account operations
 * Re-exports from indexed-db.ts for convenience
 */

export { settingsOps, accountOps } from '../db/indexed-db';

// Constants for setting keys (legacy, kept for reference)
export const SETTINGS_KEYS = {
  FIZZY_API_TOKEN: 'fizzy-api-token',
  ACCOUNT_SLUG: 'account-slug',
  USER_ID: 'user-id',
  DEVICE_ID: 'device-id',
} as const;
