/**
 * Setup Route
 * User enters their Fizzy API token to connect
 * Dark Theme with Gold/Amber Accent
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsSheet } from "@/components/SettingsSheet";
import { MOOD_GIFS, type MoodType } from "@/lib/db/schema";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import { useSettings } from "@/lib/hooks/useSettings";
import { createFizzyClient, testToken } from "@/lib/services/fizzy";
import { accountOps } from "@/lib/services/settings";

// Get a random GIF from all moods
function getRandomMoodGif(): { mood: MoodType; url: string } {
	const moods: MoodType[] = ["fire", "chill", "focus", "chaos", "determined"];
	const randomMood = moods[Math.floor(Math.random() * moods.length)];
	const gifs = MOOD_GIFS[randomMood];
	const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
	return { mood: randomMood, url: randomGif };
}

export const Route = createFileRoute("/setup")({
	component: SetupComponent,
});

function SetupComponent() {
	const navigate = useNavigate();
	const { activeAccount, loading, refresh } = useSettings();
	const { settings: appSettings, updateSettings } = useAppSettings();

	const [tokenInput, setTokenInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [step, setStep] = useState<"token" | "select-account" | "settings">(
		"token",
	);
	const [accounts, setAccounts] = useState<any[]>([]);
	const [showSettings, setShowSettings] = useState(false);
	const [randomGif, setRandomGif] = useState(getRandomMoodGif());
	const [currentToken, setCurrentToken] = useState("");

	// Refresh GIF every time step changes
	useEffect(() => {
		setRandomGif(getRandomMoodGif());
	}, [step]);

	// If already fully setup, redirect to home (only after loading is complete)
	useEffect(() => {
		if (!loading && activeAccount) {
			navigate({ to: "/home" });
		}
	}, [activeAccount, loading, navigate]);

	// Show loading state while checking account
	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#050505]">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
					<p className="text-sm text-zinc-400">Memuat pengaturan...</p>
				</div>
			</div>
		);
	}

	const fetchAccounts = async (token: string) => {
		try {
			const client = createFizzyClient(token);
			const result = await client.getIdentity();
			console.log("[Setup] Accounts:", result.accounts);
			if (result.accounts && result.accounts.length > 0) {
				setAccounts(result.accounts);
				setStep("select-account");
			}
		} catch (e) {
			console.error("[Setup] Error fetching accounts:", e);
		}
	};

	const handleConnect = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = tokenInput.trim();

		if (!token) {
			toast.error("Masukkan token API Anda");
			return;
		}

		setIsLoading(true);
		try {
			const isValid = await testToken(token);
			if (!isValid) {
				toast.error("Token API tidak valid. Periksa dan coba lagi.");
				setIsLoading(false);
				return;
			}

			setCurrentToken(token);
			await fetchAccounts(token);
		} catch (error) {
			console.error("[Setup] Error:", error);
			toast.error(
				error instanceof Error ? error.message : "Koneksi gagal. Coba lagi.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectAccount = async (account: any) => {
		const slug = account.slug.replace(/^\//, "");
		console.log("[Setup] Setting account slug:", slug);

		// Store the account in the accounts table
		await accountOps.add({
			token: currentToken,
			slug,
			userId: account.user.id,
			name: account.name || slug,
			isActive: true,
		});

		toast.success("Berhasil terhubung!");
		await refresh();
		setStep("settings");
	};

	const handleFinishSetup = () => {
		navigate({ to: "/home" });
	};

	return (
		<div className="min-h-screen bg-[#050505]">
			{/* Header */}
			<header className="sticky top-0 z-10 border-zinc-800/50 border-b bg-[#050505]/80 px-4 py-3 backdrop-blur-md">
				<div className="mx-auto flex max-w-md items-center justify-between">
					<button
						onClick={() => navigate({ to: "/" })}
						className="flex items-center gap-2 rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
					>
						<ArrowLeft className="h-5 w-5" aria-hidden="true" />
						<span className="font-medium text-sm">Tentang Fizzy Timer</span>
					</button>
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-md animate-fade-in px-4 py-6">
				<div className="glass-effect rounded-[2rem] border border-zinc-800/50 p-8 shadow-sm">
					{/* Random Mascot GIF */}
					{appSettings.showAnimal && (
						<div className="mb-6 flex justify-center">
							<img
								alt={`Maskot ${randomGif.mood}`}
								className="rounded-xl border border-zinc-700/50 shadow-lg"
								draggable={false}
								src={randomGif.url}
							/>
						</div>
					)}

					{step === "token" ? (
						<>
							<h2 className="mb-2 text-center font-black text-2xl text-zinc-100">
								Hubungkan ke Fizzy
							</h2>
							<p className="mb-6 text-center text-sm text-zinc-500">
								Masukkan token API Fizzy untuk mulai mencatat waktu
							</p>

							<form onSubmit={handleConnect}>
								{/* Token Input */}
								<div className="mb-6">
									<label htmlFor="token-input" className="sr-only">
										Token API Fizzy
									</label>
									<input
										id="token-input"
										type="password"
										value={tokenInput}
										onChange={(e) => setTokenInput(e.target.value)}
										placeholder="Masukkan token API Fizzy Anda"
										className="w-full rounded-2xl border-2 border-zinc-700 bg-zinc-900 px-5 py-4 text-center font-medium text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
										disabled={isLoading}
										autoFocus
									/>
								</div>

								{/* Help Text */}
								<p className="mb-6 text-center text-xs text-zinc-600">
									buat token dari{" "}
									<a
										href="https://app.fizzy.do/settings/tokens"
										target="_blank"
										rel="noopener noreferrer"
										className="rounded-lg px-1 py-0.5 font-semibold text-amber-500 hover:text-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
									>
										Fizzy My Profile Settings,
									</a>
									scroll ke bawah, buat PAT
								</p>

								{/* Connect Button */}
								<button
									type="submit"
									disabled={isLoading}
									className="btn-primary w-full rounded-2xl py-4 font-bold text-black shadow-lg transition focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isLoading ? "Menghubungkan..." : "Hubungkan"}
								</button>
							</form>
						</>
					) : step === "select-account" ? (
						<>
							<h2 className="mb-2 text-center font-black text-2xl text-zinc-100">
								Pilih Akun
							</h2>
							<p className="mb-6 text-center text-sm text-zinc-500">
								Pilih akun Fizzy Anda untuk melanjutkan
							</p>

							<div
								className="space-y-3"
								role="listbox"
								aria-label="Daftar akun Fizzy"
							>
								{accounts.map((account) => (
									<button
										key={account.slug}
										onClick={() => handleSelectAccount(account)}
										className="group flex w-full items-center justify-between rounded-2xl border-2 border-zinc-700 bg-zinc-900 px-5 py-4 text-left transition-all hover:border-amber-500 hover:shadow-md focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
										role="option"
									>
										<div>
											<div className="font-bold text-zinc-100">
												{account.name || "Akun"}
											</div>
											<div className="text-xs text-zinc-500">
												{account.slug}
											</div>
										</div>
										<ChevronRight
											className="h-5 w-5 text-zinc-600 transition group-hover:text-amber-500"
											aria-hidden="true"
										/>
									</button>
								))}
							</div>
						</>
					) : (
						<>
							<h2 className="mb-2 text-center font-black text-2xl text-zinc-100">
								Semua siap!
							</h2>
							<p className="mb-6 text-center text-sm text-zinc-500">
								Atur pengalaman Anda atau mulai mencatat waktu
							</p>

							{/* Quick Settings Preview with random GIF */}
							<div className="mb-6 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-700/50 shadow-lg">
											<img
												alt={`Maskot ${randomGif.mood}`}
												className="h-full w-full object-cover"
												draggable={false}
												src={randomGif.url}
											/>
										</div>
										<div>
											<p className="font-bold text-sm text-zinc-100">
												Suasana Anda
											</p>
											<p className="text-xs text-zinc-500 capitalize">
												{appSettings.moodType}
											</p>
										</div>
									</div>
									<button
										onClick={() => setShowSettings(true)}
										className="rounded-lg px-2 py-1 font-bold text-amber-500 text-sm hover:text-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
									>
										Ubah
									</button>
								</div>
							</div>

							{/* Start Button */}
							<button
								onClick={handleFinishSetup}
								className="btn-primary w-full rounded-2xl py-4 font-bold text-black shadow-lg transition focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
							>
								Mulai Mencatat
							</button>

							<button
								onClick={() => setShowSettings(true)}
								className="w-full rounded-xl py-3 font-medium text-sm text-zinc-500 transition hover:text-zinc-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
							>
								Buka Pengaturan
							</button>
						</>
					)}
				</div>

				{/* Info Card */}
				<div
					className="mt-6 space-y-3 rounded-2xl border border-zinc-700/50 bg-zinc-800/30 p-5"
					aria-labelledby="info-title"
				>
					<h3 id="info-title" className="font-bold text-sm text-zinc-300">
						Apa ini?
					</h3>
					<div className="space-y-2 text-xs text-zinc-500 leading-relaxed">
						<p>
							<a
								href="https://www.fizzy.do/?source=sarbeh-setup"
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium text-amber-500 hover:text-amber-400"
							>
								Fizzy
							</a>{" "}
							adalah kanban board untuk tim kamu.
						</p>
						<p>
							<span className="text-amber-400/90">Fizzy Timer</span> membantu
							kamu mencatat waktu fokus per kartu — otomatis.
						</p>
						<p className="text-zinc-600">
							Pilih kartu, mulai timer, selesai. Semua tersimpan di device kamu.
						</p>
					</div>
				</div>
			</main>

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
