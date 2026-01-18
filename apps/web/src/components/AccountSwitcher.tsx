/**
 * Account Switcher Component
 * Dropdown for switching between multiple Fizzy accounts
 */

import { Check, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { StoredAccount } from "@/lib/db/schema";
import { useTimer } from "@/lib/hooks/useTimer";

interface AccountSwitcherProps {
	accounts: StoredAccount[];
	activeAccount: StoredAccount | null;
	onSwitch: (accountId: string) => Promise<void>;
	onAdd: (token: string) => Promise<void>;
	onRemove: (accountId: string) => Promise<void>;
	timerRunning?: boolean;
}

export function AccountSwitcher({
	accounts,
	activeAccount,
	onSwitch,
	onAdd,
	onRemove,
	timerRunning = false,
}: AccountSwitcherProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);
	const [newToken, setNewToken] = useState("");
	const [isAdding, setIsAdding] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
				setShowAddForm(false);
				setNewToken("");
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const handleSwitch = async (accountId: string) => {
		if (accountId === activeAccount?.id) return;

		// Auto-pause timer if running
		if (timerRunning) {
			toast.info("Switching accounts will pause the timer");
		}

		await onSwitch(accountId);
		setIsOpen(false);
	};

	const handleAddAccount = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = newToken.trim();

		if (!token) {
			toast.error("Please enter your API token");
			return;
		}

		setIsAdding(true);
		try {
			await onAdd(token);
			setNewToken("");
			setShowAddForm(false);
		} finally {
			setIsAdding(false);
		}
	};

	const handleRemove = async (accountId: string, e: React.MouseEvent) => {
		e.stopPropagation();

		if (accounts.length === 1) {
			toast.error("Cannot remove the last account");
			return;
		}

		if (timerRunning) {
			toast.error("Cannot switch accounts while timer is running");
			return;
		}

		if (
			confirm(
				"Remove this account? Their tracking data will be kept but hidden.",
			)
		) {
			await onRemove(accountId);
		}
	};

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Trigger Button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex min-w-[160px] max-w-[200px] items-center gap-2 rounded-xl border border-zinc-800/50 bg-zinc-900 px-3 py-2 transition-all hover:border-amber-500/50"
			>
				<div className="min-w-0 flex-1 text-left">
					<p className="truncate text-[10px] text-zinc-500 uppercase tracking-wider">
						{accounts.length > 1 ? `${accounts.length} Accounts` : "Account"}
					</p>
					<p className="truncate font-medium text-sm text-zinc-100">
						{activeAccount?.name || "Select Account"}
					</p>
				</div>
				<ChevronDown size={16} className="shrink-0 text-zinc-500" />
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="absolute bottom-full left-0 z-50 mb-2 w-72 overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900 shadow-2xl">
					{/* Header */}
					<div className="border-zinc-800/50 border-b px-4 py-3">
						<p className="font-bold text-xs text-zinc-600 uppercase tracking-widest">
							Switch Account
						</p>
					</div>

					{/* Account List */}
					<div className="max-h-64 overflow-y-auto">
						{accounts.map((account) => (
							<button
								key={account.id}
								onClick={() => handleSwitch(account.id)}
								disabled={timerRunning && account.id !== activeAccount?.id}
								className="group flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-800/50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<div className="flex min-w-0 items-center gap-3">
									{/* Avatar with first letter */}
									<div
										className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-lg ${
											account.isActive
												? "bg-amber-500 text-black"
												: "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700"
										}`}
									>
										{account.name.charAt(0).toUpperCase()}
									</div>
									<div className="min-w-0 text-left">
										<p
											className={`truncate font-medium text-sm ${
												account.isActive ? "text-zinc-100" : "text-zinc-400"
											}`}
										>
											{account.name}
										</p>
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									{account.isActive && (
										<Check size={16} className="text-amber-500" />
									)}
									{!account.isActive && accounts.length > 1 && (
										<button
											onClick={(e) => handleRemove(account.id, e)}
											className="p-1.5 text-zinc-600 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
										>
											<Trash2 size={14} />
										</button>
									)}
								</div>
							</button>
						))}
					</div>

					{/* Add Account Form */}
					{showAddForm ? (
						<div className="border-zinc-800/50 border-t bg-zinc-900/50 p-3">
							<form onSubmit={handleAddAccount}>
								<input
									type="password"
									value={newToken}
									onChange={(e) => setNewToken(e.target.value)}
									placeholder="Paste API token..."
									className="mb-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
									autoFocus
								/>
								<div className="flex gap-2">
									<button
										type="submit"
										disabled={isAdding || !newToken.trim()}
										className="flex-1 rounded-xl bg-amber-500 px-3 py-2 font-bold text-black text-sm transition hover:bg-amber-600 disabled:opacity-50"
									>
										{isAdding ? "Adding..." : "Add"}
									</button>
									<button
										type="button"
										onClick={() => {
											setShowAddForm(false);
											setNewToken("");
										}}
										className="rounded-xl bg-zinc-800 px-3 py-2 font-medium text-sm text-zinc-400 transition hover:bg-zinc-700"
									>
										<X size={16} />
									</button>
								</div>
							</form>
						</div>
					) : (
						<div className="border-zinc-800/50 border-t p-3">
							<button
								onClick={() => setShowAddForm(true)}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 font-medium text-sm text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
							>
								<Plus size={16} />
								Add Account
							</button>
						</div>
					)}

					{/* Timer warning */}
					{timerRunning && (
						<div className="border-amber-500/20 border-t bg-amber-500/10 px-4 py-2">
							<p className="text-center text-amber-500 text-xs">
								Pause timer to switch accounts
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
