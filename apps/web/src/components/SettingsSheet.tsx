/**
 * Settings Sheet Component
 * Bottom sheet style settings modal
 * Dark Theme with Gold/Amber Accent
 */

import { Icon } from "@iconify/react";
import { useNavigate } from "@tanstack/react-router";
import {
	Check,
	ChevronRight,
	HelpCircle,
	Info,
	Plus,
	Sparkles,
	Trash2,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppSettings, MoodType, StoredAccount } from "@/lib/db/schema";
import { MOOD_COLORS, MOOD_INFO } from "@/lib/db/schema";
import { useSettings } from "@/lib/hooks/useSettings";
import { useTimer } from "@/lib/hooks/useTimer";
import { cn } from "@/lib/utils";

interface SettingsSheetProps {
	isOpen: boolean;
	onClose: () => void;
	settings: AppSettings;
	onSettingsChange: (newSettings: AppSettings) => void;
}

const MOODS: {
	id: MoodType;
	name: string;
	color: string;
	description: string;
	icon: string;
}[] = [
	{
		id: "fire",
		name: "Fire",
		color: "bg-orange-500",
		description: "Semua baik!",
		icon: "ph:fire-fill",
	},
	{
		id: "chill",
		name: "Chill",
		color: "bg-blue-500",
		description: "Tetap rileks",
		icon: "ph:plant-fill",
	},
	{
		id: "focus",
		name: "Focus",
		color: "bg-purple-500",
		description: "Kerja dalam",
		icon: "ph:target-fill",
	},
	{
		id: "chaos",
		name: "Chaos",
		color: "bg-pink-500",
		description: "Berputar!",
		icon: "ph:wind-fill",
	},
	{
		id: "determined",
		name: "Determined",
		color: "bg-amber-500",
		description: "Ayo gas!",
		icon: "ph:lightning-fill",
	},
];

export function SettingsSheet({
	isOpen,
	onClose,
	settings,
	onSettingsChange,
}: SettingsSheetProps) {
	const navigate = useNavigate();
	const { accounts, activeAccount, switchAccount, addAccount, removeAccount } =
		useSettings();
	const timer = useTimer();
	const [showAddAccount, setShowAddAccount] = useState(false);
	const [newToken, setNewToken] = useState("");
	const [isAdding, setIsAdding] = useState(false);

	if (!isOpen) return null;

	const handleSwitch = async (accountId: string) => {
		if (accountId === activeAccount?.id) return;

		// Auto-pause timer if running
		if (timer.state === "running") {
			timer.pause();
			toast.info("Timer dijeda");
		}

		await switchAccount(accountId);
	};

	const handleAddAccount = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = newToken.trim();

		if (!token) {
			toast.error("Masukkan token API Anda");
			return;
		}

		setIsAdding(true);
		try {
			await addAccount(token);
			setNewToken("");
			setShowAddAccount(false);
		} finally {
			setIsAdding(false);
		}
	};

	const handleRemove = async (accountId: string) => {
		if (accounts.length === 1) {
			toast.error("Tidak dapat menghapus akun terakhir");
			return;
		}

		if (timer.state === "running") {
			toast.error("Tidak dapat menghapus akun saat timer berjalan");
			return;
		}

		if (
			confirm(
				"Hapus akun ini? Data pencatatan akan disimpan namun disembunyikan.",
			)
		) {
			await removeAccount(accountId);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex flex-col justify-end"
			role="dialog"
			aria-modal="true"
			aria-labelledby="settings-title"
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
				onClick={onClose}
			/>

			{/* Sheet Content */}
			<div className="relative mx-auto flex max-h-[90vh] w-full max-w-md animate-slide-up flex-col rounded-t-[2.5rem] border-zinc-800 border-t bg-zinc-900 shadow-2xl">
				{/* Drag Handle */}
				<button
					onClick={onClose}
					aria-label="Tutup pengaturan"
					className="mx-auto mt-4 mb-6 h-1.5 w-16 flex-shrink-0 cursor-grab rounded-full rounded-full bg-zinc-700 transition-colors hover:bg-zinc-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:cursor-grabbing"
				/>

				{/* Header */}
				<div className="mb-6 flex flex-shrink-0 items-center justify-between px-8">
					<h2
						id="settings-title"
						className="font-extrabold text-3xl text-zinc-100 tracking-tight"
					>
						Pengaturan
					</h2>
					<button
						onClick={onClose}
						aria-label="Tutup"
						className="rounded-full border border-zinc-700/50 bg-zinc-800 p-2 text-zinc-400 transition-all hover:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-90"
					>
						<X size={20} aria-hidden="true" />
					</button>
				</div>

				{/* Scrollable Content */}
				<div className="bottom-sheet-scroll flex-1 overflow-y-auto px-8 pb-8">
					{/* Mood Selection with Icons8 */}
					<section className="mb-8 space-y-4">
						<div className="grid grid-cols-5 gap-2">
							{MOODS.map((mood) => {
								const moodInfo = MOOD_INFO[mood.id];
								const isActive = settings.moodType === mood.id;

								return (
									<button
										key={mood.id}
										onClick={() =>
											onSettingsChange({ ...settings, moodType: mood.id })
										}
										aria-label={`Suasana ${mood.name}`}
										aria-pressed={isActive}
										className={cn(
											"flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all",
											isActive
												? "gold-glow-subtle border-amber-500 bg-zinc-800 shadow-md"
												: "border-zinc-700 bg-zinc-800/50 opacity-60 hover:opacity-100",
										)}
									>
										{/* Icon container with colored background */}
										<div
											className="flex h-10 w-10 items-center justify-center rounded-lg"
											style={{
												backgroundColor: isActive
													? moodInfo.color
													: moodInfo.color.replace("/20", "/10"),
											}}
										>
											<Icon
												icon={mood.icon}
												className={cn(
													"text-xl",
													isActive ? "text-white" : "text-zinc-500",
												)}
											/>
										</div>
										<span
											className={cn(
												"font-bold text-[9px] uppercase tracking-wider",
												isActive ? "text-amber-500" : "text-zinc-400",
											)}
										>
											{mood.name}
										</span>
									</button>
								);
							})}
						</div>
						<p className="px-4 text-center text-[10px] text-zinc-500">
							{MOOD_INFO[settings.moodType].description}
						</p>
					</section>

					{/* App Config Toggles */}
					<section className="mb-8 space-y-4">
						<p className="px-2 font-bold text-[11px] text-zinc-600 uppercase tracking-widest">
							Konfigurasi Aplikasi
						</p>

						<div className="space-y-6 rounded-[2rem] border border-zinc-700/50 bg-zinc-800/50 p-6">
							{/* Visual Timer Toggle */}
							<div className="flex items-center justify-between">
								<div className="flex flex-col">
									<span className="font-bold text-base text-zinc-100">
										Timer Visual
									</span>
									<span className="font-medium text-xs text-zinc-500">
										Tampilkan angka hitung mundur
									</span>
								</div>
								<ToggleButton
									enabled={settings.showNumbers}
									onToggle={() =>
										onSettingsChange({
											...settings,
											showNumbers: !settings.showNumbers,
										})
									}
								/>
							</div>

							<div className="h-px w-full bg-zinc-700/50" />

							{/* Sound Toggle */}
							<div className="flex items-center justify-between">
								<div className="flex flex-col">
									<span className="font-bold text-base text-zinc-100">
										Notifikasi
									</span>
									<span className="font-medium text-xs text-zinc-500">
										Suara saat timer selesai
									</span>
								</div>
								<ToggleButton
									enabled={settings.soundEnabled}
									onToggle={() =>
										onSettingsChange({
											...settings,
											soundEnabled: !settings.soundEnabled,
										})
									}
								/>
							</div>

							<div className="h-px w-full bg-zinc-700/50" />

							{/* Mascot Display Toggle */}
							<div className="flex items-center justify-between">
								<div className="flex flex-col">
									<span className="font-bold text-base text-zinc-100">
										Tampilan Maskot
									</span>
									<span className="font-medium text-xs text-zinc-500">
										Pertahankan teman Anda terlihat
									</span>
								</div>
								<ToggleButton
									enabled={settings.showAnimal}
									onToggle={() =>
										onSettingsChange({
											...settings,
											showAnimal: !settings.showAnimal,
										})
									}
								/>
							</div>
						</div>
					</section>

					{/* Accounts Section */}
					<section className="mb-8 space-y-3">
						<p className="flex items-center gap-2 px-2 font-bold text-[11px] text-zinc-600 uppercase tracking-widest">
							<Users size={12} className="text-amber-500" aria-hidden="true" />
							Akun ({accounts.length})
						</p>
						<div className="overflow-hidden rounded-[2rem] border border-zinc-700/50 bg-zinc-800/50">
							{accounts.map((account) => (
								<div
									key={account.id}
									className={cn(
										"flex items-center justify-between border-zinc-700/50 border-b p-4 transition-colors last:border-b-0",
										account.isActive
											? "bg-amber-500/5"
											: "hover:bg-zinc-700/30",
									)}
								>
									<div className="flex min-w-0 items-center gap-3">
										{/* Avatar */}
										<div
											className={cn(
												"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-lg",
												account.isActive
													? "bg-amber-500 text-black"
													: "bg-zinc-700 text-zinc-400",
											)}
										>
											{account.name.charAt(0).toUpperCase()}
										</div>
										<div className="min-w-0">
											<p
												className={cn(
													"truncate font-medium text-sm",
													account.isActive ? "text-amber-500" : "text-zinc-300",
												)}
											>
												{account.name}
											</p>
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										{account.isActive && (
											<span className="font-bold text-[10px] text-amber-500 uppercase tracking-wider">
												Aktif
											</span>
										)}
										{!account.isActive && (
											<button
												onClick={() => handleSwitch(account.id)}
												disabled={timer.state === "running"}
												className="rounded px-1 py-0.5 font-medium text-xs text-zinc-500 hover:text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
											>
												Ganti
											</button>
										)}
										{!account.isActive && accounts.length > 1 && (
											<button
												onClick={() => handleRemove(account.id)}
												disabled={timer.state === "running"}
												aria-label="Hapus akun"
												className="rounded p-1.5 text-zinc-600 hover:text-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
											>
												<Trash2 size={14} aria-hidden="true" />
											</button>
										)}
									</div>
								</div>
							))}

							{/* Add Account Form */}
							{showAddAccount ? (
								<form
									onSubmit={handleAddAccount}
									className="border-zinc-700/50 border-t p-4"
								>
									<input
										type="password"
										value={newToken}
										onChange={(e) => setNewToken(e.target.value)}
										placeholder="Tempel token API..."
										className="mb-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
										autoFocus
									/>
									<div className="flex gap-2">
										<button
											type="submit"
											disabled={isAdding || !newToken.trim()}
											className="flex-1 rounded-xl bg-amber-500 px-3 py-2 font-bold text-black text-sm transition hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50"
										>
											{isAdding ? "Menambahkan..." : "Tambah Akun"}
										</button>
										<button
											type="button"
											onClick={() => {
												setShowAddAccount(false);
												setNewToken("");
											}}
											className="rounded-xl bg-zinc-700 px-3 py-2 font-medium text-sm text-zinc-300 transition hover:bg-zinc-600 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
										>
											Batal
										</button>
									</div>
								</form>
							) : (
								<button
									onClick={() => setShowAddAccount(true)}
									className="mx-2 flex w-full items-center justify-center gap-2 rounded p-4 text-zinc-500 transition-colors hover:bg-zinc-700/30 hover:text-zinc-300 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
								>
									<Plus size={18} aria-hidden="true" />
									<span className="font-medium">Tambah Akun</span>
								</button>
							)}
						</div>
					</section>

					{/* General Section */}
					<section className="space-y-3 pb-8">
						<p className="px-2 font-bold text-[11px] text-zinc-600 uppercase tracking-widest">
							Umum
						</p>
						<div className="overflow-hidden rounded-[2rem] border border-zinc-700/50 bg-zinc-800/50">
							{/* Tentang Fizzy Timer */}
							<button
								onClick={() => {
									onClose();
									navigate({ to: "/" });
								}}
								className="flex w-full items-center justify-between p-4 transition-colors hover:bg-zinc-700/30 focus:ring-2 focus:ring-amber-500 focus:ring-inset"
							>
								<div className="flex items-center gap-4">
									<div className="text-amber-500" aria-hidden="true">
										<Info size={18} />
									</div>
									<span className="font-semibold text-zinc-300">
										Tentang Fizzy Timer
									</span>
								</div>
								<ChevronRight
									size={18}
									className="text-zinc-600"
									aria-hidden="true"
								/>
							</button>

							{/* Dukungan */}
							<a
								href="https://twitter.com/sarbeh_"
								target="_blank"
								rel="noopener noreferrer"
								className="flex w-full items-center justify-between border-zinc-700/50 border-t p-4 transition-colors hover:bg-zinc-700/30 focus:ring-2 focus:ring-amber-500 focus:ring-inset"
							>
								<div className="flex items-center gap-4">
									<div className="text-amber-500" aria-hidden="true">
										<HelpCircle size={18} />
									</div>
									<span className="font-semibold text-zinc-300">Dukungan</span>
								</div>
								<ChevronRight
									size={18}
									className="text-zinc-600"
									aria-hidden="true"
								/>
							</a>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}

interface ToggleButtonProps {
	enabled: boolean;
	onToggle: () => void;
}

function ToggleButton({ enabled, onToggle }: ToggleButtonProps) {
	return (
		<button
			onClick={onToggle}
			role="switch"
			aria-checked={enabled}
			className={cn(
				"relative h-8 w-14 flex-shrink-0 rounded-full transition-all focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900",
				enabled ? "bg-amber-500" : "bg-zinc-700",
			)}
		>
			<div
				className={cn(
					"absolute top-1 h-6 w-6 rounded-full bg-zinc-100 shadow-sm transition-all",
					enabled ? "left-7" : "left-1",
				)}
			/>
		</button>
	);
}
