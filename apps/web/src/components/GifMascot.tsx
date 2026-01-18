/**
 * GIF Mascot Component
 * Displays random GIFs based on mood
 * Dark Theme with Gold/Amber Accent
 */

import { useEffect, useMemo, useState } from "react";
import { MOOD_GIFS, MOOD_INFO, type MoodType } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface GifMascotProps {
	mood: MoodType;
	isVisible: boolean;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

// Get a random GIF from the mood's collection
function getRandomGif(mood: MoodType, seed?: string): string {
	const gifs = MOOD_GIFS[mood];
	if (gifs.length === 0) return "";

	// Use seed for consistent random, or random if no seed
	if (seed) {
		const hash = seed
			.split("")
			.reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return gifs[hash % gifs.length];
	}

	return gifs[Math.floor(Math.random() * gifs.length)];
}

const SIZE_CLASSES = {
	sm: "w-20 h-20",
	md: "w-32 h-32",
	lg: "w-48 h-48",
	xl: "w-64 h-64",
};

export function GifMascot({
	mood,
	isVisible,
	size = "lg",
	className,
}: GifMascotProps) {
	const [gifUrl, setGifUrl] = useState("");
	const moodInfo = MOOD_INFO[mood];

	// Get a random GIF on mount and when mood changes
	useEffect(() => {
		if (isVisible) {
			// Use time-based seed for variety but consistent during session
			const seed = `${mood}-${Math.floor(Date.now() / 60000)}`; // Changes every minute
			setGifUrl(getRandomGif(mood, seed));
		}
	}, [mood, isVisible]);

	// Allow manual refresh
	const refreshGif = () => {
		setGifUrl(getRandomGif(mood));
	};

	if (!isVisible || !gifUrl) return null;

	return (
		<div className={cn("relative flex items-center justify-center", className)}>
			{/* GIF Container */}
			<div className={cn("overflow-hidden rounded-3xl", SIZE_CLASSES[size])}>
				<img
					src={gifUrl}
					alt={moodInfo.name}
					className="h-full w-full object-cover"
					draggable={false}
				/>
			</div>
		</div>
	);
}

/**
 * Small GIF mascot version for header
 */
export function GifMascotAvatar({
	mood,
	className,
}: {
	mood: MoodType;
	className?: string;
}) {
	const [gifUrl, setGifUrl] = useState("");
	const moodInfo = MOOD_INFO[mood];

	useEffect(() => {
		const seed = `${mood}-${Math.floor(Date.now() / 60000)}`;
		setGifUrl(getRandomGif(mood, seed));
	}, [mood]);

	if (!gifUrl) return null;

	return (
		<div
			className={cn(
				"h-10 w-10 overflow-hidden rounded-xl border border-zinc-700/50 shadow-lg",
				className,
			)}
		>
			<img
				src={gifUrl}
				alt={moodInfo.name}
				className="h-full w-full object-cover"
				draggable={false}
			/>
		</div>
	);
}
