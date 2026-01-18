/**
 * AppShell Component
 * Main layout with bottom navigation
 * Dark Theme with Gold/Amber Accent
 */

import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { BarChart3, History, Home, Settings, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
	label: string;
	to: string;
	icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
	{ label: "Home", to: "/", icon: Home },
	{ label: "History", to: "/history", icon: History },
	{ label: "Report", to: "/report", icon: BarChart3 },
	{ label: "Settings", to: "/setup", icon: Settings },
];

interface AppShellProps {
	children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	return (
		<div className="min-h-screen bg-[#050505] pb-16">
			{/* Header */}
			<header className="sticky top-0 z-10 border-zinc-800/50 border-b bg-[#050505]/90 px-4 py-3 backdrop-blur-sm">
				<div className="mx-auto flex max-w-lg items-center justify-between">
					<h1 className="font-bold text-gradient-gold text-xl">Fizzy Focus</h1>
					<Link
						to="/setup"
						className="text-sm text-zinc-500 transition hover:text-amber-500"
					>
						<Settings className="h-5 w-5" />
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-lg px-4 py-4">
				{children || <Outlet />}
			</main>

			{/* Bottom Navigation */}
			<nav className="fixed right-0 bottom-0 left-0 border-zinc-800/50 border-t bg-[#050505]/95 backdrop-blur-sm">
				<div className="mx-auto flex max-w-lg justify-around">
					{navItems.map((item) => (
						<NavLink key={item.to} item={item} />
					))}
				</div>
			</nav>
		</div>
	);
}

function NavLink({ item }: { item: NavItem }) {
	const location = useLocation();
	const isActive = location.pathname === item.to;

	return (
		<Link
			to={item.to}
			className={cn(
				"flex min-w-16 flex-col items-center justify-center px-3 py-2 transition-colors",
				isActive ? "text-amber-500" : "text-zinc-600 hover:text-zinc-400",
			)}
		>
			<item.icon className="h-5 w-5" />
			<span className="mt-1 text-xs">{item.label}</span>
		</Link>
	);
}
