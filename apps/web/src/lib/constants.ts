/**
 * App-wide constants
 */

// App info
export const APP_NAME = 'Fizzy Focus';
export const APP_VERSION = '1.0.0';

// Timer settings
export const MIN_SESSION_DURATION = 10; // seconds - minimum session duration to save
export const TIMER_UPDATE_INTERVAL = 1000; // ms - update timer every second

// Sync settings
export const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes - sync interval for optional backup

// Fizzy API
export const FIZZY_BASE_URL = 'https://app.fizzy.do/api/v1';
export const FIZZY_APP_URL = 'https://app.fizzy.do';

// Storage
export const STORAGE_KEYS = {
  TIMER_STATE: 'fizzy-timer-state',
  SETTINGS: 'fizzy-settings',
  BACKUP_PROMPT: 'fizzy-backup-prompt',
} as const;

// Board colors (matching Tailwind palette)
export const BOARD_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
] as const;

// Card status colors - dark theme compatible
export const STATUS_COLORS = {
  todo: 'status-todo',
  'in-progress': 'status-in-progress',
  done: 'status-done',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  SETUP: '/setup',
  FOCUS: '/focus',
  HISTORY: '/history',
  REPORT: '/report',
} as const;

// Pagination
export const CARDS_PER_PAGE = 20;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  DISPLAY_WITH_TIME: 'MMM d, yyyy HH:mm',
  SHORT: 'M/d/yy',
  INPUT: 'yyyy-MM-dd',
} as const;
