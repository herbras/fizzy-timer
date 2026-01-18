/**
 * Timer Controls Component
 * Play/pause/stop buttons for the timer
 */

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerControlsProps {
	state: "idle" | "running" | "paused" | "completed";
	onPause?: () => void;
	onResume?: () => void;
	onStop?: () => void;
	onReset?: () => void;
	loading?: boolean;
	className?: string;
}

const baseButtonClass =
	"rounded-full border transition-all flex items-center justify-center";

export function TimerControls({
	state,
	onPause,
	onResume,
	onStop,
	onReset,
	loading = false,
	className,
}: TimerControlsProps) {
	return (
		<div className={cn("flex items-center justify-center gap-4", className)}>
			{state === "running" && (
				<>
					<ButtonPrimitive
						className={cn(
							baseButtonClass,
							"h-16 w-16 border-gray-300 bg-white hover:bg-gray-50",
						)}
						onClick={onPause}
						disabled={loading}
					>
						<Pause className="h-6 w-6" />
					</ButtonPrimitive>
					<ButtonPrimitive
						className={cn(
							baseButtonClass,
							"h-16 w-16 border-red-300 bg-red-50 text-red-600 hover:bg-red-100",
						)}
						onClick={onStop}
						disabled={loading}
					>
						<Square className="h-6 w-6" />
					</ButtonPrimitive>
				</>
			)}

			{state === "paused" && (
				<>
					<ButtonPrimitive
						className={cn(
							baseButtonClass,
							"h-16 w-16 border-transparent bg-teal-500 text-white hover:bg-teal-600",
						)}
						onClick={onResume}
						disabled={loading}
					>
						<Play className="ml-1 h-6 w-6" />
					</ButtonPrimitive>
					<ButtonPrimitive
						className={cn(
							baseButtonClass,
							"h-16 w-16 border-gray-300 bg-white hover:bg-gray-50",
						)}
						onClick={onReset}
						disabled={loading}
					>
						<RotateCcw className="h-6 w-6" />
					</ButtonPrimitive>
					<ButtonPrimitive
						className={cn(
							baseButtonClass,
							"h-16 w-16 border-red-300 bg-red-50 text-red-600 hover:bg-red-100",
						)}
						onClick={onStop}
						disabled={loading}
					>
						<Square className="h-6 w-6" />
					</ButtonPrimitive>
				</>
			)}

			{state === "completed" && onReset && (
				<ButtonPrimitive
					className={cn(
						baseButtonClass,
						"h-12 border-gray-300 bg-white px-6 hover:bg-gray-50",
					)}
					onClick={onReset}
					disabled={loading}
				>
					<RotateCcw className="mr-2 h-5 w-5" />
					Start New Session
				</ButtonPrimitive>
			)}
		</div>
	);
}

interface CompactTimerControlsProps {
	state: "idle" | "running" | "paused" | "completed";
	onPause?: () => void;
	onResume?: () => void;
	onStop?: () => void;
	className?: string;
}

/**
 * Compact version for smaller displays
 */
export function CompactTimerControls({
	state,
	onPause,
	onResume,
	onStop,
	className,
}: CompactTimerControlsProps) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			{state === "running" && (
				<>
					<ButtonPrimitive
						className="flex h-8 items-center gap-1 rounded border border-gray-300 bg-white px-3 hover:bg-gray-50"
						onClick={onPause}
					>
						<Pause className="h-4 w-4" />
						<span>Pause</span>
					</ButtonPrimitive>
					<ButtonPrimitive
						className="flex h-8 items-center gap-1 rounded border border-red-300 bg-red-50 px-3 text-red-600 hover:bg-red-100"
						onClick={onStop}
					>
						<Square className="h-4 w-4" />
						<span>Stop</span>
					</ButtonPrimitive>
				</>
			)}

			{state === "paused" && (
				<>
					<ButtonPrimitive
						className="flex h-8 items-center gap-1 rounded border-transparent bg-teal-500 px-3 text-white hover:bg-teal-600"
						onClick={onResume}
					>
						<Play className="h-4 w-4" />
						<span>Resume</span>
					</ButtonPrimitive>
					<ButtonPrimitive
						className="flex h-8 items-center gap-1 rounded border border-red-300 bg-red-50 px-3 text-red-600 hover:bg-red-100"
						onClick={onStop}
					>
						<Square className="h-4 w-4" />
						<span>Stop</span>
					</ButtonPrimitive>
				</>
			)}
		</div>
	);
}
