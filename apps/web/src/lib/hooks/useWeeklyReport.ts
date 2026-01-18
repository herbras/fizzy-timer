/**
 * Weekly Report Hook
 * Fetches and aggregates weekly time tracking data from Fizzy API
 * Fetches cards with DONE status from Fizzy API
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { createFizzyClient } from "@/lib/services/fizzy";
import { formatDuration, getDateKey } from "@/lib/utils/time";
import { useSettings } from "./useSettings";

export interface DayData {
	date: string; // YYYY-MM-DD
	displayDate: string; // "Mon, Jan 12"
	cardCount: number;
}

export interface CardStats {
	cardId: string;
	cardTitle: string;
	cardNumber: number;
	boardId: string;
	boardName: string;
	completedAt: string; // ISO date when card was done
	column: string;
	assignees: string[];
	tags: string[];
}

export interface WeeklyReportData {
	// Date range
	startDate: Date;
	endDate: Date;
	dateRangeLabel: string; // "Jan 12 - Jan 18, 2025"

	// Summary
	totalCards: number;
	totalBoards: number;
	avgDailyCards: number;
	mostActiveDay: string | null;
	mostActiveBoard: string | null;

	// Daily breakdown
	dailyData: DayData[];

	// Cards
	cards: CardStats[];

	// Boards
	boards: string[]; // Unique board names
}

/**
 * Get week start (Thursday) for a given date
 * User wants "Kamis ke Rabu" (Thursday to Wednesday)
 */
function getThursdayStart(date: Date): Date {
	const d = new Date(date);
	const dayOfWeek = d.getDay(); // 0 = Sunday, 4 = Thursday

	// Calculate days to subtract to get to previous Thursday
	// If today is Thursday (4), subtract 0
	// If today is Friday (5), subtract 1
	// If today is Wednesday (3), subtract 6 (go to previous week's Thursday)
	const daysToSubtract = (dayOfWeek - 4 + 7) % 7;

	d.setDate(d.getDate() - daysToSubtract);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Get week end (next Wednesday) for a given date
 */
function getThursdayEnd(date: Date): Date {
	const start = getThursdayStart(date);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return end;
}

/**
 * Format date range label
 */
function formatDateRange(start: Date, end: Date): string {
	const options = { month: "short", day: "numeric" } as const;
	const startStr = start.toLocaleDateString("en-US", options);
	const endStr = end.toLocaleDateString("en-US", options);
	const year = start.getFullYear();

	if (start.getFullYear() === end.getFullYear()) {
		return `${startStr} - ${endStr}, ${year}`;
	}
	return `${startStr}, ${start.getFullYear()} - ${endStr}, ${end.getFullYear()}`;
}

/**
 * Format display date for daily chart
 */
function formatDisplayDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

/**
 * Get card completion date (use last_active_at or created_at)
 */
function getCardCompletionDate(card: any): Date {
	const dateStr = card.last_active_at || card.created_at;
	return new Date(dateStr);
}

/**
 * Hook for fetching CLOSED cards from Fizzy API
 * Uses indexed_by=closed parameter and filters by assignee_ids
 */
function useFizzyCards(
	accountSlug: string | null,
	token: string | null,
	userId: string | null,
) {
	return useQuery({
		queryKey: ["weeklyReport", "closedCards", accountSlug, userId] as const,
		queryFn: async () => {
			if (!accountSlug || !token) {
				return [];
			}

			const client = createFizzyClient(token);
			// Use getClosedCards to get only closed cards for the user
			const cards = await client.getClosedCards(accountSlug, {
				assigneeId: userId ?? undefined,
			});

			// Map to our format
			return cards.map((card) => ({
				cardId: card.id,
				cardTitle: card.title,
				cardNumber: card.number,
				boardId: card.board.id,
				boardName: card.board.name,
				completedAt: getCardCompletionDate(card).toISOString(),
				column: card.column?.name || "Done",
				assignees: card.assignees?.map((a) => a.name) || [],
				tags: card.tags || [],
			}));
		},
		enabled: !!accountSlug && !!token,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 1,
	});
}

/**
 * Hook for weekly report data from Fizzy API
 * @param selectedUserId - Optional user ID to filter cards. If not provided, uses current user
 */
export function useWeeklyReport(selectedUserId?: string) {
	const { activeAccount } = useSettings();
	const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());

	// Calculate week bounds
	const weekStart = useMemo(
		() => getThursdayStart(selectedWeek),
		[selectedWeek],
	);
	const weekEnd = useMemo(() => getThursdayEnd(selectedWeek), [selectedWeek]);

	// Use selectedUserId if provided, otherwise fall back to current user
	const targetUserId = selectedUserId || activeAccount?.userId;

	// Fetch all CLOSED cards from Fizzy API for the selected user
	const {
		data: allCards = [],
		isLoading: loadingCards,
		error: cardsError,
		refetch: refetchCards,
	} = useFizzyCards(
		activeAccount?.slug ?? null,
		activeAccount?.token ?? null,
		targetUserId ?? null,
	);

	// Show error toast if fetch fails
	useEffect(() => {
		if (cardsError) {
			toast.error("Failed to load cards from Fizzy API", {
				description: "Please check your connection or API token",
			});
		}
	}, [cardsError]);

	// Filter cards for selected week
	const weekCards = useMemo(() => {
		const startMs = weekStart.getTime();
		const endMs = weekEnd.getTime();

		return allCards.filter((card) => {
			const completedAt = new Date(card.completedAt).getTime();
			return completedAt >= startMs && completedAt <= endMs;
		});
	}, [allCards, weekStart, weekEnd]);

	// Aggregate report data
	const reportData = useMemo((): WeeklyReportData => {
		if (weekCards.length === 0) {
			return {
				startDate: weekStart,
				endDate: weekEnd,
				dateRangeLabel: formatDateRange(weekStart, weekEnd),
				totalCards: 0,
				totalBoards: 0,
				avgDailyCards: 0,
				mostActiveDay: null,
				mostActiveBoard: null,
				dailyData: [],
				cards: [],
				boards: [],
			};
		}

		// Total stats
		const totalCards = weekCards.length;
		const uniqueBoards = new Set(weekCards.map((c) => c.boardName));
		const totalBoards = uniqueBoards.size;
		const avgDailyCards = Math.round(totalCards / 7);

		// Daily breakdown (all 7 days)
		const dailyData: DayData[] = [];
		for (let i = 0; i < 7; i++) {
			const d = new Date(weekStart);
			d.setDate(weekStart.getDate() + i);

			const dayStart = new Date(d);
			dayStart.setHours(0, 0, 0, 0);
			const dayEnd = new Date(d);
			dayEnd.setHours(23, 59, 59, 999);

			const dayCards = weekCards.filter((c) => {
				const completedAt = new Date(c.completedAt).getTime();
				return (
					completedAt >= dayStart.getTime() && completedAt <= dayEnd.getTime()
				);
			});

			dailyData.push({
				date: getDateKey(dayStart.getTime()),
				displayDate: formatDisplayDate(d),
				cardCount: dayCards.length,
			});
		}

		// Most active day
		const mostActiveDay = dailyData.reduce((max, day) =>
			day.cardCount > max.cardCount ? day : max,
		);
		const mostActiveDayName =
			mostActiveDay.cardCount > 0 ? mostActiveDay.displayDate : null;

		// Most active board
		const boardCounts = new Map<string, number>();
		for (const card of weekCards) {
			boardCounts.set(
				card.boardName,
				(boardCounts.get(card.boardName) || 0) + 1,
			);
		}
		const mostActiveBoardEntry = Array.from(boardCounts.entries()).sort(
			(a, b) => b[1] - a[1],
		)[0];
		const mostActiveBoard = mostActiveBoardEntry
			? mostActiveBoardEntry[0]
			: null;

		return {
			startDate: weekStart,
			endDate: weekEnd,
			dateRangeLabel: formatDateRange(weekStart, weekEnd),
			totalCards,
			totalBoards,
			avgDailyCards,
			mostActiveDay: mostActiveDayName,
			mostActiveBoard,
			dailyData,
			cards: weekCards,
			boards: Array.from(uniqueBoards),
		};
	}, [weekCards, weekStart, weekEnd]);

	// Navigation functions
	const goToPreviousWeek = useCallback(() => {
		const newDate = new Date(selectedWeek);
		newDate.setDate(newDate.getDate() - 7);
		setSelectedWeek(newDate);
	}, [selectedWeek]);

	const goToNextWeek = useCallback(() => {
		const newDate = new Date(selectedWeek);
		newDate.setDate(newDate.getDate() + 7);
		setSelectedWeek(newDate);
	}, [selectedWeek]);

	const goToCurrentWeek = useCallback(() => {
		setSelectedWeek(new Date());
	}, []);

	const goToSpecificWeek = useCallback((date: Date) => {
		setSelectedWeek(date);
	}, []);

	// Check if currently viewing this week
	const isCurrentWeek = useMemo(() => {
		const now = new Date();
		const currentStart = getThursdayStart(now);
		const currentEnd = getThursdayEnd(now);

		return (
			weekStart.getTime() === currentStart.getTime() &&
			weekEnd.getTime() === currentEnd.getTime()
		);
	}, [weekStart, weekEnd]);

	return {
		// Data
		reportData,
		allCards, // All cards for Excel export
		loading: loadingCards,
		error: cardsError,

		// State
		selectedWeek,
		isCurrentWeek,

		// Actions
		goToPreviousWeek,
		goToNextWeek,
		goToCurrentWeek,
		goToSpecificWeek,
		refetchCards,

		// Formatters
		formatDuration,
	};
}

/**
 * Generate XML prompt template for weekly report
 * User can copy this for their weekly status update
 */
export function generateWeeklyPrompt(
	data: WeeklyReportData,
	userName?: string,
): string {
	const lines: string[] = [];

	// Header
	lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
	lines.push(`<!-- Weekly Report - ${data.dateRangeLabel} -->`);
	lines.push("<weekly_report>");
	lines.push("");

	// User info
	if (userName) {
		lines.push(`  <user>${userName}</user>`);
	}
	lines.push(`  <period>${data.dateRangeLabel}</period>`);
	lines.push("");

	// Summary
	lines.push("  <summary>");
	lines.push(`    <total_cards>${data.totalCards}</total_cards>`);
	lines.push(`    <total_boards>${data.totalBoards}</total_boards>`);
	lines.push(`    <avg_daily>${data.avgDailyCards}</avg_daily>`);
	if (data.mostActiveDay) {
		lines.push(`    <most_active_day>${data.mostActiveDay}</most_active_day>`);
	}
	if (data.mostActiveBoard) {
		lines.push(
			`    <most_active_board>${data.mostActiveBoard}</most_active_board>`,
		);
	}
	lines.push("  </summary>");

	// Daily breakdown
	if (data.dailyData.some((d) => d.cardCount > 0)) {
		lines.push("");
		lines.push("  <daily_breakdown>");
		for (const day of data.dailyData) {
			if (day.cardCount > 0) {
				lines.push(`    <day date="${day.date}" cards="${day.cardCount}"/>`);
			}
		}
		lines.push("  </daily_breakdown>");
	}

	// Cards by board
	if (data.boards.length > 0) {
		lines.push("");
		lines.push("  <boards>");
		for (const boardName of data.boards) {
			const boardCards = data.cards.filter((c) => c.boardName === boardName);
			lines.push(
				`    <board name="${boardName}" cards="${boardCards.length}">`,
			);
			for (const card of boardCards) {
				const assignees =
					card.assignees.length > 0
						? ` assignees="${card.assignees.join(", ")}"`
						: "";
				const tags =
					card.tags.length > 0 ? ` tags="${card.tags.join(", ")}"` : "";
				lines.push(
					`      <card number="${card.cardNumber}" title="${card.cardTitle}" column="${card.column}"${assignees}${tags}/>`,
				);
			}
			lines.push("    </board>");
		}
		lines.push("  </boards>");
	}

	lines.push("");
	lines.push("</weekly_report>");

	return lines.join("\n");
}

/**
 * Generate text format for WhatsApp sharing
 */
export function generateWhatsAppText(
	data: WeeklyReportData,
	userName?: string,
): string {
	const lines: string[] = [];

	// Header
	lines.push("📊 *Lapor Weekly*");
	lines.push(`🗓️ ${data.dateRangeLabel}`);
	if (userName) {
		lines.push(`👤 ${userName}`);
	}
	lines.push("");

	// Summary
	lines.push(`✅ *Total: ${data.totalCards} Cards Done*`);
	lines.push(`📋 ${data.totalBoards} boards`);
	lines.push(`📊 Rata-rata: ${data.avgDailyCards} kartu/hari`);
	lines.push("");

	// Boards breakdown
	if (data.boards.length > 0) {
		lines.push("*Boards:*");
		for (const boardName of data.boards) {
			const boardCards = data.cards.filter((c) => c.boardName === boardName);
			lines.push(`• ${boardName}: ${boardCards.length} cards`);
		}
		lines.push("");
	}

	// Daily breakdown
	const activeDays = data.dailyData.filter((d) => d.cardCount > 0);
	if (activeDays.length > 0) {
		lines.push("*Harian:*");
		for (const day of data.dailyData) {
			if (day.cardCount > 0) {
				lines.push(`${day.displayDate}: ${day.cardCount} cards`);
			}
		}
	}

	// Card details (top 10)
	if (data.cards.length > 0) {
		lines.push("");
		lines.push("*Cards:*");
		for (let i = 0; i < Math.min(10, data.cards.length); i++) {
			const card = data.cards[i];
			lines.push(`${i + 1}. #${card.cardNumber} ${card.cardTitle}`);
		}
		if (data.cards.length > 10) {
			lines.push(`... dan ${data.cards.length - 10} lainnya`);
		}
	}

	lines.push("");
	lines.push("_Generated by Fizzy Timer_");

	return lines.join("\n");
}

/**
 * Export 4 weeks of data to Excel
 * Creates separate sheets for each week plus a summary sheet
 */
export async function export4WeeksToExcel(
	allCards: CardStats[],
): Promise<void> {
	if (allCards.length === 0) {
		toast.error("No data to export");
		return;
	}

	try {
		const workbook = XLSX.utils.book_new();

		// Get the latest card date to determine the 4 week range
		const latestDate = new Date(
			allCards.reduce((max, card) => {
				const cardDate = new Date(card.completedAt).getTime();
				return cardDate > max ? cardDate : max;
			}, 0),
		);

		// Generate data for 4 weeks (current week + 3 previous weeks)
		const weeksData: {
			label: string;
			start: Date;
			end: Date;
			cards: CardStats[];
		}[] = [];

		for (let i = 0; i < 4; i++) {
			const weekDate = new Date(latestDate);
			weekDate.setDate(weekDate.getDate() - i * 7);

			const weekStart = getThursdayStart(weekDate);
			const weekEnd = getThursdayEnd(weekDate);

			const weekCards = allCards.filter((card) => {
				const completedAt = new Date(card.completedAt).getTime();
				return (
					completedAt >= weekStart.getTime() && completedAt <= weekEnd.getTime()
				);
			});

			const weekLabel = formatDateRange(weekStart, weekEnd);

			weeksData.push({
				label: weekLabel,
				start: weekStart,
				end: weekEnd,
				cards: weekCards,
			});
		}

		// Create Summary Sheet
		const summaryData = [
			["Weekly Report - 4 Weeks Summary"],
			[""],
			[
				"Week",
				"Total Cards",
				"Total Boards",
				"Avg Daily Cards",
				"Most Active Board",
			],
		];

		weeksData.reverse().forEach((week) => {
			const uniqueBoards = new Set(week.cards.map((c) => c.boardName));
			const totalCards = week.cards.length;
			const totalBoards = uniqueBoards.size;
			const avgDaily = Math.round(totalCards / 7);

			// Find most active board
			const boardCounts = new Map<string, number>();
			for (const card of week.cards) {
				boardCounts.set(
					card.boardName,
					(boardCounts.get(card.boardName) || 0) + 1,
				);
			}
			const mostActiveBoard =
				Array.from(boardCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
				"-";

			summaryData.push([
				week.label,
				totalCards,
				totalBoards,
				avgDaily,
				mostActiveBoard,
			]);
		});

		// Total row
		summaryData.push([""]);
		const totalCards = weeksData.reduce((sum, w) => sum + w.cards.length, 0);
		summaryData.push(["TOTAL", totalCards, "", "", ""]);

		const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
		XLSX.utils.book_append_sheet(workbook, summaryWs, "Summary");

		// Create individual sheets for each week
		weeksData.reverse().forEach((week, index) => {
			if (week.cards.length === 0) {
				// Create empty sheet
				const emptyWs = XLSX.utils.aoa_to_sheet([
					[`Week ${index + 1}: ${week.label}`],
					[""],
					["No cards completed this week"],
				]);
				const sheetName = `Week ${index + 1}`;
				XLSX.utils.book_append_sheet(workbook, emptyWs, sheetName);
				return;
			}

			// Create sheet with card details
			const weekData = [
				[`Week ${index + 1}: ${week.label}`],
				[""],
				[
					"No",
					"Card Number",
					"Title",
					"Board",
					"Column",
					"Completed At",
					"Assignees",
					"Tags",
				],
			];

			week.cards.forEach((card, cardIndex) => {
				const completedDate = new Date(card.completedAt);
				const completedDateStr = completedDate.toLocaleDateString("en-US", {
					weekday: "short",
					month: "short",
					day: "numeric",
					year: "numeric",
				});

				weekData.push([
					cardIndex + 1,
					card.cardNumber,
					card.cardTitle,
					card.boardName,
					card.column,
					completedDateStr,
					card.assignees.join(", "),
					card.tags.join(", "),
				]);
			});

			// Weekly stats at bottom
			weekData.push([""]);
			weekData.push(["Week Summary"]);
			weekData.push(["Total Cards", week.cards.length]);
			const uniqueBoards = new Set(week.cards.map((c) => c.boardName));
			weekData.push(["Total Boards", uniqueBoards.size]);

			const weekWs = XLSX.utils.aoa_to_sheet(weekData);
			const sheetName = `Week ${index + 1}`;
			XLSX.utils.book_append_sheet(workbook, weekWs, sheetName);
		});

		// Generate filename with date range
		const oldestWeek = weeksData[weeksData.length - 1];
		const newestWeek = weeksData[0];
		const filename = `lapor-4weeks-${oldestWeek.start.toISOString().split("T")[0]}-to-${newestWeek.end.toISOString().split("T")[0]}.xlsx`;

		// Download
		XLSX.writeFile(workbook, filename);
		toast.success("Excel exported successfully");
	} catch (error) {
		console.error("Export failed:", error);
		toast.error("Failed to export Excel");
	}
}
