/**
 * Index Route (Dashboard)
 * Shows boards and cards grouped by columns, allows starting timer
 * Dark Theme with Gold/Amber Accent
 * WCAG AA Compliant
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DurationSelector } from "@/components/DurationSelector";
import { BottomNav } from "@/components/layout/BottomNav";
import { GifMascotAvatar } from "@/components/Mascot";
import { SettingsSheet } from "@/components/SettingsSheet";
import { SimpleTimerDisplay } from "@/components/timer/TimerDisplay";
import { BoardCardList } from "@/components/ui/board-card";
import { TaskCard } from "@/components/ui/task-card";
import type { Card } from "@/lib/db/schema";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import { toBoard, useBoards, useCards } from "@/lib/hooks/useFizzy";
import { useSettings } from "@/lib/hooks/useSettings";
import { useTimer } from "@/lib/hooks/useTimer";
import { useSessions } from "@/lib/queries/useSessions";

export const Route = createFileRoute("/home")({
	component: HomeComponent,
});

// Group cards by column
function groupCardsByColumn(cards: readonly Card[]) {
	const groups = new Map<
		string,
		{ columnId: string; columnName: string; cards: Card[] }
	>();

	for (const card of cards) {
		const key = card.columnId || "none";
		if (!groups.has(key)) {
			groups.set(key, {
				columnId: card.columnId,
				columnName: card.columnName,
				cards: [],
			});
		}
		groups.get(key)!.cards.push(card);
	}

	return Array.from(groups.values());
}

function HomeComponent() {
	const navigate = useNavigate();
	const { fizzyToken, accountSlug, loading } = useSettings();
	const {
		settings: appSettings,
		updateSettings,
		setLastDuration,
	} = useAppSettings();
	const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);
	// Use lastDuration from appSettings directly (no local state needed)
	const selectedDuration = appSettings.lastDuration ?? 25 * 60;
	const { data: sessions = [] } = useSessions();
	const { data: boards } = useBoards(accountSlug);
	const { data: cards, loading: cardsLoading } = useCards(
		accountSlug,
		activeBoardId,
	);
	const timer = useTimer();

	// Convert API boards to app boards
	const appBoards = useMemo(
		() => boards?.map((b) => toBoard(b)) ?? [],
		[boards],
	);

	// Cards are already converted from useCards hook
	const appCards = useMemo(() => (cards ? [...cards] : []), [cards]);

	// Create boards map for card display
	const boardsMap = useMemo(
		() =>
			new Map(appBoards.map((b) => [b.id, { name: b.name, color: b.color }])),
		[appBoards],
	);

	// Group cards by column
	const cardsByColumn = useMemo(() => groupCardsByColumn(appCards), [appCards]);

	// Calculate card times from sessions (memoized for performance)
	const cardTimes = useMemo(() => {
		const timesMap = new Map<string, number>();
		for (const session of sessions) {
			const current = timesMap.get(session.cardId) || 0;
			timesMap.set(session.cardId, current + session.duration);
		}
		return timesMap;
	}, [sessions]);

	// Redirect to setup if not authenticated (only after loading is done)
	useEffect(() => {
		if (!loading && (!fizzyToken || !accountSlug)) {
			navigate({ to: "/setup" });
		}
	}, [fizzyToken, accountSlug, loading, navigate]);

	// Start timer for a card
	const handleStartTimer = useCallback(
		(cardId: string) => {
			const card = appCards.find((c) => c.id === cardId);
			if (!card) return;

			const board = boardsMap.get(card.boardId);
			if (!board) return;

			// Save the selected duration to user preferences
			setLastDuration(selectedDuration);

			// Get previously accumulated time for this card
			const previousElapsed = cardTimes.get(card.id) || 0;

			// Start timer with selected duration (undefined = stopwatch mode)
			timer.start(
				{
					card,
					board: {
						id: card.boardId,
						name: board.name,
						color: board.color,
					},
					previousElapsed, // Pass accumulated time so timer continues from there
				},
				selectedDuration, // Pass duration for countdown mode
			);

			// Navigate to focus page
			navigate({ to: "/focus" });
		},
		[
			appCards,
			boardsMap,
			cardTimes,
			timer,
			navigate,
			selectedDuration,
			setLastDuration,
		],
	);

	// Handle duration selection change - save to preferences
	const handleDurationSelect = useCallback(
		(duration: number | undefined) => {
			setLastDuration(duration);
		},
		[setLastDuration],
	);

	// Don't render anything while loading
	if (loading) {
		return null;
	}

	return (
		<div className="min-h-screen bg-[#050505] pb-24">
			{/* Simple Top Header - just title and mascot */}
			<header className="sticky top-0 z-10 border-zinc-800/50 border-b bg-[#050505]/80 px-4 py-3 backdrop-blur-md">
				<div className="mx-auto flex max-w-md items-center justify-center gap-3">
					{appSettings.showAnimal && (
						<GifMascotAvatar mood={appSettings.moodType} />
					)}
					<span className="font-bold text-xl text-zinc-100 tracking-tight">
						Dasbor
					</span>
				</div>
			</header>

			<main className="mx-auto max-w-md animate-fade-in space-y-8 px-4 py-6">
				{/* Active Timer Widget */}
				{timer.state !== "idle" && timer.data && (
					<div className="glass-effect rounded-[2rem] border border-amber-500/20 p-6 shadow-lg">
						<div className="flex items-center justify-between gap-3">
							<div className="min-w-0 flex-1">
								<p className="mb-1 truncate font-bold text-xs text-zinc-500 uppercase tracking-widest">
									{timer.data.board.name}
								</p>
								<h3 className="truncate font-bold text-zinc-100">
									{timer.data.card.title}
								</h3>
							</div>
							<div className="text-right">
								<SimpleTimerDisplay
									formattedTime={timer.formattedTime}
									state={timer.state}
								/>
								<button
									onClick={() => navigate({ to: "/focus" })}
									className="mt-1 flex items-center justify-end gap-1 font-bold text-amber-500 text-xs hover:text-amber-400"
								>
									Mode Fokus <ChevronRight size={14} />
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Welcome Message */}
				<div className="glass-effect rounded-[2rem] border border-zinc-800/50 p-6 shadow-sm">
					<h2 className="mb-1 font-black text-2xl text-zinc-100">Pilih Misi</h2>
					<p className="mb-4 font-medium text-sm text-zinc-500">
						Pendamping fokus Anda siap membantu.
					</p>

					{/* Duration Selector */}
					<div className="space-y-2">
						<p className="font-bold text-xs text-zinc-600 uppercase tracking-widest">
							Durasi Fokus
						</p>
						<DurationSelector
							selectedDuration={selectedDuration}
							onSelect={handleDurationSelect}
							disabled={timer.state !== "idle"}
						/>
					</div>
				</div>

				{/* Boards Filter */}
				<section>
					<h2 className="mb-4 px-1 font-bold text-xs text-zinc-600 uppercase tracking-widest">
						Papan
					</h2>
					<BoardCardList
						boards={appBoards}
						activeBoardId={activeBoardId}
						onBoardSelect={(id) => setActiveBoardId(id || null)}
					/>
				</section>

				{/* Cards grouped by Column */}
				<section>
					{cardsLoading ? (
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="animate-pulse rounded-[2rem] border border-zinc-800/50 bg-zinc-900/50 p-5"
								>
									<div className="mb-4 h-4 w-1/4 rounded-full bg-zinc-800" />
									<div className="mb-3 h-5 w-3/4 rounded-full bg-zinc-800" />
									<div className="h-5 w-1/2 rounded-full bg-zinc-800" />
								</div>
							))}
						</div>
					) : cardsByColumn.length > 0 ? (
						<div className="space-y-6">
							{cardsByColumn.map((group) => (
								<div key={group.columnId} className="space-y-3">
									{/* Column Header */}
									<div className="flex items-center gap-2 px-1">
										<div className="h-2 w-2 rounded-full bg-zinc-700" />
										<span className="font-black text-[10px] text-zinc-600 uppercase tracking-widest">
											{group.columnName}
										</span>
										<span className="font-bold text-[10px] text-zinc-700">
											{group.cards.length}
										</span>
									</div>

									{/* Cards in this column */}
									<div className="grid gap-3">
										{group.cards.map((card) => (
											<TaskCard
												key={card.id}
												card={card}
												totalSeconds={cardTimes.get(card.id) || 0}
												onClick={() => handleStartTimer(card.id)}
												showBoard={false}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="py-16 text-center" role="status" aria-live="polite">
							<div className="mb-4 inline-flex rounded-3xl border border-zinc-800/50 bg-zinc-900 p-4 shadow-sm">
								<LayoutGrid
									className="h-8 w-8 text-zinc-700"
									aria-hidden="true"
								/>
							</div>
							<p className="font-medium text-zinc-600">
								Tidak ada kartu ditemukan
							</p>
							{activeBoardId && (
								<button
									onClick={() => setActiveBoardId(null)}
									className="mt-3 rounded-lg px-2 py-1 font-bold text-amber-500 text-sm hover:text-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
								>
									Tampilkan semua papan
								</button>
							)}
						</div>
					)}
				</section>
			</main>

			{/* Settings Sheet */}
			<SettingsSheet
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				settings={appSettings}
				onSettingsChange={updateSettings}
			/>

			{/* Bottom Navigation */}
			<BottomNav
				onSettingsClick={() => setShowSettings(true)}
				timerRunning={timer.state === "running"}
			/>
		</div>
	);
}
