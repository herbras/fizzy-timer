/**
 * Landing Page
 * About Fizzy Timer - Welcome screen with navigation to app
 * Dark Theme with Gold/Amber Accent
 * Style Fizzy - no generic icons, Sharpie marker highlights
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSettings } from "@/lib/hooks/useSettings";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import { GifMascot, GifMascotAvatar } from "@/components/Mascot";
import { BottomNav } from "@/components/layout/BottomNav";
import { SettingsSheet } from "@/components/SettingsSheet";

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
      <header className="sticky top-0 z-10 bg-[#050505]/80 backdrop-blur-md px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            {appSettings.showAnimal && (
              <GifMascotAvatar mood={appSettings.moodType} />
            )}
            <span className="text-xl font-bold text-zinc-100 tracking-tight">
              Fizzy Timer
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Hero Section with Mascot */}
        <section
          className="text-center space-y-6 pt-8"
          aria-labelledby="hero-title"
        >
          {appSettings.showAnimal && (
            <div className="flex justify-center">
              <GifMascot mood={appSettings.moodType} isVisible size="xl" />
            </div>
          )}

          <div className="space-y-3">
            <h1
              id="hero-title"
              className="text-4xl font-black text-zinc-100 tracking-tight"
            >
              Teman untuk{" "}
              <a
                href="https://www.fizzy.do/?source=sarbeh"
                className="text-zinc-300 hover:text-amber-500 transition-colors border-b border-transparent hover:border-amber-500"
              >
                Fizzy
              </a>{" "}
              kamu.
            </h1>
            <p className="text-zinc-300 text-base font-medium max-w-xs mx-auto">
              Catat waktu. Lihat produktivitas. Temukan blocker.
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleGetStarted}
            className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/20 text-black font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <span>{fizzyToken && accountSlug ? "Masuk" : "Mulai"}</span>
            <span aria-hidden="true">→</span>
          </button>
        </section>

        {/* 1. Masalah nyata */}
        <section
          className="glass-effect rounded-[2rem] p-6 border border-zinc-800/50 space-y-4"
          aria-labelledby="problem-title"
        >
          <div className="flex items-start gap-3">
            <CornerNumber number="1" />
            <div className="flex-1">
              <h2
                id="problem-title"
                className="text-lg font-black text-zinc-100"
              >
                Masalah nyata
              </h2>
            </div>
          </div>
          <div className="space-y-3 text-sm text-zinc-300 leading-relaxed pl-1">
            <p>
              Mau mulai kerja, tapi tunggu token API dari ketua tim dulu.
              <span className="text-zinc-400"> Mereka sibuk, kamu telat.</span>
            </p>
            <p>
              Lupa tadi mengerjakan apa. Tidak tahu seproduktif apa diri
              sendiri.
            </p>
            <p className="text-zinc-400">
              Tim stuck, tidak tahu blockernya apa.
            </p>
            <p className="font-medium text-zinc-200">
              Semuanya manual. Semuanya{" "}
              <span className="line-through text-zinc-500">merepotkan</span>.
            </p>
          </div>
        </section>

        {/* 2. Apa yang dilakukan */}
        <section
          className="glass-effect rounded-[2rem] p-6 border border-zinc-800/50 space-y-4"
          aria-labelledby="features-title"
        >
          <div className="flex items-start gap-3">
            <CornerNumber number="2" />
            <div className="flex-1">
              <h2
                id="features-title"
                className="text-lg font-black text-zinc-100"
              >
                Apa yang dilakukan?
              </h2>
            </div>
          </div>
          <div className="space-y-4 pl-1">
            {[
              {
                title: "Catat waktu otomatis",
                desc: "Setiap kali kamu fokus ke sebuah kartu, Fizzy Timer mencatatnya. Tidak perlu lagi catat manual.",
              },
              {
                title: "Lihat produktivitasmu",
                desc: "Berapa jam yang kamu habiskan minggu ini? Di kartu apa saja? Sekarang kamu tahu.",
              },
              {
                title: "Temukan blocker tim",
                desc: "Kartu yang terlalu lama di kolom yang sama? Itu indikasi ada yang harus dibantu.",
              },
              {
                title: "Ekspor untuk laporan",
                desc: "Excel, CSV, semuanya siap untuk tagihan klien atau laporan weekly ke manajemen.",
              },
            ].map((feature, i) => (
              <div key={i} className="border-l-2 border-zinc-700/50 pl-3">
                <h3 className="font-bold text-zinc-100 mb-1 text-base">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Cara kerja */}
        <section
          className="glass-effect rounded-[2rem] overflow-hidden border border-zinc-800/50"
          aria-labelledby="video-title"
        >
          <div className="p-6 pb-4">
            <div className="flex items-start gap-3">
              <CornerNumber number="3" />
              <div className="flex-1">
                <h2
                  id="video-title"
                  className="text-lg font-black text-zinc-100"
                >
                  Cara kerja
                </h2>
              </div>
            </div>
          </div>
          <div className="aspect-video w-full">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Fizzy Timer - Cara Kerja"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-zinc-400">
              Video 90 detik: Cara menggunakan Fizzy Timer
            </p>
          </div>
        </section>

        {/* 4. Bukan pengganti. Teman. */}
        <section
          className="glass-effect rounded-[2rem] p-6 border border-zinc-800/50 space-y-4"
          aria-labelledby="about-title"
        >
          <div className="flex items-start gap-3">
            <CornerNumber number="4" />
            <div className="flex-1">
              <h2 id="about-title" className="text-lg font-black text-zinc-100">
                Bukan pengganti. Teman.
              </h2>
            </div>
          </div>
          <div className="space-y-3 text-sm text-zinc-300 leading-relaxed pl-1">
            <p>
              <a
                href="https://www.fizzy.do/?source=sarbeh"
                className="text-zinc-200 hover:text-amber-500 transition-colors border-b border-transparent hover:border-amber-500"
              >
                Fizzy
              </a>{" "}
              adalah kanban board untuk tim kamu.
              <span className="text-zinc-400">
                {" "}
                Fizzy Timer adalah teman yang membantu kamu memanfaatkannya.
              </span>
            </p>
            <p>
              Hubungkan akun FIZZY kamu (buat token di Settings → Tokens), pilih
              kartu, dan mulai fokus. Maskot kecil akan menemani, menghitung
              waktu, dan menyimpan semuanya.
            </p>
            <p className="text-zinc-400">
              Gratis. Track sebanyak yang kamu mau. Data disimpan di device
              kamu.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-800/50">
            <p className="text-sm text-zinc-400 text-center">
              Dibuat untuk PM yang ingin produktif & tim yang ingin unggul
            </p>
          </div>
        </section>

        {/* Join Introduction CTA */}
        <section className="text-center space-y-4">
          <p className="text-sm text-zinc-400">Belum punya akun Fizzy?</p>
          <a
            href="https://www.fizzy.do/?source=sarbeh-cta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-all border border-zinc-700 hover:border-zinc-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <span>
              Coba{" "}
              <span className="text-amber-500">Fizzy</span>, gratis kok
            </span>
            <span aria-hidden="true">→</span>
          </a>
        </section>

        {/* Settings Quick Access */}
        <section className="text-center">
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm font-bold text-zinc-400 hover:text-amber-500 transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-lg px-2 py-1"
          >
            Ganti maskot →
          </button>
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
