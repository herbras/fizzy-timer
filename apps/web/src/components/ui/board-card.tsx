/**
 * Board Card Component
 * Dark Theme with Gold/Amber Accent
 */

import { cn } from "@/lib/utils";

interface BoardCardProps {
	name: string;
	color: string;
	isActive?: boolean;
	onClick?: () => void;
	className?: string;
}

export function BoardCard({
	name,
	color,
	isActive,
	onClick,
	className,
}: BoardCardProps) {
	return (
		<button
			onClick={onClick}
			className={cn(
				"flex-shrink-0 rounded-2xl px-5 py-2.5 font-bold text-sm transition-all",
				"min-w-fit max-w-[180px] border-2",
				isActive
					? "shadow-lg"
					: "border-transparent opacity-60 hover:opacity-100",
				className,
			)}
			style={{
				color: isActive ? color : "#71717a",
				borderColor: isActive ? color : "#27272a",
				backgroundColor: isActive ? `${color}20` : "#18181b",
			}}
		>
			<span className="block truncate">{name}</span>
		</button>
	);
}

interface BoardCardListProps {
	boards: Array<{ id: string; name: string; color: string }>;
	activeBoardId?: string | null;
	onBoardSelect: (boardId: string) => void;
	showAll?: boolean;
	className?: string;
}

export function BoardCardList({
	boards,
	activeBoardId,
	onBoardSelect,
	showAll = true,
	className,
}: BoardCardListProps) {
	return (
		<div
			className={cn(
				"scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto p-2",
				className,
			)}
		>
			{showAll && (
				<BoardCard
					name="Semua Papan"
					color="#f4f4f5"
					isActive={activeBoardId === null}
					onClick={() => onBoardSelect("")}
				/>
			)}
			{boards.map((board) => (
				<BoardCard
					key={board.id}
					name={board.name}
					color={board.color}
					isActive={activeBoardId === board.id}
					onClick={() => onBoardSelect(board.id)}
				/>
			))}
			{/* Spacer for scroll indicator */}
			<div className="w-2 flex-shrink-0" />
		</div>
	);
}
