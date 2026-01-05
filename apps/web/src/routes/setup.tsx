/**
 * Setup Route
 * User enters their Fizzy API token to connect
 * Dark Theme with Gold/Amber Accent
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { SettingsSheet } from '@/components/SettingsSheet';
import { MOOD_GIFS, type MoodType } from '@/lib/db/schema';
import { testToken, createFizzyClient } from '@/lib/services/fizzy';
import { accountOps } from '@/lib/services/settings';
import { useSettings } from '@/lib/hooks/useSettings';
import { useAppSettings } from '@/lib/hooks/useAppSettings';
import { ChevronRight } from 'lucide-react';

// Get a random GIF from all moods
function getRandomMoodGif(): { mood: MoodType; url: string } {
  const moods: MoodType[] = ['fire', 'chill', 'focus', 'chaos', 'determined'];
  const randomMood = moods[Math.floor(Math.random() * moods.length)];
  const gifs = MOOD_GIFS[randomMood];
  const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
  return { mood: randomMood, url: randomGif };
}

export const Route = createFileRoute('/setup')({
  component: SetupComponent,
});

function SetupComponent() {
  const navigate = useNavigate();
  const { activeAccount, refresh } = useSettings();
  const { settings: appSettings, updateSettings } = useAppSettings();

  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'token' | 'select-account' | 'settings'>('token');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [randomGif, setRandomGif] = useState(getRandomMoodGif());
  const [currentToken, setCurrentToken] = useState('');

  // Refresh GIF every time step changes
  useEffect(() => {
    setRandomGif(getRandomMoodGif());
  }, [step]);

  // If already fully setup, redirect to home
  useEffect(() => {
    if (activeAccount) {
      navigate({ to: '/' });
    }
  }, [activeAccount, navigate]);

  const fetchAccounts = async (token: string) => {
    try {
      const client = createFizzyClient(token);
      const result = await client.getIdentity();
      console.log('[Setup] Accounts:', result.accounts);
      if (result.accounts && result.accounts.length > 0) {
        setAccounts(result.accounts);
        setStep('select-account');
      }
    } catch (e) {
      console.error('[Setup] Error fetching accounts:', e);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();

    if (!token) {
      toast.error('Masukkan token API Anda');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await testToken(token);
      if (!isValid) {
        toast.error('Token API tidak valid. Periksa dan coba lagi.');
        setIsLoading(false);
        return;
      }

      setCurrentToken(token);
      await fetchAccounts(token);
    } catch (error) {
      console.error('[Setup] Error:', error);
      toast.error(error instanceof Error ? error.message : 'Koneksi gagal. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = async (account: any) => {
    const slug = account.slug.replace(/^\//, '');
    console.log('[Setup] Setting account slug:', slug);

    // Store the account in the accounts table
    await accountOps.add({
      token: currentToken,
      slug,
      userId: account.user.id,
      name: account.name || slug,
      isActive: true,
    });

    toast.success('Berhasil terhubung!');
    await refresh();
    setStep('settings');
  };

  const handleFinishSetup = () => {
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#050505]/80 backdrop-blur-md px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-zinc-100 tracking-tight">
              Pengaturan
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 animate-fade-in">
        <div className="glass-effect rounded-[2rem] p-8 shadow-sm border border-zinc-800/50">
          {/* Random Mascot GIF */}
          {appSettings.showAnimal && (
            <div className="flex justify-center mb-6">
              <img
                alt={`Maskot ${randomGif.mood}`}
                className="rounded-xl shadow-lg border border-zinc-700/50"
                draggable={false}
                src={randomGif.url}
              />
            </div>
          )}

          {step === 'token' ? (
            <>
              <h2 className="text-2xl font-black text-zinc-100 text-center mb-2">
                Hubungkan ke Fizzy
              </h2>
              <p className="text-zinc-500 text-center mb-6 text-sm">
                Masukkan token API Fizzy untuk mulai mencatat waktu
              </p>

              <form onSubmit={handleConnect}>
                {/* Token Input */}
                <div className="mb-6">
                  <label htmlFor="token-input" className="sr-only">Token API Fizzy</label>
                  <input
                    id="token-input"
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Masukkan token API Fizzy Anda"
                    className="w-full px-5 py-4 bg-zinc-900 border-2 border-zinc-700 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-center font-medium text-zinc-100 placeholder:text-zinc-600"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                {/* Help Text */}
                <p className="text-xs text-zinc-600 mb-6 text-center">
                  Dapatkan token API dari{' '}
                  <a
                    href="https://app.fizzy.do/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-500 hover:text-amber-400 font-semibold focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-lg px-1 py-0.5"
                  >
                    Pengaturan Fizzy → Token
                  </a>
                </p>

                {/* Connect Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary text-black font-bold py-4 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  {isLoading ? 'Menghubungkan...' : 'Hubungkan'}
                </button>
              </form>
            </>
          ) : step === 'select-account' ? (
            <>
              <h2 className="text-2xl font-black text-zinc-100 text-center mb-2">
                Pilih Akun
              </h2>
              <p className="text-zinc-500 text-center mb-6 text-sm">
                Pilih akun Fizzy Anda untuk melanjutkan
              </p>

              <div className="space-y-3" role="listbox" aria-label="Daftar akun Fizzy">
                {accounts.map((account) => (
                  <button
                    key={account.slug}
                    onClick={() => handleSelectAccount(account)}
                    className="w-full text-left px-5 py-4 bg-zinc-900 border-2 border-zinc-700 rounded-2xl hover:border-amber-500 hover:shadow-md transition-all flex items-center justify-between group focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                    role="option"
                  >
                    <div>
                      <div className="font-bold text-zinc-100">{account.name || 'Akun'}</div>
                      <div className="text-xs text-zinc-500">{account.slug}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-zinc-100 text-center mb-2">
                Semua siap!
              </h2>
              <p className="text-zinc-500 text-center mb-6 text-sm">
                Atur pengalaman Anda atau mulai mencatat waktu
              </p>

              {/* Quick Settings Preview with random GIF */}
              <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6 border border-zinc-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg border border-zinc-700/50 shrink-0">
                      <img
                        alt={`Maskot ${randomGif.mood}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                        src={randomGif.url}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">Suasana Anda</p>
                      <p className="text-xs text-zinc-500 capitalize">{appSettings.moodType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-sm font-bold text-amber-500 hover:text-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-lg px-2 py-1"
                  >
                    Ubah
                  </button>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleFinishSetup}
                className="w-full btn-primary text-black font-bold py-4 rounded-2xl transition shadow-lg focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Mulai Mencatat
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="w-full text-zinc-500 font-medium py-3 hover:text-zinc-400 transition text-sm focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-xl"
              >
                Buka Pengaturan
              </button>
            </>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-zinc-800/30 rounded-2xl p-5 border border-zinc-700/50" aria-labelledby="info-title">
          <h3 id="info-title" className="font-bold text-zinc-300 mb-2 text-sm">Apa itu Fizzy?</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Fizzy adalah platform manajemen tugas untuk freelancer dan tim. Fizzy Timer
            membantu Anda mencatat waktu yang dihabiskan untuk kartu Fizzy.
          </p>
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
