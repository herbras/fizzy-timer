/**
 * Bottom Navigation Bar
 * Accessible bottom navigation for mobile-first design
 * WCAG AA Compliant with proper touch targets (44x44 min)
 */

import { useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart3, History, Home, Settings, Sparkles } from "lucide-react";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { useSettings } from "@/lib/hooks/useSettings";
import { useTimer } from "@/lib/hooks/useTimer";
import { cn } from "@/lib/utils";

interface NavItem {
	id: string;
	label: string;
	icon: typeof Home;
	to: string;
}

const NAV_ITEMS: NavItem[] = [
	{ id: "home", label: "Beranda", icon: Home, to: "/home" },
	{ id: "history", label: "Riwayat", icon: History, to: "/history" },
	{ id: "report", label: "Laporan", icon: BarChart3, to: "/report" },
];

export function BottomNav({
	onSettingsClick,
	timerRunning,
}: {
	onSettingsClick: () => void;
	timerRunning: boolean;
}) {
	const navigate = useNavigate();
	const location = useLocation();
	const { accounts, activeAccount, switchAccount, addAccount, removeAccount } =
		useSettings();
	const timer = useTimer();

	const getIsActive = (to: string) => {
		return location.pathname === to;
	};

	const handleSwitch = async (accountId: string) => {
		// Auto-pause timer if running
		if (timer.state === "running") {
			timer.pause();
		}
		await switchAccount(accountId);
	};

	const hasMultipleAccounts = accounts.length > 1;

	return (
		<nav
			className="safe-area-bottom fixed right-0 bottom-0 left-0 z-40 border-zinc-800/50 border-t bg-zinc-900/95 backdrop-blur-xl"
			role="navigation"
			aria-label="Navigasi utama"
		>
			<div className="mx-auto flex max-w-md items-center justify-around px-1 py-1">
				{NAV_ITEMS.map((item) => {
					const isActive = getIsActive(item.to);
					const Icon = item.icon;

					return (
						<button
							key={item.id}
							onClick={() => navigate({ to: item.to })}
							className={cn(
								"flex min-h-[48px] min-w-[52px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all",
								"active:scale-95",
								isActive
									? "bg-amber-500/10 text-amber-500"
									: "text-zinc-500 hover:text-zinc-300",
							)}
							aria-label={item.label}
							aria-current={isActive ? "page" : undefined}
						>
							<Icon size={20} strokeWidth={2.5} aria-hidden="true" />
							<span className="font-bold text-[9px] uppercase tracking-wider">
								{item.label}
							</span>
						</button>
					);
				})}
				{/* Settings Button */}
				<button
					onClick={onSettingsClick}
					className={cn(
						"flex min-h-[48px] min-w-[52px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all",
						"text-zinc-500 hover:text-zinc-300 active:scale-95",
					)}
					aria-label="Pengaturan"
				>
					<Settings size={20} strokeWidth={2.5} aria-hidden="true" />
					<span className="font-bold text-[9px] uppercase tracking-wider">
						Pengaturan
					</span>
				</button>

				{/* Focus Mode Indicator - shown when timer running */}
				{timerRunning && (
					<div
						className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
						role="status"
						aria-live="polite"
					>
						<div className="flex items-center gap-1 rounded-full border-2 border-zinc-900 bg-amber-500 px-2 py-0.5 shadow-lg">
							<Sparkles size={10} className="text-black" aria-hidden="true" />
							<span className="font-black text-[8px] text-black uppercase tracking-wider">
								Fokus
							</span>
						</div>
					</div>
				)}
			</div>
		</nav>
	);
}
