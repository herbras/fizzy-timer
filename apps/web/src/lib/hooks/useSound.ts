/**
 * Sound Hook
 * Web Audio API for timer sounds
 */

import { useEffect, useRef } from "react";

interface UseSoundProps {
	enabled: boolean;
}

export function useSound({ enabled }: UseSoundProps) {
	const audioCtxRef = useRef<AudioContext | null>(null);

	// Get or create AudioContext
	const getAudioContext = () => {
		if (!audioCtxRef.current) {
			const AudioContextClass =
				window.AudioContext || (window as any).webkitAudioContext;
			audioCtxRef.current = new AudioContextClass();
		}
		return audioCtxRef.current;
	};

	// Play sound
	const playSound = (type: "start" | "end") => {
		if (!enabled) return;

		try {
			const ctx = getAudioContext();
			if (ctx.state === "suspended") {
				ctx.resume();
			}

			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.connect(gain);
			gain.connect(ctx.destination);

			const now = ctx.currentTime;

			if (type === "start") {
				// Soft start "pip" sound
				osc.type = "sine";
				osc.frequency.setValueAtTime(440, now);
				osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
				gain.gain.linearRampToValueAtTime(0, now + 0.15);
				osc.start(now);
				osc.stop(now + 0.15);
			} else {
				// Celebration chime
				osc.type = "sine";
				osc.frequency.setValueAtTime(523.25, now); // C5
				osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
				osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
				osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6

				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
				gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

				osc.start(now);
				osc.stop(now + 0.8);
			}
		} catch (e) {
			console.error("[useSound] Failed to play sound:", e);
		}
	};

	// Cleanup
	useEffect(() => {
		return () => {
			if (audioCtxRef.current) {
				audioCtxRef.current.close();
			}
		};
	}, []);

	return {
		playStartSound: () => playSound("start"),
		playEndSound: () => playSound("end"),
	};
}
