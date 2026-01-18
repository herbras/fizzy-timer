/**
 * History Route
 * Shows all tracking sessions grouped by date
 * Dark Theme with Gold/Amber Accent
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { GifMascotAvatar } from "@/components/Mascot";
import { SettingsSheet } from "@/components/SettingsSheet";
import { SessionList } from "@/components/ui/session-item";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import { useSessionsByDate } from "@/lib/hooks/useSessions";
import { useSettings } from "@/lib/hooks/useSettings";
import {
	exportToCSV,
	exportToExcel,
	getSessionDateRange,
} from "@/lib/utils/export";
import { formatDuration } from "@/lib/utils/time";

export const Route = createFileRoute("/history")({
	component: HistoryComponent,
});

function HistoryComponent() {
	const navigate = useNavigate();
	const { fizzyToken, accountSlug, loading: settingsLoading } = useSettings();
	const { grouped, dates, loading, deleteSession, refresh } =
		useSessionsByDate();
	const { settings: appSettings, updateSettings } = useAppSettings();
	const [showExportMenu, setShowExportMenu] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

	// Redirect to setup if not authenticated (only after loading is done)
	useEffect(() => {
		if (!settingsLoading && (!fizzyToken || !accountSlug)) {
			navigate({ to: "/setup" });
		}
	}, [fizzyToken, accountSlug, settingsLoading, navigate]);

	// Auto-refresh when page becomes visible or focused
	useEffect(() => {
		refresh();

		const onFocus = () => refresh();
		window.addEventListener("focus", onFocus);
		window.addEventListener("visibilitychange", onFocus);

		return () => {
			window.removeEventListener("focus", onFocus);
			window.removeEventListener("visibilitychange", onFocus);
		};
	}, [refresh]);

	// Don't render anything while loading
	if (settingsLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#050505]">
				<div className="text-zinc-600">Memuat...</div>
			</div>
		);
	}

	const allSessions = Object.values(grouped).flat();
	const dateRange = getSessionDateRange(allSessions);

	// Calculate total time
	const totalSeconds = dates.reduce((acc, date) => {
		return acc + grouped[date].reduce((sum, s) => sum + s.duration, 0);
	}, 0);

	const totalSessions = dates.reduce(
		(acc, date) => acc + grouped[date].length,
		0,
	);

	const handleExportExcel = () => {
		exportToExcel(allSessions);
		setShowExportMenu(false);
	};

	const handleExportCSV = () => {
		exportToCSV(allSessions);
		setShowExportMenu(false);
	};

	const handleExportCurrentMonth = () => {
		const now = new Date();
		exportToExcel(allSessions, { month: now });
		setShowExportMenu(false);
	};

	return (
		<div className="min-h-screen bg-[#050505] pb-24">
			{/* Header */}
			<header className="sticky top-0 z-10 border-zinc-800/50 border-b bg-[#050505]/80 px-4 py-3 backdrop-blur-md">
				<div className="mx-auto flex max-w-md items-center justify-between">
					<div className="flex items-center gap-3">
						<GifMascotAvatar mood={appSettings.moodType} />
						<span className="font-bold text-xl text-zinc-100 tracking-tight">
							Riwayat
						</span>
					</div>
					<div className="relative">
						<button
							onClick={() => setShowExportMenu(!showExportMenu)}
							aria-label="Ekspor log kerja"
							aria-expanded={showExportMenu}
							className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-500 shadow-sm transition-all hover:bg-amber-500/20 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-90"
						>
							<Download size={18} aria-hidden="true" />
						</button>

						{/* Export Dropdown Menu */}
						{showExportMenu && (
							<>
								<div
									className="fixed inset-0 z-10"
									onClick={() => setShowExportMenu(false)}
								/>
								<div
									className="absolute top-12 right-0 z-20 w-56 overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900 shadow-2xl"
									role="menu"
									aria-label="Menu ekspor"
								>
									<div className="border-zinc-800/50 border-b px-4 py-3">
										<p className="font-bold text-xs text-zinc-600 uppercase tracking-widest">
											Ekspor Log Kerja
										</p>
										{dateRange && (
											<p className="mt-1 text-xs text-zinc-500">
												{allSessions.length} sesi
											</p>
										)}
									</div>
									<div className="py-2">
										<button
											onClick={handleExportCurrentMonth}
											role="menuitem"
											className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:ring-2 focus:ring-amber-500 focus:ring-inset"
										>
											<FileSpreadsheet
												size={18}
												className="text-amber-500"
												aria-hidden="true"
											/>
											<div>
												<p className="font-medium text-sm text-zinc-200">
													Bulan Ini (Excel)
												</p>
												<p className="text-xs text-zinc-500">
													Ekspor bulan berjalan
												</p>
											</div>
										</button>
										<button
											onClick={handleExportExcel}
											role="menuitem"
											className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:ring-2 focus:ring-amber-500 focus:ring-inset"
										>
											<FileSpreadsheet
												size={18}
												className="text-green-500"
												aria-hidden="true"
											/>
											<div>
												<p className="font-medium text-sm text-zinc-200">
													Semua Data (Excel)
												</p>
												<p className="text-xs text-zinc-500">
													Multi-sheet dengan summary
												</p>
											</div>
										</button>
										<button
											onClick={handleExportCSV}
											role="menuitem"
											className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:ring-2 focus:ring-amber-500 focus:ring-inset"
										>
											<FileJson
												size={18}
												className="text-blue-500"
												aria-hidden="true"
											/>
											<div>
												<p className="font-medium text-sm text-zinc-200">
													Format CSV
												</p>
												<p className="text-xs text-zinc-500">
													Untuk import ke aplikasi lain
												</p>
											</div>
										</button>
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-md animate-fade-in space-y-6 px-4 py-6">
				{/* Summary Card */}
				<div className="glass-effect rounded-[2rem] border border-zinc-800/50 p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="mb-1 font-bold text-xs text-zinc-600 uppercase tracking-widest">
								Total Terlacak
							</p>
							<p className="font-black text-3xl text-zinc-100">
								{formatDuration(totalSeconds)}
							</p>
						</div>
						<div className="text-right">
							<p className="mb-1 font-bold text-xs text-zinc-600 uppercase tracking-widest">
								Sesi
							</p>
							<p className="font-black text-3xl text-amber-500">
								{totalSessions}
							</p>
						</div>
					</div>
					{dateRange && (
						<div className="mt-4 border-zinc-800/50 border-t pt-4">
							<p className="text-xs text-zinc-600">
								<span className="font-semibold">Rentang Tanggal:</span>{" "}
								{dateRange.start.toLocaleDateString("id-ID", {
									day: "numeric",
									month: "short",
									year: "numeric",
								})}{" "}
								-{" "}
								{dateRange.end.toLocaleDateString("id-ID", {
									day: "numeric",
									month: "short",
									year: "numeric",
								})}
							</p>
						</div>
					)}
				</div>

				{/* Sessions List */}
				<SessionList
					sessions={Object.values(grouped).flat()}
					grouped={grouped}
					onDelete={deleteSession}
					loading={loading}
					emptyMessage="Belum ada sesi. Mulai mencatat untuk melihat riwayat di sini"
				/>
			</main>

			{/* Bottom Navigation */}
			<BottomNav
				onSettingsClick={() => setShowSettings(true)}
				timerRunning={false}
			/>

			{/* Settings Sheet */}
			<SettingsSheet
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				settings={appSettings}
				onSettingsChange={updateSettings}
			/>
		</div>
	);
}
