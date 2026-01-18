/**
 * Focus Route
 * Full-screen focus mode timer
 * Dark Theme with Gold/Amber Accent
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pause, Play, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { GifMascot } from "@/components/Mascot";
import { MIN_SESSION_DURATION } from "@/lib/constants";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import { useNotification } from "@/lib/hooks/useNotification";
import { createSession } from "@/lib/hooks/useSessions";
import { useSettings } from "@/lib/hooks/useSettings";
import { useTimer } from "@/lib/hooks/useTimer";
import { useSaveSession } from "@/lib/queries/useSessions";

export const Route = createFileRoute("/focus")({
	// Disable SSR for this route to prevent hydration mismatch
	// The timer displays real-time elapsed seconds which changes constantly
	ssr: false,
	component: FocusComponent,
});

function FocusComponent() {
	const navigate = useNavigate();
	const timer = useTimer();
	const { settings: appSettings } = useAppSettings();
	const { accountSlug, userId } = useSettings();
	const { requestPermission, showTimerCompleteNotification, supported } =
		useNotification();
	const saveSessionMutation = useSaveSession();
	const [notes, setNotes] = useState("");
	const [showStopConfirm, setShowStopConfirm] = useState(false);
	const [isInitialized, setIsInitialized] = useState(false);
	const [notificationRequested, setNotificationRequested] = useState(false);

	// Request notification permission on first visit
	useEffect(() => {
		if (supported && !notificationRequested && timer.state === "running") {
			requestPermission();
			setNotificationRequested(true);
		}
	}, [supported, notificationRequested, timer.state, requestPermission]);

	// Handle countdown timer completion
	useEffect(() => {
		if (
			timer.state === "completed" &&
			timer.data &&
			timer.mode === "countdown"
		) {
			// Show notification
			showTimerCompleteNotification(timer.data.card.title, timer.elapsed);
			// Also show in-app toast
			toast.success("Sesi fokus selesai. Kerja bagus!");
		}
	}, [
		timer.state,
		timer.data,
		timer.mode,
		timer.elapsed,
		showTimerCompleteNotification,
	]);

	// Get card/board from URL search params if coming from fresh load
	// Also handle redirect after initialization is complete
	useEffect(() => {
		// Only run once
		if (isInitialized) return;

		const search = window.location.search;
		const params = new URLSearchParams(search);
		const cardId = params.get("cardId");
		const boardId = params.get("boardId");
		const cardTitle = params.get("cardTitle");
		const boardName = params.get("boardName");
		const cardNumber = params.get("cardNumber");
		const previousElapsedStr = params.get("previousElapsed");
		const previousElapsed = previousElapsedStr
			? Number.parseInt(previousElapsedStr, 10)
			: 0;

		// If timer is idle but params provided, restore timer state
		if (
			timer.state === "idle" &&
			cardId &&
			boardId &&
			cardTitle &&
			boardName &&
			cardNumber
		) {
			timer.start({
				card: {
					id: cardId,
					boardId,
					boardName,
					columnId: "",
					columnName: "",
					title: cardTitle,
					number: Number.parseInt(cardNumber, 10),
					status: "todo",
					description: null,
					tags: [],
					golden: false,
					createdAt: "",
					lastActiveAt: "",
					url: "",
					creatorId: "",
					creatorName: "",
					isOwner: false,
				},
				board: {
					id: boardId,
					name: boardName,
					color: "#71717a",
				},
				previousElapsed, // Start from accumulated time
			});
		}

		// Mark as initialized - timer state is now stable
		setIsInitialized(true);
	}, [timer, isInitialized]);

	// Exit focus mode if no timer running (but only after initialization)
	useEffect(() => {
		// Wait until initialization is complete before checking
		if (!isInitialized) return;

		// Only redirect if timer is idle and no confirmation dialog is showing
		if (timer.state === "idle" && !showStopConfirm) {
			navigate({ to: "/home" });
		}
	}, [timer.state, showStopConfirm, navigate, isInitialized]);

	// Pause timer when leaving page, resync when returning
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (timer.state === "running") {
				e.preventDefault();
				e.returnValue = "";
			}
		};

		// Resync timer when user returns to the app
		// This ensures the displayed time matches actual elapsed time
		const handleVisibilityChange = () => {
			if (!document.hidden && timer.state === "running") {
				timer.resync();
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [timer.state, timer.resync]);

	// Wake Lock - keep screen on while timer is running
	useEffect(() => {
		let wakeLock: WakeLockSentinel | null = null;

		const requestWakeLock = async () => {
			try {
				if ("wakeLock" in navigator) {
					wakeLock = await navigator.wakeLock.request("screen");
				}
			} catch (err) {
				console.log("[Focus] Wake Lock failed:", err);
			}
		};

		if (timer.state === "running") {
			requestWakeLock();
		}

		return () => {
			wakeLock?.release();
		};
	}, [timer.state]);

	// Stop timer and save session
	const handleStop = useCallback(async () => {
		if (!timer.data) return;

		// Verify we have account info before creating session
		if (!accountSlug || !userId) {
			toast.error("Akun belum diatur dengan benar");
			timer.reset();
			navigate({ to: "/home" });
			return;
		}

		const sessionBase = createSession(
			timer.data.card.id,
			timer.data.card.title,
			timer.data.card.number,
			timer.data.board.id,
			timer.data.board.name,
			accountSlug, // accountId
			userId, // userId
		);

		// Use sessionElapsed (current session only) not total elapsed
		// timer.elapsed = total accumulated, timer.sessionElapsed = current session duration
		const currentSessionDuration = timer.sessionElapsed;

		const sessionData: import("@/lib/db/schema").Session = {
			...sessionBase,
			duration: currentSessionDuration,
			endTime: Date.now(),
		};

		// Add notes
		if (notes.trim()) {
			sessionData.notes = notes.trim();
		}

		// Check minimum duration
		if (sessionData.duration < MIN_SESSION_DURATION) {
			toast.error(
				`Sesi terlalu singkat. Minimal ${MIN_SESSION_DURATION} detik.`,
			);
			timer.reset();
			navigate({ to: "/home" });
			return;
		}

		// Save session with mutation - will auto-invalidate queries
		try {
			await saveSessionMutation.mutateAsync(sessionData);
			toast.success("Sesi disimpan!");
			timer.reset();
			navigate({ to: "/home" });
		} catch (error) {
			console.error("[Focus] Failed to save session:", error);
			toast.error("Gagal menyimpan sesi. Coba lagi.");
		}
	}, [timer, notes, navigate, accountSlug, userId, saveSessionMutation]);

	// Confirm stop
	const handleStopClick = useCallback(() => {
		if (timer.state === "running" || timer.state === "paused") {
			setShowStopConfirm(true);
		}
	}, [timer.state]);

	// Cancel stop
	const handleCancelStop = useCallback(() => {
		setShowStopConfirm(false);
	}, []);

	// Exit without saving
	const handleExit = useCallback(() => {
		timer.reset();
		navigate({ to: "/home" });
	}, [timer, navigate]);

	if (!timer.data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#050505]">
				<p className="text-zinc-500">Memuat...</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col bg-[#050505]">
			{/* Header */}
			<header className="flex items-center justify-between px-4 py-4">
				<button
					onClick={handleExit}
					aria-label="Keluar"
					className="rounded-lg p-2 text-zinc-600 transition hover:text-zinc-300 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
				>
					<X className="h-6 w-6" aria-hidden="true" />
				</button>
				<div className="w-6" />
			</header>

			{/* Main Content */}
			<main className="flex flex-1 animate-zoom-in-95 flex-col items-center justify-center space-y-8 px-4 pb-safe sm:space-y-12">
				{/* Card Title */}
				<div className="max-w-md space-y-3 text-center">
					<h1 className="break-words font-black text-xl text-zinc-100 tracking-tight sm:text-2xl md:text-3xl">
						{timer.data.card.title}
					</h1>
				</div>

				{/* Mascot Display */}
				{appSettings.showAnimal && (
					<div className="relative">
						<GifMascot mood={appSettings.moodType} isVisible={true} size="xl" />
					</div>
				)}

				{/* Timer Display */}
				<div className="flex flex-col items-center gap-2 pt-2 sm:pt-4">
					<div
						className="break-all font-black text-5xl text-zinc-100 tabular-nums tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl"
						aria-live="polite"
						aria-atomic="true"
					>
						<span
							aria-label={`${timer.mode === "countdown" ? "Waktu tersisa" : "Waktu berjalan"}: ${timer.formattedTime}`}
						>
							{timer.formattedTime}
						</span>
					</div>
					<div className="mt-2 flex items-center gap-2">
						<p className="font-bold text-[9px] text-zinc-200 uppercase tracking-[0.2em]">
							{timer.mode === "countdown"
								? "Timer Hitung Mundur"
								: "Sesi Fokus"}
						</p>
					</div>
				</div>

				{/* Timer Controls */}
				<div className="flex items-center gap-4 sm:gap-6">
					<button
						onClick={() => {
							if (timer.state === "running") {
								timer.pause();
							} else {
								timer.resume();
							}
						}}
						aria-label={
							timer.state === "running" ? "Jeda timer" : "Lanjutkan timer"
						}
						className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-600 bg-zinc-800 text-zinc-100 shadow-lg backdrop-blur-xl transition-all hover:bg-zinc-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-90 sm:h-20 sm:w-20"
					>
						{timer.state === "running" ? (
							<Pause
								size={28}
								className="sm:hidden"
								fill="currentColor"
								stroke="none"
								aria-hidden="true"
							/>
						) : (
							<Play
								size={28}
								className="translate-x-1 sm:hidden"
								fill="currentColor"
								stroke="none"
								aria-hidden="true"
							/>
						)}
						{timer.state === "running" ? (
							<Pause
								size={32}
								className="hidden sm:block"
								fill="currentColor"
								stroke="none"
								aria-hidden="true"
							/>
						) : (
							<Play
								size={32}
								className="hidden translate-x-1 sm:block"
								fill="currentColor"
								stroke="none"
								aria-hidden="true"
							/>
						)}
					</button>

					<button
						onClick={handleStopClick}
						aria-label="Akhiri sesi"
						className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-500 bg-zinc-900 shadow-xl transition-all hover:bg-zinc-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-95 sm:h-20 sm:w-20"
					>
						<div
							className="h-5 w-5 bg-red-500 sm:h-6 sm:w-6"
							aria-hidden="true"
						/>
					</button>
				</div>

				{/* Notes Input */}
				{timer.state === "paused" && (
					<div className="mt-4 w-full max-w-md">
						<label htmlFor="session-notes" className="sr-only">
							Catatan sesi
						</label>
						<textarea
							id="session-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Tambah catatan tentang sesi ini..."
							className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-zinc-100 outline-none backdrop-blur-xl placeholder:text-zinc-600 focus:border-transparent focus:ring-2 focus:ring-amber-500"
							rows={3}
						/>
					</div>
				)}

				{/* Confirm Stop Dialog */}
				{showStopConfirm && (
					<div
						className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/80 backdrop-blur-sm"
						role="dialog"
						aria-modal="true"
						aria-labelledby="dialog-title"
					>
						<div className="mx-4 w-full max-w-sm animate-zoom-in-95 rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6">
							<h3
								id="dialog-title"
								className="mb-2 font-bold text-xl text-zinc-100"
							>
								Akhiri Sesi?
							</h3>
							<p className="mb-6 text-sm text-zinc-500">
								Simpan progres Anda dan keluar dari mode fokus.
							</p>
							<div className="flex gap-3">
								<button
									onClick={handleCancelStop}
									className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 font-semibold text-zinc-300 transition hover:bg-zinc-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
								>
									Batal
								</button>
								<button
									onClick={handleStop}
									className="flex-1 rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-black transition hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
								>
									Simpan & Keluar
								</button>
							</div>
						</div>
					</div>
				)}
			</main>

			{/* Footer */}
			<footer className="px-4 py-6 text-center">
				<p className="font-medium text-xs text-zinc-600">
					{timer.state === "running" ? "Tetap fokus!" : "Jeda"}
				</p>
			</footer>
		</div>
	);
}
