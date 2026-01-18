/**
 * Timer Hook
 * Manages timer state (running, paused, stopped)
 * Supports countdown timer with preset durations
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Board, Card } from "../db/schema";

export type TimerState = "idle" | "running" | "paused" | "completed";
export type TimerMode = "countdown" | "stopwatch";

export interface TimerData {
	card: Card;
	board: Board;
	notes?: string;
	previousElapsed?: number; // Previously accumulated time for this card
}

export interface UseTimerReturn {
	state: TimerState;
	mode: TimerMode;
	elapsed: number; // Total elapsed seconds (previous + current session)
	sessionElapsed: number; // Current session elapsed only
	remaining: number; // Remaining seconds (for countdown mode)
	formattedTime: string;
	data: TimerData | null;
	start: (data: TimerData, durationSeconds?: number) => void;
	pause: () => void;
	resume: () => void;
	stop: () => void;
	reset: () => void;
	resync: () => void;
	setMode: (mode: TimerMode) => void;
}

// Preset durations in seconds
export const TIMER_PRESETS = {
	"25m": 25 * 60,
	"50m": 50 * 60,
	"1h": 60 * 60,
	"1.5h": 90 * 60,
	"2h": 120 * 60,
} as const;

export type TimerPreset = keyof typeof TIMER_PRESETS;

const TIMER_STORAGE_KEY = "fizzy-timer-state";

// Get saved timer state from localStorage
function getSavedTimerState(): {
	data: TimerData | null;
	startTime: number | null;
	elapsed: number;
	previousElapsed: number;
	mode: TimerMode;
	duration?: number;
} {
	try {
		const saved = localStorage.getItem(TIMER_STORAGE_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			// Check if timer was running and calculate elapsed time
			if (parsed.startTime && parsed.state === "running") {
				const currentSessionElapsed = Math.floor(
					(Date.now() - parsed.startTime) / 1000,
				);
				return {
					data: parsed.data,
					startTime: parsed.startTime,
					elapsed: currentSessionElapsed,
					previousElapsed: parsed.previousElapsed || 0,
					mode: parsed.mode || "stopwatch",
					duration: parsed.duration,
				};
			}
			return {
				data: parsed.data || null,
				startTime: null,
				elapsed: parsed.elapsed || 0,
				previousElapsed: parsed.previousElapsed || 0,
				mode: parsed.mode || "stopwatch",
				duration: parsed.duration,
			};
		}
	} catch (error) {
		console.warn(
			"[useTimer] Failed to read timer state from localStorage:",
			error,
		);
	}
	return {
		data: null,
		startTime: null,
		elapsed: 0,
		previousElapsed: 0,
		mode: "stopwatch",
	};
}

// Clear saved timer state
function clearSavedTimerState() {
	try {
		localStorage.removeItem(TIMER_STORAGE_KEY);
	} catch (error) {
		console.warn("[useTimer] Failed to clear timer state:", error);
	}
}

// Save timer state to localStorage
function saveTimerState(
	state: TimerState,
	data: TimerData | null,
	startTime: number | null,
	elapsed: number,
	previousElapsed: number,
	mode: TimerMode,
	duration?: number,
) {
	try {
		localStorage.setItem(
			TIMER_STORAGE_KEY,
			JSON.stringify({
				state,
				data,
				startTime,
				elapsed,
				previousElapsed,
				mode,
				duration,
				savedAt: Date.now(),
			}),
		);
	} catch (error) {
		console.warn("[useTimer] Failed to save timer state:", error);
	}
}

/**
 * Hook for managing focus timer
 */
export function useTimer(): UseTimerReturn {
	const [state, setState] = useState<TimerState>("idle");
	const [mode, setModeState] = useState<TimerMode>("stopwatch");
	const [currentSessionElapsed, setCurrentSessionElapsed] = useState(0); // Current session elapsed only
	const [data, setData] = useState<TimerData | null>(null);

	// Use refs to track current values without causing stale closures
	const startTimeRef = useRef<number | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const stateRef = useRef<TimerState>("idle");
	const previousElapsedRef = useRef(0); // Track accumulated time from previous sessions
	const isInitializedRef = useRef(false);
	const durationRef = useRef<number | undefined>(undefined); // Countdown duration
	const onTimerCompleteRef = useRef<(() => void) | null>(null);

	// Keep refs in sync with state
	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	// Restore timer state on mount (run once)
	useEffect(() => {
		if (isInitializedRef.current) return;

		const saved = getSavedTimerState();
		if (saved.data) {
			setData(saved.data);
			previousElapsedRef.current = saved.previousElapsed;
			setModeState(saved.mode);
			durationRef.current = saved.duration;

			if (saved.startTime) {
				// Timer was running - calculate current elapsed
				const currentElapsed = Math.floor(
					(Date.now() - saved.startTime) / 1000,
				);
				setState("running");
				stateRef.current = "running";
				startTimeRef.current = saved.startTime;
				setCurrentSessionElapsed(currentElapsed);

				// Check if countdown timer has expired
				if (saved.mode === "countdown" && saved.duration) {
					const remaining = saved.duration - currentElapsed;
					if (remaining <= 0) {
						// Timer expired while app was closed
						setCurrentSessionElapsed(saved.duration);
						setState("completed");
						stateRef.current = "completed";
						startTimeRef.current = null;
					}
				}
			} else if (saved.elapsed > 0) {
				// Timer was paused
				setState("paused");
				stateRef.current = "paused";
				setCurrentSessionElapsed(saved.elapsed);
			}
		}
		isInitializedRef.current = true;
	}, []);

	// Save state to localStorage whenever it changes (but not on every tick)
	useEffect(() => {
		if (!isInitializedRef.current || state === "idle") return;

		// Throttle saves - don't save on every elapsed update
		const saveTimer = () => {
			saveTimerState(
				state,
				data,
				startTimeRef.current,
				currentSessionElapsed,
				previousElapsedRef.current,
				mode,
				durationRef.current,
			);
		};

		// Save immediately on state/data changes
		saveTimer();
	}, [state, data, mode]); // Remove currentSessionElapsed from dependency array

	// Also save elapsed time periodically (every 5 seconds) when running
	useEffect(() => {
		if (state !== "running") return;

		const saveInterval = setInterval(() => {
			saveTimerState(
				state,
				data,
				startTimeRef.current,
				currentSessionElapsed,
				previousElapsedRef.current,
				mode,
				durationRef.current,
			);
		}, 5000);

		return () => clearInterval(saveInterval);
	}, [state, data, currentSessionElapsed, mode]);

	// Update elapsed time every second when running
	useEffect(() => {
		if (state === "running") {
			intervalRef.current = setInterval(() => {
				if (startTimeRef.current) {
					const newElapsed = Math.floor(
						(Date.now() - startTimeRef.current) / 1000,
					);
					setCurrentSessionElapsed(newElapsed);

					// Check if countdown timer has reached zero
					if (mode === "countdown" && durationRef.current) {
						if (newElapsed >= durationRef.current) {
							// Timer complete!
							setCurrentSessionElapsed(durationRef.current);
							setState("completed");
							stateRef.current = "completed";
							startTimeRef.current = null;
							// Trigger completion callback
							onTimerCompleteRef.current?.();
						}
					}
				}
			}, 1000);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [state, mode]);

	const start = useCallback(
		(timerData: TimerData, durationSeconds?: number) => {
			const startingElapsed = timerData.previousElapsed || 0;
			previousElapsedRef.current = startingElapsed;

			// Set mode based on whether duration is provided
			const newMode = durationSeconds ? "countdown" : "stopwatch";
			setModeState(newMode);
			durationRef.current = durationSeconds;

			setState("running");
			stateRef.current = "running";
			setData(timerData);
			// Start fresh session from 0
			setCurrentSessionElapsed(0);
			startTimeRef.current = Date.now();
		},
		[],
	);

	const pause = useCallback(() => {
		// Use ref to check current state, avoiding stale closure
		if (stateRef.current === "running") {
			setState("paused");
			stateRef.current = "paused";
			startTimeRef.current = null;
		}
	}, []);

	const resume = useCallback(() => {
		// Use ref to check current state and elapsed, avoiding stale closure
		if (stateRef.current === "paused") {
			setState("running");
			stateRef.current = "running";
			// Adjust start time so elapsed time is preserved
			startTimeRef.current = Date.now() - currentSessionElapsed * 1000;
		}
	}, [currentSessionElapsed]);

	const stop = useCallback(() => {
		// Stop the timer and clear interval
		setState("completed");
		stateRef.current = "completed";
		startTimeRef.current = null;
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	const reset = useCallback(() => {
		setState("idle");
		stateRef.current = "idle";
		setCurrentSessionElapsed(0);
		previousElapsedRef.current = 0;
		setData(null);
		setModeState("stopwatch");
		durationRef.current = undefined;
		startTimeRef.current = null;
		clearSavedTimerState();
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	// Resync timer with actual elapsed time from startTime
	// Used when returning to app after being in background
	const resync = useCallback(() => {
		// Force recalculate elapsed from startTime
		if (stateRef.current === "running" && startTimeRef.current) {
			const newElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
			setCurrentSessionElapsed(newElapsed);

			// Check if countdown timer has expired while in background
			if (mode === "countdown" && durationRef.current) {
				if (newElapsed >= durationRef.current) {
					setCurrentSessionElapsed(durationRef.current);
					setState("completed");
					stateRef.current = "completed";
					startTimeRef.current = null;
					onTimerCompleteRef.current?.();
				}
			}
		}
	}, [mode]);

	// Set timer mode manually
	const setMode = useCallback((newMode: TimerMode) => {
		if (stateRef.current === "idle") {
			setModeState(newMode);
		}
	}, []);

	// Register callback for timer completion
	const onTimerComplete = useCallback((callback: () => void) => {
		onTimerCompleteRef.current = callback;
	}, []);

	// Calculate total elapsed (previous + current session)
	const totalElapsed = currentSessionElapsed + previousElapsedRef.current;

	// Calculate remaining time for countdown mode
	const remaining = useMemo(() => {
		if (mode === "countdown" && durationRef.current) {
			return Math.max(0, durationRef.current - currentSessionElapsed);
		}
		return 0;
	}, [mode, currentSessionElapsed]);

	// Format time as HH:MM:SS (elapsed for stopwatch, remaining for countdown)
	const formattedTime = useMemo(() => {
		const timeToFormat = mode === "countdown" ? remaining : totalElapsed;
		const hours = Math.floor(timeToFormat / 3600);
		const minutes = Math.floor((timeToFormat % 3600) / 60);
		const seconds = timeToFormat % 60;

		if (hours > 0) {
			return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
		}
		return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}, [mode, remaining, totalElapsed]);

	return {
		state,
		mode,
		elapsed: totalElapsed, // Return total elapsed for external use
		sessionElapsed: currentSessionElapsed, // Current session only
		remaining,
		formattedTime,
		data,
		start,
		pause,
		resume,
		stop,
		reset,
		resync,
		setMode,
		// @ts-expect-error - internal method
		onTimerComplete,
	};
}
