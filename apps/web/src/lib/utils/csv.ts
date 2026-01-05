/**
 * CSV utilities
 */

import type { Session } from '../db/schema';

/**
 * Convert sessions to CSV format
 */
export function sessionsToCSV(sessions: Session[]): string {
  const headers = ['Date', 'Start Time', 'End Time', 'Duration (seconds)', 'Duration', 'Board', 'Card', 'Notes'];

  const rows = sessions.map((session) => {
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime || session.startTime + session.duration * 1000);

    return [
      startDate.toLocaleDateString(),
      startDate.toLocaleTimeString(),
      endDate.toLocaleTimeString(),
      session.duration.toString(),
      formatDuration(session.duration),
      session.boardName,
      session.cardTitle,
      session.notes || '',
    ].map((field) => `"${field.replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${secs}s`;
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate default filename for CSV export
 */
export function generateCSVFilename(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return `fizzy-focus-export-${dateStr}.csv`;
}

/**
 * Export sessions to CSV file
 */
export function exportSessionsToCSV(sessions: Session[]): void {
  const csv = sessionsToCSV(sessions);
  const filename = generateCSVFilename();
  downloadCSV(csv, filename);
}

/**
 * Convert sessions to JSON for backup
 */
export function sessionsToJSON(sessions: Session[]): string {
  return JSON.stringify(sessions, null, 2);
}

/**
 * Download JSON file
 */
export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export sessions to JSON for backup
 */
export function exportSessionsToJSON(sessions: Session[]): void {
  const json = sessionsToJSON(sessions);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  downloadJSON(json, `fizzy-focus-backup-${dateStr}.json`);
}

/**
 * Parse sessions from JSON backup
 */
export function parseSessionsFromJSON(json: string): Session[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}
