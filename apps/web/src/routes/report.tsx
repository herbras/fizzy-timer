/**
 * Report Route
 * Shows weekly reports with charts and export options
 * Dark Theme with Gold/Amber Accent
 * Data from Fizzy API (DONE cards)
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import {
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Copy,
	Download,
	FileSpreadsheet,
	FileText,
	Image as ImageIcon,
	RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

import { BottomNav } from "@/components/layout/BottomNav";
import { SettingsSheet } from "@/components/SettingsSheet";
import { UserSelector } from "@/components/UserSelector";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import { useSettings } from "@/lib/hooks/useSettings";
import {
	export4WeeksToExcel,
	generateWeeklyPrompt,
	generateWhatsAppText,
	useWeeklyReport,
	type WeeklyReportData,
} from "@/lib/hooks/useWeeklyReport";
import { useAccountUsers } from "@/lib/queries/useAccountUsers";

export const Route = createFileRoute("/report")({
	component: ReportComponent,
});

// Custom tooltip for chart
const CustomTooltip = ({ active, payload }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 shadow-xl">
				<p className="font-medium text-sm text-zinc-300">
					{payload[0].payload.displayDate}
				</p>
				<p className="font-bold text-amber-500 text-lg">
					{payload[0].value} {payload[0].value === 1 ? "card" : "cards"}
				</p>
			</div>
		);
	}
	return null;
};

function ReportComponent() {
	const navigate = useNavigate();
	const { activeAccount, loading: accountLoading } = useSettings();
	const { settings: appSettings, updateSettings } = useAppSettings();

	// Settings sheet state
	const [showSettings, setShowSettings] = useState(false);

	// Fetch users from account
	const { data: users = [], isLoading: usersLoading } = useAccountUsers();

	// State for selected user filter
	const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
		undefined,
	);

	const reportRef = useRef<HTMLDivElement>(null);
	const [shareMode, setShareMode] = useState<"image" | "xml" | "text">("image");
	const [copied, setCopied] = useState(false);

	// Call ALL hooks first (before any conditional returns)
	const {
		reportData,
		allCards,
		loading,
		error,
		selectedWeek,
		isCurrentWeek,
		goToPreviousWeek,
		goToNextWeek,
		goToCurrentWeek,
		refetchCards,
	} = useWeeklyReport(selectedUserId);

	// Redirect to setup if no account (only after loading is complete)
	useEffect(() => {
		if (!accountLoading && !activeAccount) {
			navigate({ to: "/setup" });
		}
	}, [activeAccount, accountLoading, navigate]);

	// Show loading state while checking account
	if (accountLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#050505]">
				<RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
			</div>
		);
	}

	// Handle PNG export
	const handleExportPNG = async () => {
		if (!reportRef.current || reportData.totalCards === 0) {
			toast.error("Tidak ada data untuk diekspor");
			return;
		}

		try {
			const dataUrl = await toPng(reportRef.current, {
				backgroundColor: "#050505",
				quality: 1,
				pixelRatio: 2,
			});

			const link = document.createElement("a");
			link.download = `weekly-report-${reportData.startDate.toISOString().split("T")[0]}.png`;
			link.href = dataUrl;
			link.click();

			toast.success("Gambar berhasil diekspor");
		} catch (err) {
			console.error("Export failed:", err);
			toast.error("Gagal mengekspor gambar");
		}
	};

	// Handle copy XML
	const handleCopyXML = () => {
		const xml = generateWeeklyPrompt(reportData);
		navigator.clipboard.writeText(xml);
		setCopied(true);
		toast.success("XML disalin ke clipboard");
		setTimeout(() => setCopied(false), 2000);
	};

	// Handle copy WhatsApp text
	const handleCopyWhatsApp = () => {
		const text = generateWhatsAppText(reportData);
		navigator.clipboard.writeText(text);
		setCopied(true);
		toast.success("Teks disalin untuk WhatsApp");
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="min-h-screen bg-[#050505] pb-24">
			{/* Header */}
			<header className="sticky top-0 z-10 border-zinc-800/50 border-b bg-[#050505]/80 px-4 py-3 backdrop-blur-md">
				<div className="mx-auto flex max-w-md items-center justify-between">
					<h1 className="font-bold text-lg text-zinc-100">Laporan Mingguan</h1>
					<button
						onClick={() => refetchCards()}
						disabled={loading}
						aria-label="Muat ulang data"
						className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50"
					>
						<RefreshCw
							className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
							aria-hidden="true"
						/>
					</button>
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-md space-y-4 overflow-visible px-4 py-4">
				{/* User Selector */}
				{users.length > 1 && (
					<div className="relative z-10">
						<UserSelector
							users={users}
							currentUserId={activeAccount?.userId ?? null}
							selectedUserId={selectedUserId}
							onUserSelect={setSelectedUserId}
							loading={usersLoading}
						/>
					</div>
				)}

				{/* Week Navigator */}
				<div className="flex items-center justify-between rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4">
					<button
						onClick={goToPreviousWeek}
						aria-label="Minggu sebelumnya"
						className="rounded-xl rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
					>
						<ChevronLeft className="h-5 w-5" aria-hidden="true" />
					</button>

					<div className="text-center">
						<p className="font-medium text-sm text-zinc-500">Rentang Minggu</p>
						<p className="font-bold text-lg text-zinc-100">
							{reportData.dateRangeLabel}
						</p>
						<p className="text-xs text-zinc-600">
							Kamis ke Rabu (Thursday to Wednesday)
						</p>
					</div>

					<div className="flex items-center gap-1">
						<button
							onClick={goToNextWeek}
							disabled={isCurrentWeek}
							aria-label="Minggu selanjutnya"
							className="rounded-xl rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
						>
							<ChevronRight className="h-5 w-5" aria-hidden="true" />
						</button>
						{!isCurrentWeek && (
							<button
								onClick={goToCurrentWeek}
								className="rounded-xl bg-amber-500/20 px-3 py-1.5 font-medium text-amber-500 text-xs transition hover:bg-amber-500/30 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
							>
								Minggu Ini
							</button>
						)}
					</div>
				</div>

				{/* Error State */}
				{error && (
					<div
						className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
						role="alert"
						aria-live="polite"
					>
						<p className="font-medium text-red-400 text-sm">
							Gagal memuat kartu dari API Fizzy
						</p>
						<p className="mt-1 text-red-500/70 text-xs">
							Periksa token API di Pengaturan
						</p>
					</div>
				)}

				{/* Loading State */}
				{loading && (
					<div
						className="flex items-center justify-center py-12"
						role="status"
						aria-live="polite"
					>
						<span className="sr-only">Memuat...</span>
						<RefreshCw
							className="h-8 w-8 animate-spin text-amber-500"
							aria-hidden="true"
						/>
					</div>
				)}

				{/* Share Mode Tabs */}
				<div
					className="flex gap-2 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-1"
					role="tablist"
					aria-label="Pilih mode ekspor"
				>
					<button
						onClick={() => setShareMode("image")}
						disabled={loading}
						role="tab"
						aria-selected={shareMode === "image"}
						aria-label="Tampilan gambar"
						className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-medium text-sm transition ${
							shareMode === "image"
								? "bg-amber-500 text-zinc-900"
								: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
						} focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50`}
					>
						<ImageIcon className="h-4 w-4" aria-hidden="true" />
						<span>Gambar</span>
					</button>
					<button
						onClick={() => setShareMode("xml")}
						disabled={loading}
						role="tab"
						aria-selected={shareMode === "xml"}
						aria-label="Tampilan XML"
						className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-medium text-sm transition ${
							shareMode === "xml"
								? "bg-amber-500 text-zinc-900"
								: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
						} focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50`}
					>
						<FileText className="h-4 w-4" aria-hidden="true" />
						<span>XML</span>
					</button>
					<button
						onClick={() => setShareMode("text")}
						disabled={loading}
						role="tab"
						aria-selected={shareMode === "text"}
						aria-label="Teks WhatsApp"
						className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-medium text-sm transition ${
							shareMode === "text"
								? "bg-amber-500 text-zinc-900"
								: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
						} focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50`}
					>
						<Copy className="h-4 w-4" aria-hidden="true" />
						<span>WhatsApp</span>
					</button>
				</div>

				{/* Report Content - For Image Export */}
				{!loading && shareMode === "image" && (
					<div
						ref={reportRef}
						className="rounded-2xl border border-zinc-800/50 bg-zinc-900 p-6 shadow-xl"
					>
						{/* Report Header */}
						<div className="mb-6 text-center">
							<div className="mb-2 flex items-center justify-center gap-2">
								<CheckCircle2 className="h-6 w-6 text-amber-500" />
								<h2 className="font-bold text-2xl text-gradient-gold">
									Lapor Weekly
								</h2>
							</div>
							<p className="text-zinc-500">{reportData.dateRangeLabel}</p>
						</div>

						{/* Summary Stats */}
						<div className="mb-6 grid grid-cols-3 gap-4">
							<div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 text-center">
								<p className="font-bold text-3xl text-amber-500">
									{reportData.totalCards}
								</p>
								<p className="mt-1 text-xs text-zinc-500">Kartu Selesai</p>
							</div>
							<div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 text-center">
								<p className="font-bold text-3xl text-zinc-100">
									{reportData.totalBoards}
								</p>
								<p className="mt-1 text-xs text-zinc-500">Papan</p>
							</div>
							<div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 text-center">
								<p className="font-bold text-3xl text-zinc-100">
									{reportData.avgDailyCards}
								</p>
								<p className="mt-1 text-xs text-zinc-500">Rata-rata / Hari</p>
							</div>
						</div>

						{/* Daily Chart */}
						{reportData.dailyData.some((d) => d.cardCount > 0) && (
							<div className="mb-6">
								<h3 className="mb-3 font-bold text-sm text-zinc-500 uppercase tracking-wider">
									Rincian Harian
								</h3>
								<div className="h-48">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart
											data={reportData.dailyData}
											margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
										>
											<CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
											<XAxis
												dataKey="displayDate"
												tick={{ fill: "#71717a", fontSize: 11 }}
												stroke="#27272a"
											/>
											<YAxis
												tick={{ fill: "#71717a", fontSize: 11 }}
												stroke="#27272a"
											/>
											<Tooltip content={<CustomTooltip />} />
											<Bar dataKey="cardCount" radius={[6, 6, 0, 0]}>
												{reportData.dailyData.map((entry, index) => {
													const isMax =
														entry.cardCount ===
														Math.max(
															...reportData.dailyData.map((d) => d.cardCount),
														);
													return (
														<Cell
															key={`cell-${index}`}
															fill={
																isMax && entry.cardCount > 0
																	? "#f59e0b"
																	: "#3f3f46"
															}
														/>
													);
												})}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						)}

						{/* Boards Breakdown */}
						{reportData.boards.length > 0 && (
							<div className="mb-6">
								<h3 className="mb-3 font-bold text-sm text-zinc-500 uppercase tracking-wider">
									Papan
								</h3>
								<div className="space-y-2">
									{reportData.boards.map((boardName) => {
										const boardCards = reportData.cards.filter(
											(c) => c.boardName === boardName,
										);
										const percentage =
											reportData.totalCards > 0
												? (boardCards.length / reportData.totalCards) * 100
												: 0;

										return (
											<div
												key={boardName}
												className="flex items-center justify-between rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-3"
											>
												<div className="flex-1">
													<div className="mb-1 flex items-center justify-between">
														<p className="font-medium text-sm text-zinc-100">
															{boardName}
														</p>
														<p className="font-bold text-amber-500 text-sm">
															{boardCards.length} kartu
														</p>
													</div>
													<div className="h-1.5 w-full rounded-full bg-zinc-700">
														<div
															className="h-1.5 rounded-full bg-amber-500 transition-all"
															style={{ width: `${percentage}%` }}
														/>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Cards List */}
						{reportData.cards.length > 0 && (
							<div>
								<h3 className="mb-3 font-bold text-sm text-zinc-500 uppercase tracking-wider">
									Kartu Selesai ({reportData.cards.length})
								</h3>
								<div className="space-y-2">
									{reportData.cards.map((card) => (
										<div
											key={card.cardId}
											className="flex items-start gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-3"
										>
											<div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20 font-bold text-green-500 text-xs">
												<CheckCircle2 className="h-4 w-4" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium text-sm text-zinc-100">
													{card.cardTitle}
												</p>
												<p className="text-xs text-zinc-500">
													#{card.cardNumber} • {card.boardName} • {card.column}
												</p>
												{(card.assignees.length > 0 ||
													card.tags.length > 0) && (
													<div className="mt-1 flex items-center gap-2">
														{card.assignees.length > 0 && (
															<span className="text-xs text-zinc-600">
																👤 {card.assignees.join(", ")}
															</span>
														)}
														{card.tags.length > 0 && (
															<span className="text-xs text-zinc-600">
																🏷️ {card.tags.join(", ")}
															</span>
														)}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Footer */}
						<div className="mt-6 border-zinc-800 border-t pt-4 text-center">
							<p className="text-xs text-zinc-600">
								Dibuat oleh Fizzy Timer • Data dari API Fizzy
							</p>
						</div>
					</div>
				)}

				{/* XML Mode */}
				{!loading && shareMode === "xml" && (
					<div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4">
						<div className="mb-3 flex items-center justify-between">
							<h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider">
								Template Prompt XML
							</h3>
							<button
								onClick={handleCopyXML}
								className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 font-medium text-xs text-zinc-900 transition hover:bg-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
							>
								<Copy className="h-3.5 w-3.5" aria-hidden="true" />
								{copied ? "Disalin!" : "Salin XML"}
							</button>
						</div>
						<pre className="max-h-96 overflow-x-auto overflow-y-auto rounded-xl border border-zinc-800/50 bg-zinc-950 p-4 font-mono text-xs text-zinc-400">
							{generateWeeklyPrompt(reportData)}
						</pre>
					</div>
				)}

				{/* WhatsApp Text Mode */}
				{!loading && shareMode === "text" && (
					<div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4">
						<div className="mb-3 flex items-center justify-between">
							<h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider">
								Teks WhatsApp
							</h3>
							<button
								onClick={handleCopyWhatsApp}
								className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 font-medium text-xs text-zinc-900 transition hover:bg-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
							>
								<Copy className="h-3.5 w-3.5" aria-hidden="true" />
								{copied ? "Disalin!" : "Salin Teks"}
							</button>
						</div>
						<div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-800/50 bg-zinc-950 p-4 font-mono text-sm text-zinc-300">
							{generateWhatsAppText(reportData)}
						</div>
					</div>
				)}

				{/* Export Button for Image Mode */}
				{!loading && shareMode === "image" && reportData.totalCards > 0 && (
					<div className="space-y-2">
						<button
							onClick={handleExportPNG}
							className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-bold text-sm text-zinc-900 transition hover:from-amber-400 hover:to-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
						>
							<ImageIcon className="h-5 w-5" aria-hidden="true" />
							Ekspor sebagai PNG
						</button>
						<button
							onClick={() => export4WeeksToExcel(allCards)}
							className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 font-bold text-sm text-zinc-900 transition hover:from-emerald-400 hover:to-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
						>
							<FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
							Ekspor 4 Minggu ke Excel
						</button>
					</div>
				)}

				{/* Export Excel Button (always show if has any data) */}
				{!loading && allCards.length > 0 && reportData.totalCards === 0 && (
					<button
						onClick={() => export4WeeksToExcel(allCards)}
						className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 font-bold text-sm text-zinc-900 transition hover:from-emerald-400 hover:to-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
					>
						<FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
						Ekspor 4 Minggu ke Excel
					</button>
				)}

				{/* Empty State */}
				{!loading &&
					!error &&
					reportData.totalCards === 0 &&
					allCards.length === 0 && (
						<div className="py-16 text-center" role="status" aria-live="polite">
							<div className="mb-4 inline-flex rounded-3xl border border-zinc-800/50 bg-zinc-900 p-4 shadow-sm">
								<CheckCircle2
									className="h-12 w-12 text-zinc-700"
									aria-hidden="true"
								/>
							</div>
							<p className="mb-1 font-medium text-zinc-600">
								Tidak ada kartu selesai minggu ini
							</p>
							<p className="text-sm text-zinc-700">
								Kartu dengan status SELESAI akan muncul di sini
							</p>
						</div>
					)}
			</main>

			{/* Bottom Navigation */}
			{/* Bottom Navigation */}
			<BottomNav onSettingsClick={() => setShowSettings(true)} />

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
