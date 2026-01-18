/**
 * Task Card Component
 * Displays a Fizzy card with status, metadata, and time credit
 * Dark Theme with Gold/Amber Accent
 * WCAG AA Compliant
 */

import { Link } from "@tanstack/react-router";
import { Clock, Play, Star, User } from "lucide-react";
import { STATUS_COLORS } from "@/lib/constants";
import type { Card } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface TaskCardProps {
	card: Card;
	boardName?: string;
	boardColor?: string;
	to?: string;
	onClick?: () => void;
	className?: string;
	showBoard?: boolean;
	totalSeconds?: number; // Total time credit for this card
}

const statusStyles: Record<Card["status"], string> = {
	todo: "status-todo",
	"in-progress": "status-in-progress",
	done: "status-done",
};

const statusLabels: Record<Card["status"], string> = {
	todo: "Akan Dikerjakan",
	"in-progress": "Sedang Dikerjakan",
	done: "Selesai",
};

// Format seconds to human readable time
function formatTimeCredit(seconds: number): string {
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) {
		return `${minutes}m`;
	}
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function TaskCard({
	card,
	boardName,
	boardColor,
	to,
	onClick,
	className,
	showBoard = true,
	totalSeconds = 0,
}: TaskCardProps) {
	const content = (
		<div className="flex gap-3 sm:gap-4">
			{/* Left: Card Info */}
			<div className="min-w-0 flex-1">
				{/* Status & Number */}
				<div className="mb-2 flex items-center gap-2">
					{card.golden && (
						<Star
							className="h-3.5 w-3.5 flex-shrink-0 fill-amber-500 text-amber-500"
							aria-label="Golden card"
						/>
					)}
					<span
						className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider"
						aria-label="Card number"
					>
						#{card.number}
					</span>
					<span
						className={cn(
							"flex-shrink-0 rounded-full px-2 py-0.5 font-bold text-[9px] uppercase tracking-wide",
							statusStyles[card.status],
						)}
						aria-label={`Status: ${statusLabels[card.status]}`}
					>
						{statusLabels[card.status]}
					</span>
				</div>

				{/* Column Name */}
				<div className="mb-1 truncate font-semibold text-[10px] text-zinc-500 uppercase tracking-wide">
					{card.columnName}
				</div>

				{/* Card Title - High contrast for WCAG AA */}
				<h3 className="mb-2 line-clamp-2 break-words font-bold text-white leading-snug">
					{card.title}
				</h3>

				{/* Owner */}
				<div className="flex items-center gap-1 text-[10px] text-zinc-400">
					<User className="h-3 w-3" aria-hidden="true" />
					<span className="truncate">{card.creatorName}</span>
					{card.isOwner && (
						<span
							className="ml-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-bold text-[8px] text-amber-400"
							aria-label="Your card"
						>
							YOU
						</span>
					)}
				</div>

				{/* Footer */}
				<div className="mt-3 flex items-center justify-between border-zinc-800/50 border-t pt-3">
					{showBoard && card.boardName && (
						<span
							className="inline-block max-w-[100px] truncate whitespace-nowrap rounded-lg px-2 py-1 font-semibold text-[10px] sm:max-w-[120px]"
							style={{
								color: boardColor || "#a1a1aa",
								backgroundColor: `${boardColor || "#71717a"}20`,
								borderColor: `${boardColor || "#71717a"}40`,
							}}
						>
							{card.boardName}
						</span>
					)}
					{card.tags.length > 0 && (
						<div className="flex gap-1 overflow-hidden">
							{card.tags.slice(0, 2).map((tag) => (
								<span
									key={tag}
									className="flex-shrink-0 rounded-lg border border-zinc-700/60 bg-zinc-800/80 px-2 py-0.5 font-bold text-[8px] text-zinc-300 uppercase tracking-wide"
								>
									{tag}
								</span>
							))}
							{card.tags.length > 2 && (
								<span className="flex-shrink-0 rounded-lg border border-zinc-700/60 bg-zinc-800/80 px-2 py-0.5 font-bold text-[8px] text-zinc-300 uppercase tracking-wide">
									+{card.tags.length - 2}
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Right: Time Credit & Play Button */}
			<div className="flex flex-shrink-0 flex-col items-end gap-2">
				{/* Time Credit Display */}
				{totalSeconds > 0 && (
					<div className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-1">
						<Clock className="h-3 w-3 text-emerald-400" aria-hidden="true" />
						<span
							className="font-bold text-emerald-400 text-xs tabular-nums"
							aria-label={`Total time: ${formatTimeCredit(totalSeconds)}`}
						>
							{formatTimeCredit(totalSeconds)}
						</span>
					</div>
				)}

				{/* Play Button */}
				<div
					className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-zinc-700/60 bg-zinc-800/60 text-zinc-500 transition-all group-hover:border-amber-500 group-hover:bg-amber-500 group-hover:text-black sm:h-14 sm:w-14"
					aria-label="Start timer"
				>
					<Play size={18} sm:size={20} fill="currentColor" className="ml-0.5" />
				</div>
			</div>
		</div>
	);

	const cardClass = cn(
		// Base styles - Dark card bevel effect
		"card-bevel rounded-2xl p-5",
		// Hover effects
		"group cursor-pointer transition-all duration-200",
		className,
	);

	if (to) {
		return (
			<Link to={to} className={cardClass}>
				{content}
			</Link>
		);
	}

	return (
		<button onClick={onClick} className={cardClass}>
			{content}
		</button>
	);
}

interface TaskCardListProps {
	cards: Card[];
	boardsMap?: Map<string, { name: string; color: string }>;
	onCardClick?: (card: Card) => void;
	loading?: boolean;
	className?: string;
	cardTimes?: Map<string, number>; // Map cardId -> total seconds
}

export function TaskCardList({
	cards,
	boardsMap,
	onCardClick,
	loading,
	className,
	cardTimes,
}: TaskCardListProps) {
	if (loading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="animate-pulse rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4"
					>
						<div className="mb-2 h-4 w-3/4 rounded bg-zinc-800" />
						<div className="h-3 w-1/2 rounded bg-zinc-800" />
					</div>
				))}
			</div>
		);
	}

	if (cards.length === 0) {
		return (
			<div className="py-12 text-center" role="status" aria-live="polite">
				<p className="text-zinc-500">Tidak ada kartu ditemukan</p>
			</div>
		);
	}

	return (
		<div className={cn("space-y-3", className)}>
			{cards.map((card) => {
				const board = boardsMap?.get(card.boardId);
				const totalSeconds = cardTimes?.get(card.id) || 0;
				return (
					<TaskCard
						key={card.id}
						card={card}
						boardName={board?.name}
						boardColor={board?.color}
						totalSeconds={totalSeconds}
						onClick={() => onCardClick?.(card)}
					/>
				);
			})}
		</div>
	);
}
