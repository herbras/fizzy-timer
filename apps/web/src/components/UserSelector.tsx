/**
 * UserSelector Component
 * Simple dropdown with user avatars
 */

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FizzyUser } from "@/lib/services/fizzy";

/**
 * Generate a consistent gradient for a user based on their name
 */
function getUserGradient(name: string): string {
	const gradients = [
		"from-amber-500 to-orange-600",
		"from-blue-500 to-cyan-600",
		"from-purple-500 to-pink-600",
		"from-green-500 to-emerald-600",
		"from-red-500 to-rose-600",
		"from-indigo-500 to-violet-600",
		"from-teal-500 to-cyan-600",
		"from-orange-500 to-amber-600",
	];

	// Simple hash function to get consistent gradient for same name
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}

	const index = Math.abs(hash) % gradients.length;
	return gradients[index];
}

interface UserSelectorProps {
	users: FizzyUser[];
	currentUserId: string | null;
	selectedUserId: string | undefined;
	onUserSelect: (userId: string | undefined) => void;
	disabled?: boolean;
	loading?: boolean;
}

export function UserSelector({
	users,
	currentUserId,
	selectedUserId,
	onUserSelect,
	disabled = false,
	loading = false,
}: UserSelectorProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				!buttonRef.current?.contains(event.target as Node)
			) {
				setIsExpanded(false);
			}
		};

		if (isExpanded) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [isExpanded]);

	// Get current selected user
	const selectedUser = users.find(
		(u) => u.id === (selectedUserId || currentUserId),
	);
	const selectedGradient = selectedUser?.name
		? getUserGradient(selectedUser.name)
		: "from-amber-500 to-orange-600";

	if (loading) {
		return (
			<div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 animate-pulse rounded-full bg-zinc-800" />
					<div className="flex-1">
						<div className="mb-2 h-4 animate-pulse rounded bg-zinc-800" />
						<div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative">
			{/* Trigger Button */}
			<button
				ref={buttonRef}
				onClick={() => {
					console.log("Button clicked! isExpanded:", isExpanded);
					setIsExpanded(!isExpanded);
				}}
				disabled={disabled}
				className="group w-full rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4 transition-all duration-300 hover:border-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50"
				aria-label="Pilih user"
				aria-expanded={isExpanded}
			>
				<div className="flex items-center gap-3">
					{/* User Avatar */}
					<div className="relative">
						<div
							className={`h-10 w-10 bg-gradient-to-br ${selectedGradient} flex items-center justify-center rounded-full font-bold text-sm text-zinc-900 shadow-lg`}
						>
							{selectedUser?.name?.charAt(0).toUpperCase() || "?"}
						</div>
						{selectedUserId && selectedUserId !== currentUserId && (
							<div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-zinc-900 bg-amber-500">
								<Check className="h-2.5 w-2.5 text-zinc-900" />
							</div>
						)}
					</div>

					{/* User Info */}
					<div className="flex-1 text-left">
						<p className="font-semibold text-sm text-zinc-100">
							{selectedUser?.name || "Pilih User"}
						</p>
						<p className="text-xs text-zinc-500">
							{selectedUserId && selectedUserId !== currentUserId
								? "Melihat laporan user lain"
								: "Melihat laporan Anda"}
						</p>
					</div>

					{/* Dropdown Icon */}
					<ChevronDown
						className={`h-5 w-5 text-zinc-500 transition-transform duration-300 ${
							isExpanded ? "rotate-180 text-amber-500" : ""
						}`}
					/>
				</div>
			</button>

			{/* Dropdown Menu - Simple version */}
			{isExpanded && (
				<div
					ref={menuRef}
					className="absolute top-full right-0 left-0 mt-2 overflow-hidden rounded-2xl border-2 border-zinc-700 bg-zinc-900 shadow-2xl"
					style={{
						zIndex: 99999,
						maxHeight: "400px",
						overflowY: "auto",
					}}
				>
					<div className="py-2">
						{users.map((user) => {
							const isCurrent = user.id === currentUserId;
							const isSelected = user.id === (selectedUserId || currentUserId);
							const userName = user.name || "Unknown User";
							const gradient = getUserGradient(userName);
							const initials = userName
								.split(" ")
								.map((n) => n[0])
								.join("")
								.toUpperCase()
								.slice(0, 2);

							return (
								<button
									key={user.id}
									onClick={() => {
										console.log("User selected:", user.name);
										onUserSelect(isCurrent ? undefined : user.id);
										setIsExpanded(false);
									}}
									className={`flex w-full items-center gap-3 px-4 py-3 transition-all duration-200 ${
										isSelected ? "bg-amber-500/20" : "hover:bg-zinc-800"
									}`}
								>
									{/* Avatar */}
									<div
										className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-sm text-zinc-900 shadow-lg ${gradient} ${
											isSelected ? "ring-2 ring-amber-500" : ""
										}`}
									>
										{initials}
									</div>

									{/* User Info */}
									<div className="min-w-0 flex-1 text-left">
										<p
											className={`truncate font-medium text-sm ${
												isSelected ? "text-amber-500" : "text-zinc-100"
											}`}
										>
											{userName}
											{isCurrent && (
												<span className="ml-2 font-normal text-xs text-zinc-500">
													(Anda)
												</span>
											)}
										</p>
										<p className="truncate text-xs text-zinc-500">
											{user.email_address}
										</p>
									</div>

									{/* Checkmark */}
									{isSelected && (
										<div className="flex-shrink-0">
											<div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
												<Check className="h-3 w-3 text-zinc-900" />
											</div>
										</div>
									)}
								</button>
							);
						})}
					</div>

					{/* Footer hint */}
					<div className="border-zinc-800 border-t bg-zinc-900/50 px-4 py-2">
						<p className="text-center text-xs text-zinc-600">
							{selectedUserId && selectedUserId !== currentUserId
								? "Klik pada user untuk kembali ke laporan Anda"
								: "Pilih user untuk melihat laporannya"}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
