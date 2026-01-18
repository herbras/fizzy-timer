/**
 * Timer Display Component
 * Big timer display for focus mode
 * Dark Theme with Gold/Amber Accent
 */

import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
	formattedTime: string;
	state: "idle" | "running" | "paused" | "completed";
	cardTitle: string;
	boardName: string;
	onPause?: () => void;
	onResume?: () => void;
	className?: string;
}

export function TimerDisplay({
	formattedTime,
	state,
	cardTitle,
	boardName,
	onPause,
	onResume,
	className,
}: TimerDisplayProps) {
	return (
		<div className={cn("flex flex-col items-center justify-center", className)}>
			{/* Timer Display */}
			<div className="relative">
				{/* Outer Circle */}
				<div className="flex h-64 w-64 items-center justify-center rounded-full border-8 border-zinc-800">
					{/* Inner Circle - changes based on state */}
					<div
						className={cn(
							"flex h-56 w-56 items-center justify-center rounded-full transition-colors",
							{
								"bg-amber-500": state === "running",
								"bg-zinc-700": state === "paused",
								"bg-zinc-800": state === "idle" || state === "completed",
							},
						)}
					>
						<div
							className={cn("text-center", {
								"text-black": state === "running",
								"text-zinc-100": state !== "running",
							})}
						>
							{/* Time */}
							<div className="font-bold font-mono text-6xl tracking-tight">
								{formattedTime}
							</div>

							{/* Status Icon */}
							{state === "running" && onPause && (
								<button
									onClick={onPause}
									className="mt-4 rounded-full bg-black/20 p-2 transition-colors hover:bg-black/30"
								>
									<Pause className="h-6 w-6" />
								</button>
							)}
							{state === "paused" && onResume && (
								<button
									onClick={onResume}
									className="mt-4 rounded-full bg-zinc-600/50 p-2 transition-colors hover:bg-zinc-600"
								>
									<Play className="ml-1 h-6 w-6" />
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Pulsing animation for running state */}
				{state === "running" && (
					<div className="absolute inset-0 animate-ping-slow rounded-full border-4 border-amber-500/50" />
				)}
			</div>

			{/* Card Info */}
			<div className="mt-8 text-center">
				<p className="mb-1 text-sm text-zinc-500">{boardName}</p>
				<h2 className="font-semibold text-xl text-zinc-100">{cardTitle}</h2>
			</div>
		</div>
	);
}

interface SimpleTimerDisplayProps {
	formattedTime: string;
	state: "idle" | "running" | "paused" | "completed";
	className?: string;
}

/**
 * Smaller timer display for dashboard widgets
 */
export function SimpleTimerDisplay({
	formattedTime,
	state,
	className,
}: SimpleTimerDisplayProps) {
	return (
		<div
			className={cn(
				"font-bold font-mono text-2xl tabular-nums",
				{
					"text-amber-500": state === "running",
					"text-zinc-400": state === "paused",
					"text-zinc-500": state === "idle" || state === "completed",
				},
				className,
			)}
		>
			{formattedTime}
		</div>
	);
}
