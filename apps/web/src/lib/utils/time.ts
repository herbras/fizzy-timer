/**
 * Time utilities
 */

import {
	format,
	formatDistanceToNow,
	isToday,
	isYesterday,
	startOfDay,
} from "date-fns";
import type { Session } from "../db/schema";

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m ${secs}s`;
	}
	if (minutes > 0) {
		return `${minutes}m ${secs}s`;
	}
	return `${secs}s`;
}

/**
 * Format duration in seconds to HH:MM:SS
 */
export function formatDurationClock(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}
	return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format timestamp to readable string
 */
export function formatTime(timestamp: number): string {
	return format(new Date(timestamp), "HH:mm");
}

/**
 * Format date to readable string
 */
export function formatDate(timestamp: number): string {
	const date = new Date(timestamp);

	if (isToday(date)) {
		return "Today";
	}
	if (isYesterday(date)) {
		return "Yesterday";
	}
	return format(date, "MMM d, yyyy");
}

/**
 * Format date and time
 */
export function formatDateTime(timestamp: number): string {
	return format(new Date(timestamp), "MMM d, yyyy HH:mm");
}

/**
 * Get start of today in milliseconds
 */
export function getTodayStart(): number {
	return startOfDay(new Date()).getTime();
}

/**
 * Get start of a specific date in milliseconds
 */
export function getDateStart(date: Date): number {
	return startOfDay(date).getTime();
}

/**
 * Group sessions by date
 */
export function groupSessionsByDate(
	sessions: Session[],
): Record<string, Session[]> {
	return sessions.reduce(
		(acc, session) => {
			const dateKey = formatDate(session.startTime);
			if (!acc[dateKey]) {
				acc[dateKey] = [];
			}
			acc[dateKey].push(session);
			return acc;
		},
		{} as Record<string, Session[]>,
	);
}

/**
 * Calculate total duration from sessions
 */
export function totalDuration(sessions: Session[]): number {
	return sessions.reduce((acc, s) => acc + s.duration, 0);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
	return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Get date key for grouping (YYYY-MM-DD format)
 */
export function getDateKey(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toISOString().split("T")[0];
}

/**
 * Check if session is from today
 */
export function isFromToday(session: Session): boolean {
	return isToday(new Date(session.startTime));
}

/**
 * Get week start timestamp
 */
export function getWeekStart(): number {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - dayOfWeek);
	weekStart.setHours(0, 0, 0, 0);
	return weekStart.getTime();
}

/**
 * Get month start timestamp
 */
export function getMonthStart(): number {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}
