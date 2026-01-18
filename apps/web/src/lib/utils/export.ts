/**
 * Export utilities for Worklog
 * Supports CSV and Excel export with beautiful formatting
 */

import { differenceInMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { utils, type WorkBook, type WorkSheet, writeFile } from "xlsx";
import type { Session } from "../db/schema";

interface ExportOptions {
	name?: string;
	month?: Date;
	startDate?: Date;
	endDate?: Date;
}

interface ExportSummary {
	name: string;
	period: string;
	month?: string;
	totalSessions: number;
	totalHours: number;
	totalMinutes: number;
	generatedAt: string;
}

/**
 * Calculate summary statistics from sessions
 */
function calculateSummary(
	sessions: Session[],
	options: ExportOptions,
): ExportSummary {
	const now = new Date();
	const name = options.name || "Fizzy Timer User";

	// Calculate date range
	let startDate: Date;
	let endDate: Date;

	if (options.startDate && options.endDate) {
		startDate = options.startDate;
		endDate = options.endDate;
	} else if (options.month) {
		startDate = startOfMonth(options.month);
		endDate = endOfMonth(options.month);
	} else if (sessions.length > 0) {
		const sortedSessions = [...sessions].sort(
			(a, b) => a.startTime - b.startTime,
		);
		startDate = new Date(sortedSessions[0].startTime);
		endDate = new Date(sortedSessions[sortedSessions.length - 1].startTime);
	} else {
		startDate = now;
		endDate = now;
	}

	// Calculate period string
	const monthsDiff = differenceInMonths(endDate, startDate);
	let period = "";
	let month: string | undefined;

	if (monthsDiff === 0 && startDate.getMonth() === endDate.getMonth()) {
		period = format(startDate, "MMMM yyyy");
		month = format(startDate, "MMMM yyyy");
	} else if (monthsDiff < 1) {
		period = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;
	} else {
		period = `${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`;
	}

	// Calculate totals
	const totalSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
	const totalHours = Math.floor(totalSeconds / 3600);
	const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

	return {
		name,
		period,
		month,
		totalSessions: sessions.length,
		totalHours,
		totalMinutes,
		generatedAt: format(now, "dd MMMM yyyy, HH:mm"),
	};
}

/**
 * Format duration to HH:MM:SS
 */
function formatDurationExcel(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format duration to decimal hours
 */
function formatDurationDecimal(seconds: number): string {
	return (seconds / 3600).toFixed(2);
}

/**
 * Format date to Indonesian format
 */
function formatDateIndo(timestamp: number): string {
	return format(new Date(timestamp), "dd/MM/yyyy");
}

/**
 * Format time to HH:MM
 */
function formatTimeHHMM(timestamp: number): string {
	return format(new Date(timestamp), "HH:mm");
}

/**
 * Get day name in Indonesian
 */
function getDayName(timestamp: number): string {
	const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
	return days[new Date(timestamp).getDay()];
}

/**
 * Export sessions to Excel with beautiful formatting
 */
export function exportToExcel(
	sessions: Session[],
	options: ExportOptions = {},
): void {
	const wb = utils.book_new();
	const summary = calculateSummary(sessions, options);

	// Sort sessions by date
	const sortedSessions = [...sessions].sort(
		(a, b) => a.startTime - b.startTime,
	);

	// Create Summary Sheet
	const summaryData = [
		["WORKLOG SUMMARY", "", "", ""],
		["=", "=", "=", "="],
		["", "", "", ""],
		["Nama", summary.name, "", ""],
		["Periode", summary.period, "", ""],
		["Total Sesi", summary.totalSessions, "", ""],
		["Total Jam", `${summary.totalHours}j ${summary.totalMinutes}m`, "", ""],
		["", "", "", ""],
		[
			"Total Hours (Decimal)",
			formatDurationDecimal(
				summary.totalHours * 3600 + summary.totalMinutes * 60,
			),
			"",
			"",
		],
		["", "", "", ""],
		["Generated At", summary.generatedAt, "", ""],
		["", "", "", ""],
	];

	const wsSummary = utils.aoa_to_sheet(summaryData);
	utils.book_append_sheet(wb, wsSummary, "Summary");

	// Create Daily Log Sheet
	const dailyLogData: (string | number)[][] = [
		["WORKLOG - DAILY LOG", "", "", "", "", "", "", ""],
		["", "", "", "", "", "", "", ""],
		[
			"Tanggal",
			"Hari",
			"Waktu Mulai",
			"Waktu Selesai",
			"Durasi (HH:MM:SS)",
			"Jam (Decimal)",
			"Board",
			"Card",
			"Notes",
		],
		// Separator row
		["-", "-", "-", "-", "-", "-", "-", "-", "-"],
	];

	// Add sessions
	sortedSessions.forEach((session) => {
		dailyLogData.push([
			formatDateIndo(session.startTime),
			getDayName(session.startTime),
			formatTimeHHMM(session.startTime),
			session.endTime ? formatTimeHHMM(session.endTime) : "-",
			formatDurationExcel(session.duration),
			formatDurationDecimal(session.duration),
			session.boardName,
			session.cardTitle,
			session.notes || "",
		]);
	});

	const wsDailyLog = utils.aoa_to_sheet(dailyLogData);
	utils.book_append_sheet(wb, wsDailyLog, "Daily Log");

	// Create Summary by Board Sheet
	const boardMap = new Map<string, { duration: number; sessions: number }>();
	sessions.forEach((session) => {
		const existing = boardMap.get(session.boardName) || {
			duration: 0,
			sessions: 0,
		};
		existing.duration += session.duration;
		existing.sessions += 1;
		boardMap.set(session.boardName, existing);
	});

	const boardData = [
		["SUMMARY BY BOARD", "", "", "", ""],
		["", "", "", "", ""],
		["Board", "Total Sesi", "Total Jam (Decimal)", "Total Jam (Format)", ""],
		["-", "-", "-", "-", ""],
		...Array.from(boardMap.entries()).map(([board, data]) => [
			board,
			data.sessions,
			formatDurationDecimal(data.duration),
			formatDurationExcel(data.duration),
			"",
		]),
	];

	const wsBoard = utils.aoa_to_sheet(boardData);
	utils.book_append_sheet(wb, wsBoard, "By Board");

	// Create Summary by Card Sheet
	const cardMap = new Map<
		string,
		{
			board: string;
			title: string;
			duration: number;
			sessions: number;
			number: number;
		}
	>();
	sessions.forEach((session) => {
		const key = session.cardId;
		const existing = cardMap.get(key) || {
			board: session.boardName,
			title: session.cardTitle,
			duration: 0,
			sessions: 0,
			number: session.cardNumber,
		};
		existing.duration += session.duration;
		existing.sessions += 1;
		cardMap.set(key, existing);
	});

	const cardData = [
		["SUMMARY BY CARD", "", "", "", "", "", ""],
		["", "", "", "", "", "", ""],
		[
			"Card Number",
			"Card Title",
			"Board",
			"Total Sesi",
			"Total Jam (Decimal)",
			"Total Jam (Format)",
			"",
		],
		["-", "-", "-", "-", "-", "-", "-"],
		...Array.from(cardMap.values())
			.sort((a, b) => b.duration - a.duration)
			.map((card) => [
				`#${card.number}`,
				card.title,
				card.board,
				card.sessions,
				formatDurationDecimal(card.duration),
				formatDurationExcel(card.duration),
				"",
			]),
	];

	const wsCard = utils.aoa_to_sheet(cardData);
	utils.book_append_sheet(wb, wsCard, "By Card");

	// Generate filename
	const monthStr = summary.month
		? summary.month.toLowerCase().replace(" ", "-")
		: "all";
	const filename = `worklog-${monthStr}-${format(new Date(), "yyyy-MM-dd")}.xlsx`;

	// Write file
	writeFile(wb, filename);
}

/**
 * Export sessions to CSV with proper formatting
 */
export function exportToCSV(
	sessions: Session[],
	options: ExportOptions = {},
): void {
	const summary = calculateSummary(sessions, options);

	// Sort sessions by date
	const sortedSessions = [...sessions].sort(
		(a, b) => a.startTime - b.startTime,
	);

	// CSV Header with metadata
	const csvRows: string[] = [];

	// Add summary as comments
	csvRows.push('"WORKLOG EXPORT"');
	csvRows.push(`"Nama: ${summary.name}"`);
	csvRows.push(`"Periode: ${summary.period}"`);
	csvRows.push(`"Total Sesi: ${summary.totalSessions}"`);
	csvRows.push(`"Total Jam: ${summary.totalHours}j ${summary.totalMinutes}m"`);
	csvRows.push(`"Generated At: ${summary.generatedAt}"`);
	csvRows.push("");

	// CSV Headers
	const headers = [
		"Tanggal",
		"Hari",
		"Waktu Mulai",
		"Waktu Selesai",
		"Durasi (HH:MM:SS)",
		"Jam (Decimal)",
		"Board",
		"Card",
		"Notes",
	];
	csvRows.push(headers.map((h) => `"${h}"`).join(","));

	// CSV Data
	sortedSessions.forEach((session) => {
		const row = [
			formatDateIndo(session.startTime),
			getDayName(session.startTime),
			formatTimeHHMM(session.startTime),
			session.endTime ? formatTimeHHMM(session.endTime) : "-",
			formatDurationExcel(session.duration),
			formatDurationDecimal(session.duration),
			session.boardName,
			session.cardTitle,
			session.notes || "",
		].map((field) => `"${String(field).replace(/"/g, '""')}"`);

		csvRows.push(row.join(","));
	});

	// Add summary by board at the end
	csvRows.push("");
	csvRows.push('"SUMMARY BY BOARD"');
	csvRows.push(
		'"Board","Total Sesi","Total Jam (Decimal)","Total Jam (Format)"',
	);

	const boardMap = new Map<string, { duration: number; sessions: number }>();
	sessions.forEach((session) => {
		const existing = boardMap.get(session.boardName) || {
			duration: 0,
			sessions: 0,
		};
		existing.duration += session.duration;
		existing.sessions += 1;
		boardMap.set(session.boardName, existing);
	});

	Array.from(boardMap.entries()).forEach(([board, data]) => {
		csvRows.push(
			`"${board}",${data.sessions},${formatDurationDecimal(data.duration)},"${formatDurationExcel(
				data.duration,
			)}"`,
		);
	});

	// Download
	const csvContent = csvRows.join("\n");
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	const monthStr = summary.month
		? summary.month.toLowerCase().replace(" ", "-")
		: "all";
	link.download = `worklog-${monthStr}-${format(new Date(), "yyyy-MM-dd")}.csv`;
	link.style.display = "none";

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

/**
 * Get date range from sessions
 */
export function getSessionDateRange(
	sessions: Session[],
): { start: Date; end: Date } | null {
	if (sessions.length === 0) return null;

	const sortedSessions = [...sessions].sort(
		(a, b) => a.startTime - b.startTime,
	);
	return {
		start: new Date(sortedSessions[0].startTime),
		end: new Date(sortedSessions[sortedSessions.length - 1].startTime),
	};
}

/**
 * Filter sessions by date range
 */
export function filterSessionsByDate(
	sessions: Session[],
	startDate?: Date,
	endDate?: Date,
): Session[] {
	if (!startDate && !endDate) return sessions;

	return sessions.filter((session) => {
		const sessionDate = new Date(session.startTime);
		if (startDate && sessionDate < startDate) return false;
		if (endDate && sessionDate > endDate) return false;
		return true;
	});
}

/**
 * Filter sessions by month
 */
export function filterSessionsByMonth(
	sessions: Session[],
	month: Date,
): Session[] {
	const start = startOfMonth(month);
	const end = endOfMonth(month);
	return filterSessionsByDate(sessions, start, end);
}

/**
 * Filter sessions by current month
 */
export function filterSessionsByCurrentMonth(sessions: Session[]): Session[] {
	return filterSessionsByMonth(sessions, new Date());
}
