/**
 * Landing Page
 * About Fizzy Timer - Welcome screen with navigation to app
 * Dark Theme with Gold/Amber Accent
 * Style Fizzy - no generic icons, Sharpie marker highlights
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { GifMascot, GifMascotAvatar } from "@/components/Mascot";
import { SettingsSheet } from "@/components/SettingsSheet";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import { useSettings } from "@/lib/hooks/useSettings";

export const Route = createFileRoute("/")({
	component: LandingComponent,
});

// Number badge with Sharpie style - corner positioned
function CornerNumber({ number }: { number: string }) {
	return (
		<span
			style={{
				background: "var(--color-yellow)",
				color: "var(--color-black)",
				fontFamily: "'Sharpie', Sans-Serif",
				fontSize: "1.25rem",
				fontVariantLigatures: "none",
				fontWeight: 400,
				letterSpacing: "0.04em",
				lineHeight: 1,
				padding: "0.2em 0.5em",
				transform: "rotate(-2deg)",
				display: "inline-block",
			}}
		>
			{number}
		</span>
	);
}

function LandingComponent() {
	const navigate = useNavigate();
	const { fizzyToken, accountSlug } = useSettings();
	const { settings: appSettings, updateSettings } = useAppSettings();
	const [showSettings, setShowSettings] = useState(false);

	const handleGetStarted = () => {
		if (fizzyToken && accountSlug) {
			navigate({ to: "/home" });
		} else {
			navigate({ to: "/setup" });
		}
	};

	return (
		<div className="min-h-screen bg-[#050505] pb-24">
			{/* Header */}
			<header className="sticky top-0 z-10 border-zinc-800/50 border-b bg-[#050505]/80 px-4 py-3 backdrop-blur-md">
				<div className="mx-auto flex max-w-md items-center justify-between">
					<div className="flex items-center gap-3">
						{appSettings.showAnimal && (
							<GifMascotAvatar mood={appSettings.moodType} />
						)}
						<span className="font-bold text-xl text-zinc-100 tracking-tight">
							Fizzy Timer
						</span>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-md animate-fade-in space-y-8 px-4 py-8">
				{/* Hero Section with Mascot */}
				<section
					className="space-y-6 pt-8 text-center"
					aria-labelledby="hero-title"
				>
					<div className="space-y-3">
						<h1
							id="hero-title"
							className="font-black text-4xl text-zinc-100 tracking-tight"
						>
							Teman untuk{" "}
							<a
								href="https://www.fizzy.do/?source=sarbeh"
								className="border-transparent border-b text-zinc-300 transition-colors hover:border-amber-500 hover:text-amber-500"
							>
								Fizzy
							</a>{" "}
							kamu.
						</h1>
						<p className="mx-auto max-w-xs font-medium text-base text-zinc-300">
							Catat waktu. Lihat produktivitas. Temukan blocker.
						</p>
					</div>

					{appSettings.showAnimal && (
						<div className="flex justify-center">
							<GifMascot mood={appSettings.moodType} isVisible size="xl" />
						</div>
					)}

					{/* CTA Button */}
					<button
						onClick={handleGetStarted}
						className="mx-auto rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 font-bold text-black text-lg shadow-amber-500/20 shadow-lg transition-all hover:scale-105 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-95"
					>
						{fizzyToken && accountSlug ? "Masuk" : "Mulai"}
					</button>
				</section>

				{/* 1. Masalah nyata */}
				<section
					className="glass-effect space-y-4 rounded-[2rem] border border-zinc-800/50 p-6"
					aria-labelledby="problem-title"
				>
					<div className="flex items-start gap-3">
						<CornerNumber number="1" />
						<div className="flex-1">
							<h2
								id="problem-title"
								className="font-black text-lg text-zinc-100"
							>
								Masalah
							</h2>
						</div>
					</div>
					<div className="space-y-3 pl-1 text-sm text-zinc-300 leading-relaxed">
						<p>
							Mau mulai kerja, tunggu token dari ketua tim. Dia sibuk, kamu
							telat.
						</p>
						<p>
							Lupa mengerjakan apa. Tidak tahu seproduktif apa diri sendiri.
						</p>
						<p className="text-zinc-300">
							Tim stuck, tidak tahu blockernya di mana.
						</p>
						<p className="font-medium text-zinc-200">
							Manual. Semuanya{" "}
							<span className="text-zinc-500 line-through">ribet</span>.
						</p>
					</div>
				</section>

				{/* 2. Apa yang dilakukan */}
				<section
					className="glass-effect space-y-4 rounded-[2rem] border border-zinc-800/50 p-6"
					aria-labelledby="features-title"
				>
					<div className="flex items-start gap-3">
						<CornerNumber number="2" />
						<div className="flex-1">
							<h2
								id="features-title"
								className="font-black text-lg text-zinc-100"
							>
								Solusi
							</h2>
						</div>
					</div>
					<div className="space-y-4 pl-1">
						{[
							{
								title: "Catat waktu otomatis",
								desc: "Kamu fokus ke kartu, Fizzy Timer mencatat. Selesai.",
							},
							{
								title: "Lihat produktivitas",
								desc: "Berapa jam minggu ini? Di kartu apa? Sekarang kamu tahu.",
							},
							{
								title: "Temukan blocker",
								desc: "Kartu terlalu lama di kolom yang sama? Ada yang harus dibantu.",
							},
							{
								title: "Ekspor laporan",
								desc: "Excel, CSV. Siap untuk billing client atau weekly report.",
							},
						].map((feature, i) => (
							<div key={i} className="border-zinc-700/50 border-l-2 pl-3">
								<h3 className="mb-1 font-bold text-base text-zinc-100">
									{feature.title}
								</h3>
								<p className="text-sm text-zinc-300 leading-relaxed">
									{feature.desc}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* 3. Cara kerja */}
				<section
					className="glass-effect overflow-hidden rounded-[2rem] border border-zinc-800/50"
					aria-labelledby="video-title"
				>
					<div className="p-6 pb-4">
						<div className="flex items-start gap-3">
							<CornerNumber number="3" />
							<div className="flex-1">
								<h2
									id="video-title"
									className="font-black text-lg text-zinc-100"
								>
									Demo
								</h2>
							</div>
						</div>
					</div>
					<div className="aspect-video w-full">
						<iframe
							src="https://www.youtube.com/embed/dQw4w9WgXcQ"
							title="Fizzy Timer - Demo"
							className="h-full w-full"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
						/>
					</div>
					<div className="p-4 text-center">
						<p className="text-sm text-zinc-300">90 detik.</p>
					</div>
				</section>

				{/* 4. Bukan pengganti. Teman. */}
				<section
					className="glass-effect space-y-4 rounded-[2rem] border border-zinc-800/50 p-6"
					aria-labelledby="about-title"
				>
					<div className="flex items-start gap-3">
						<CornerNumber number="4" />
						<div className="flex-1">
							<h2 id="about-title" className="font-black text-lg text-zinc-100">
								Teman, bukan pengganti
							</h2>
						</div>
					</div>
					<div className="space-y-3 pl-1 text-sm text-zinc-300 leading-relaxed">
						<p>
							<a
								href="https://www.fizzy.do/?source=sarbeh"
								className="border-transparent border-b text-zinc-200 transition-colors hover:border-amber-500 hover:text-amber-500"
							>
								Fizzy
							</a>{" "}
							adalah kanban board tim kamu.
							<span className="text-amber-400/90">
								{" "}
								Fizzy Timer membantu kamu memanfaatkannya.
							</span>
						</p>
						<p>
							Hubungkan akun FIZZY (buat token di Profile Settings, scroll ke
							bawah, buat PAT), pilih kartu, mulai fokus. Maskot kecil menemani,
							menghitung waktu, menyimpan semuanya.
						</p>
						<p className="text-zinc-300">
							Gratis. Track sebanyak yang kamu mau. Data di device kamu.
						</p>
					</div>

					<div className="border-zinc-800/50 border-t pt-4">
						<p className="text-center text-sm text-zinc-300">
							Buat PM yang produktif dan tim yang unggul
						</p>
					</div>
				</section>

				{/* Join Introduction CTA */}
				<section className="space-y-4 text-center">
					<p className="text-sm text-zinc-300">Belum punya akun Fizzy?</p>
					<a
						href="https://www.fizzy.do/?source=sarbeh-cta"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-block rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 font-medium text-zinc-200 transition-all hover:border-zinc-600 hover:bg-zinc-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
					>
						Coba <span className="text-amber-500">Fizzy</span>, gratis.
					</a>
				</section>
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
