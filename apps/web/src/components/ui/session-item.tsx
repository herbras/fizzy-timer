/**
 * Session Item Component
 * Displays a single tracking session
 * Dark Theme with Gold/Amber Accent
 */

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Trash2 } from "lucide-react";
import type { Session } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration, formatTime } from "@/lib/utils/time";

interface SessionItemProps {
	session: Session;
	onDelete?: (id: string) => void;
	showDate?: boolean;
	className?: string;
}

const deleteButtonClass =
	"text-zinc-500 hover:text-red-500 hover:bg-red-500/10 flex-shrink-0 flex items-center justify-center p-2 rounded-xl transition-colors";

export function SessionItem({
	session,
	onDelete,
	showDate = false,
	className,
}: SessionItemProps) {
	const sessionCount = session.sessionCount || 1;

	return (
		<div
			className={cn(
				"rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4 shadow-sm transition-all hover:border-zinc-700/50 hover:shadow-md",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				{/* Session Info */}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h4 className="truncate font-bold text-sm text-zinc-100">
							{session.cardTitle}
						</h4>
						{sessionCount > 1 && (
							<span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 font-bold text-[10px] text-amber-500">
								{sessionCount}x
							</span>
						)}
					</div>
					<p className="mt-0.5 font-semibold text-xs text-zinc-600 uppercase tracking-wide">
						#{session.cardNumber} • {session.boardName}
					</p>

					{/* Time Info */}
					<div className="mt-3 flex items-center gap-2">
						<span className="font-medium font-mono text-xs text-zinc-500">
							{formatTime(session.startTime)}
						</span>
						<span className="text-zinc-700">→</span>
						{session.endTime && (
							<span className="font-mono text-xs text-zinc-500">
								{formatTime(session.endTime)}
							</span>
						)}
						<span className="ml-auto font-bold font-mono text-amber-500 text-sm">
							{formatDuration(session.duration)}
						</span>
					</div>

					{/* Notes */}
					{session.notes && (
						<p className="mt-2 line-clamp-2 rounded-lg border border-zinc-800/30 bg-zinc-800/50 px-2 py-1.5 text-xs text-zinc-500 italic">
							"{session.notes}"
						</p>
					)}
				</div>

				{/* Delete Button */}
				{onDelete && (
					<ButtonPrimitive
						className={deleteButtonClass}
						onClick={() => onDelete(session.id)}
					>
						<Trash2 className="h-4 w-4" />
					</ButtonPrimitive>
				)}
			</div>
		</div>
	);
}

interface SessionGroupProps {
	date: string;
	sessions: Session[];
	onDelete?: (id: string) => void;
	className?: string;
}

export function SessionGroup({
	date,
	sessions,
	onDelete,
	className,
}: SessionGroupProps) {
	const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);

	return (
		<div className={cn("mb-6", className)}>
			{/* Group Header */}
			<div className="mb-3 flex items-center justify-between px-1">
				<h3 className="font-black text-xs text-zinc-600 uppercase tracking-widest">
					{date}
				</h3>
				<span className="font-bold text-amber-500 text-xs">
					{formatDuration(totalDuration)}
				</span>
			</div>

			{/* Sessions */}
			<div className="space-y-2">
				{sessions.map((session) => (
					<SessionItem key={session.id} session={session} onDelete={onDelete} />
				))}
			</div>
		</div>
	);
}

interface SessionListProps {
	sessions: Session[];
	grouped?: Record<string, Session[]>;
	onDelete?: (id: string) => void;
	loading?: boolean;
	emptyMessage?: string;
	className?: string;
}

export function SessionList({
	sessions,
	grouped,
	onDelete,
	loading,
	emptyMessage = "Belum ada sesi",
	className,
}: SessionListProps) {
	if (loading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="animate-pulse rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4"
					>
						<div className="mb-3 h-4 w-3/4 rounded-full bg-zinc-800" />
						<div className="h-3 w-1/2 rounded-full bg-zinc-800" />
					</div>
				))}
			</div>
		);
	}

	if (sessions.length === 0) {
		return (
			<div className="py-16 text-center">
				<div className="mb-4 inline-flex rounded-3xl border border-zinc-800/50 bg-zinc-900 p-4 shadow-sm">
					<span className="text-4xl">📊</span>
				</div>
				<p className="font-medium text-zinc-600">{emptyMessage}</p>
			</div>
		);
	}

	if (grouped) {
		const sortedDates = Object.keys(grouped).sort(
			(a, b) => new Date(b).getTime() - new Date(a).getTime(),
		);

		return (
			<div className={className}>
				{sortedDates.map((date) => (
					<SessionGroup
						key={date}
						date={date}
						sessions={grouped[date]}
						onDelete={onDelete}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{sessions.map((session) => (
				<SessionItem
					key={session.id}
					session={session}
					onDelete={onDelete}
					showDate
				/>
			))}
		</div>
	);
}
