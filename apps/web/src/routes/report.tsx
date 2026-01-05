/**
 * Report Route
 * Shows weekly reports with charts and export options
 * Dark Theme with Gold/Amber Accent
 * Data from Fizzy API (DONE cards)
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  FileText,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toPng } from 'html-to-image';

import { BottomNav } from '@/components/layout/BottomNav';
import {
  useWeeklyReport,
  generateWeeklyPrompt,
  generateWhatsAppText,
  export4WeeksToExcel,
  type WeeklyReportData,
} from '@/lib/hooks/useWeeklyReport';

export const Route = createFileRoute('/report')({
  component: ReportComponent,
});

// Custom tooltip for chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl">
        <p className="text-zinc-300 text-sm font-medium">{payload[0].payload.displayDate}</p>
        <p className="text-amber-500 text-lg font-bold">
          {payload[0].value} {payload[0].value === 1 ? 'card' : 'cards'}
        </p>
      </div>
    );
  }
  return null;
};

function ReportComponent() {
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
  } = useWeeklyReport();

  const reportRef = useRef<HTMLDivElement>(null);
  const [shareMode, setShareMode] = useState<'image' | 'xml' | 'text'>('image');
  const [copied, setCopied] = useState(false);

  // Handle PNG export
  const handleExportPNG = async () => {
    if (!reportRef.current || reportData.totalCards === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    try {
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#050505',
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `weekly-report-${reportData.startDate.toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Gambar berhasil diekspor');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Gagal mengekspor gambar');
    }
  };

  // Handle copy XML
  const handleCopyXML = () => {
    const xml = generateWeeklyPrompt(reportData);
    navigator.clipboard.writeText(xml);
    setCopied(true);
    toast.success('XML disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle copy WhatsApp text
  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppText(reportData);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Teks disalin untuk WhatsApp');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#050505]/80 backdrop-blur-md px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-lg font-bold text-zinc-100">Laporan Mingguan</h1>
          <button
            onClick={() => refetchCards()}
            disabled={loading}
            aria-label="Muat ulang data"
            className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-500 hover:text-amber-500 disabled:opacity-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Week Navigator */}
        <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
          <button
            onClick={goToPreviousWeek}
            aria-label="Minggu sebelumnya"
            className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-400 hover:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="text-center">
            <p className="text-sm text-zinc-500 font-medium">Rentang Minggu</p>
            <p className="text-lg font-bold text-zinc-100">{reportData.dateRangeLabel}</p>
            <p className="text-xs text-zinc-600">Kamis ke Rabu (Thursday to Wednesday)</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={goToNextWeek}
              disabled={isCurrentWeek}
              aria-label="Minggu selanjutnya"
              className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-xl"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
            {!isCurrentWeek && (
              <button
                onClick={goToCurrentWeek}
                className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-500 rounded-xl hover:bg-amber-500/30 transition font-medium focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Minggu Ini
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl" role="alert" aria-live="polite">
            <p className="text-red-400 text-sm font-medium">Gagal memuat kartu dari API Fizzy</p>
            <p className="text-red-500/70 text-xs mt-1">Periksa token API di Pengaturan</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
            <span className="sr-only">Memuat...</span>
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" aria-hidden="true" />
          </div>
        )}

        {/* Share Mode Tabs */}
        <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800/50" role="tablist" aria-label="Pilih mode ekspor">
          <button
            onClick={() => setShareMode('image')}
            disabled={loading}
            role="tab"
            aria-selected={shareMode === 'image'}
            aria-label="Tampilan gambar"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${
              shareMode === 'image'
                ? 'bg-amber-500 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            } disabled:opacity-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950`}
          >
            <ImageIcon className="w-4 h-4" aria-hidden="true" />
            <span>Gambar</span>
          </button>
          <button
            onClick={() => setShareMode('xml')}
            disabled={loading}
            role="tab"
            aria-selected={shareMode === 'xml'}
            aria-label="Tampilan XML"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${
              shareMode === 'xml'
                ? 'bg-amber-500 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            } disabled:opacity-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950`}
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>XML</span>
          </button>
          <button
            onClick={() => setShareMode('text')}
            disabled={loading}
            role="tab"
            aria-selected={shareMode === 'text'}
            aria-label="Teks WhatsApp"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${
              shareMode === 'text'
                ? 'bg-amber-500 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            } disabled:opacity-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950`}
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Report Content - For Image Export */}
        {!loading && shareMode === 'image' && (
          <div ref={reportRef} className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800/50 shadow-xl">
            {/* Report Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl font-bold text-gradient-gold">Lapor Weekly</h2>
              </div>
              <p className="text-zinc-500">{reportData.dateRangeLabel}</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <p className="text-3xl font-bold text-amber-500">{reportData.totalCards}</p>
                <p className="text-xs text-zinc-500 mt-1">Kartu Selesai</p>
              </div>
              <div className="text-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <p className="text-3xl font-bold text-zinc-100">{reportData.totalBoards}</p>
                <p className="text-xs text-zinc-500 mt-1">Papan</p>
              </div>
              <div className="text-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <p className="text-3xl font-bold text-zinc-100">{reportData.avgDailyCards}</p>
                <p className="text-xs text-zinc-500 mt-1">Rata-rata / Hari</p>
              </div>
            </div>

            {/* Daily Chart */}
            {reportData.dailyData.some((d) => d.cardCount > 0) && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Rincian Harian</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        stroke="#27272a"
                      />
                      <YAxis
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        stroke="#27272a"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="cardCount" radius={[6, 6, 0, 0]}>
                        {reportData.dailyData.map((entry, index) => {
                          const isMax = entry.cardCount === Math.max(...reportData.dailyData.map((d) => d.cardCount));
                          return <Cell key={`cell-${index}`} fill={isMax && entry.cardCount > 0 ? '#f59e0b' : '#3f3f46'} />;
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
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Papan</h3>
                <div className="space-y-2">
                  {reportData.boards.map((boardName) => {
                    const boardCards = reportData.cards.filter((c) => c.boardName === boardName);
                    const percentage = reportData.totalCards > 0 ? (boardCards.length / reportData.totalCards) * 100 : 0;

                    return (
                      <div key={boardName} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-zinc-100">{boardName}</p>
                            <p className="text-sm font-bold text-amber-500">{boardCards.length} kartu</p>
                          </div>
                          <div className="w-full bg-zinc-700 rounded-full h-1.5">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full transition-all"
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
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  Kartu Selesai ({reportData.cards.length})
                </h3>
                <div className="space-y-2">
                  {reportData.cards.map((card) => (
                    <div
                      key={card.cardId}
                      className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50"
                    >
                      <div className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-green-500/20 text-green-500 rounded-full flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">{card.cardTitle}</p>
                        <p className="text-xs text-zinc-500">
                          #{card.cardNumber} • {card.boardName} • {card.column}
                        </p>
                        {(card.assignees.length > 0 || card.tags.length > 0) && (
                          <div className="flex items-center gap-2 mt-1">
                            {card.assignees.length > 0 && (
                              <span className="text-xs text-zinc-600">👤 {card.assignees.join(', ')}</span>
                            )}
                            {card.tags.length > 0 && (
                              <span className="text-xs text-zinc-600">🏷️ {card.tags.join(', ')}</span>
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
            <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-600">Dibuat oleh Fizzy Timer • Data dari API Fizzy</p>
            </div>
          </div>
        )}

        {/* XML Mode */}
        {!loading && shareMode === 'xml' && (
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Template Prompt XML</h3>
              <button
                onClick={handleCopyXML}
                className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-900 rounded-lg transition flex items-center gap-1.5 font-medium focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                {copied ? 'Disalin!' : 'Salin XML'}
              </button>
            </div>
            <pre className="bg-zinc-950 rounded-xl p-4 overflow-x-auto text-xs text-zinc-400 border border-zinc-800/50 font-mono max-h-96 overflow-y-auto">
              {generateWeeklyPrompt(reportData)}
            </pre>
          </div>
        )}

        {/* WhatsApp Text Mode */}
        {!loading && shareMode === 'text' && (
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Teks WhatsApp</h3>
              <button
                onClick={handleCopyWhatsApp}
                className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-900 rounded-lg transition flex items-center gap-1.5 font-medium focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                {copied ? 'Disalin!' : 'Salin Teks'}
              </button>
            </div>
            <div className="bg-zinc-950 rounded-xl p-4 text-sm text-zinc-300 border border-zinc-800/50 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
              {generateWhatsAppText(reportData)}
            </div>
          </div>
        )}

        {/* Export Button for Image Mode */}
        {!loading && shareMode === 'image' && reportData.totalCards > 0 && (
          <div className="space-y-2">
            <button
              onClick={handleExportPNG}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-900 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              <ImageIcon className="w-5 h-5" aria-hidden="true" />
              Ekspor sebagai PNG
            </button>
            <button
              onClick={() => export4WeeksToExcel(allCards)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-900 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
              Ekspor 4 Minggu ke Excel
            </button>
          </div>
        )}

        {/* Export Excel Button (always show if has any data) */}
        {!loading && allCards.length > 0 && reportData.totalCards === 0 && (
          <button
            onClick={() => export4WeeksToExcel(allCards)}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-900 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
            Ekspor 4 Minggu ke Excel
          </button>
        )}

        {/* Empty State */}
        {!loading && !error && reportData.totalCards === 0 && allCards.length === 0 && (
          <div className="text-center py-16" role="status" aria-live="polite">
            <div className="inline-flex p-4 bg-zinc-900 rounded-3xl shadow-sm border border-zinc-800/50 mb-4">
              <CheckCircle2 className="w-12 h-12 text-zinc-700" aria-hidden="true" />
            </div>
            <p className="text-zinc-600 font-medium mb-1">Tidak ada kartu selesai minggu ini</p>
            <p className="text-sm text-zinc-700">Kartu dengan status SELESAI akan muncul di sini</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
