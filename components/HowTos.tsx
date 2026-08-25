import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';

interface HowTosProps {
  onNavigate?: (page: string) => void;
}

interface Chapter {
  id: number;
  title: string;
  shortTitle: string;
  duration: number; // in seconds
  description: string;
  keySteps: string[];
  callout: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: '1. How to View Your Transaction History',
    shortTitle: 'Transaction History',
    duration: 12,
    description: 'Learn where to find all your dues payments, reunion tickets, and fees recorded in the ledger.',
    keySteps: [
      'Click "My Transactions" in the main navigation sidebar.',
      'Review your complete payment table with exact dates, descriptions, categories, and amounts.',
      'Check the total balance summary at the bottom of the page.'
    ],
    callout: 'Every payment you make is timestamped in local time and permanently recorded in your class ledger.'
  },
  {
    id: 2,
    title: '2. How to Open Your Receipt Dashboard',
    shortTitle: 'Open Receipt Hub',
    duration: 11,
    description: 'Access the dedicated Receipt & Statement Dashboard directly from any payment line.',
    keySteps: [
      'Navigate to "My Transactions" or your classmate profile.',
      'Look for the blue "📄 View Receipt" button next to any transaction.',
      'Click it to instantly launch the Classmate Receipt Hub in an interactive modal.'
    ],
    callout: 'You can also search for your name in the Classmates directory if you are an Administrator.'
  },
  {
    id: 3,
    title: '3. How to View a Single Payment Receipt',
    shortTitle: 'Single Receipt',
    duration: 12,
    description: 'Inspect an individual formal receipt with unique Receipt ID, verification seal, and payment method.',
    keySteps: [
      'Inside the Receipt Hub, select "Single Receipt" from the top view toggle.',
      'Use the dropdown to switch between any of your past payments.',
      'Verify the RCP reference number, payment date, category, and verified ledger seal.'
    ],
    callout: 'Single receipts feature official alumni branding, formatted dates, and verification timestamps.'
  },
  {
    id: 4,
    title: '4. How to View ALL Receipts (Cumulative Statement)',
    shortTitle: 'All Receipts Statement',
    duration: 13,
    description: 'Generate an all-in-one cumulative payment statement covering all your contributions to date.',
    keySteps: [
      'Click the "All Receipts / Statement" tab at the top of the Receipt Hub.',
      'View your lifetime total dues contributed alongside a complete chronological ledger.',
      'See itemized breakdowns with category badges and running totals.'
    ],
    callout: 'Perfect for annual reunions, tax documentation, and personal alumni records.'
  },
  {
    id: 5,
    title: '5. How to Share, Email & Print Any Receipt',
    shortTitle: 'Share, Email & Print',
    duration: 14,
    description: 'Export, print, copy, or email official receipts directly to yourself or class organizers.',
    keySteps: [
      'Click "🖨️ Print Receipt" for a high-contrast, clean printer-ready document.',
      'Click "✉️ Email Receipt" to launch a pre-formatted draft to your registered email.',
      'Click "📋 Copy Text Receipt" to copy a markdown receipt to your clipboard for texting or messaging.'
    ],
    callout: 'Printed documents automatically format into a clean letterhead without web navigation bars.'
  }
];

export const HowTos: React.FC<HowTosProps> = ({ onNavigate }) => {
  const { user, openReceiptDashboard, transactions } = useData();

  // Playback state
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressInChapter, setProgressInChapter] = useState(0); // 0 to 1
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [copiedToast, setCopiedToast] = useState(false);

  const currentChapter = CHAPTERS[activeChapterIndex];

  // Animation frame / timer loop
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current !== null && isPlaying) {
        const deltaSeconds = (time - lastTimeRef.current) / 1000;
        const chapterDuration = currentChapter.duration;
        const progressIncrement = (deltaSeconds * playbackSpeed) / chapterDuration;

        setProgressInChapter(prev => {
          const next = prev + progressIncrement;
          if (next >= 1) {
            // Move to next chapter or loop
            setActiveChapterIndex(idx => (idx + 1) % CHAPTERS.length);
            return 0;
          }
          return next;
        });
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackSpeed, currentChapter.duration]);

  const handleSelectChapter = (index: number) => {
    setActiveChapterIndex(index);
    setProgressInChapter(0);
    lastTimeRef.current = null;
  };

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
    lastTimeRef.current = null;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setProgressInChapter(ratio);
    lastTimeRef.current = null;
  };

  const handleNextChapter = () => {
    setActiveChapterIndex(idx => (idx + 1) % CHAPTERS.length);
    setProgressInChapter(0);
    lastTimeRef.current = null;
  };

  const handlePrevChapter = () => {
    setActiveChapterIndex(idx => (idx === 0 ? CHAPTERS.length - 1 : idx - 1));
    setProgressInChapter(0);
    lastTimeRef.current = null;
  };

  const handleLaunchMyReceipts = () => {
    if (user?.name) {
      openReceiptDashboard(user.name);
    } else if (transactions.length > 0) {
      openReceiptDashboard(transactions[0].classmateName);
    } else {
      openReceiptDashboard('Classmate');
    }
  };

  const copyGuideLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Calculate animated elements for the current chapter
  const currentStepIndex = Math.min(
    currentChapter.keySteps.length - 1,
    Math.floor(progressInChapter * currentChapter.keySteps.length)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-primary text-white tracking-wide uppercase">
              Interactive Video Guide
            </span>
            <span className="text-xs text-gray-500 font-medium">Classmate Knowledgebase</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text tracking-tight">
            How-To Video Instructions
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Watch the animated guide below to learn how to track your contributions, view individual or cumulative receipts, and print or share your statements.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate?.('transactions')}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <span>📊</span>
            <span>Go to My Transactions</span>
          </button>
          <button
            onClick={handleLaunchMyReceipts}
            className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span>📄</span>
            <span>Open My Receipt Hub</span>
          </button>
        </div>
      </div>

      {/* Main Animated Video Player Showcase */}
      <div className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800 text-white">
        {/* Video Screen Simulation Stage */}
        <div className="relative aspect-video sm:aspect-16/9 w-full bg-linear-to-b from-gray-950 via-slate-900 to-gray-900 overflow-hidden flex flex-col justify-between p-4 sm:p-8">
          {/* Top Bar inside Video */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Alumni Bookkeeping • {currentChapter.shortTitle}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCaptions(!showCaptions)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                  showCaptions
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-transparent text-gray-400 border-white/10 hover:text-white'
                }`}
                title="Toggle Subtitles / Captions"
              >
                CC {showCaptions ? 'ON' : 'OFF'}
              </button>
              <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-gray-300">
                Chapter {activeChapterIndex + 1}/{CHAPTERS.length}
              </div>
            </div>
          </div>

          {/* Animated Stage Display */}
          <div className="my-auto z-10 flex flex-col items-center justify-center text-center px-4">
            {/* Simulation Canvas UI */}
            <div className="w-full max-w-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-2xl transition-all duration-300 transform scale-100">
              {/* Animated Mockup by Chapter */}
              {activeChapterIndex === 0 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                        📊
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">My Transaction History</div>
                        <div className="text-[11px] text-slate-400">Class Dues &amp; Contributions Ledger</div>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-md border border-blue-500/30">
                      Step {currentStepIndex + 1} of 3
                    </span>
                  </div>

                  {/* Mock Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                          <th className="py-2 px-3 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        <tr className="bg-blue-600/10 text-white">
                          <td className="py-2.5 px-3 font-sans">8/24/2026</td>
                          <td className="py-2.5 px-3 font-sans font-medium">Annual Class Dues</td>
                          <td className="py-2.5 px-3"><span className="bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded text-[10px]">Dues</span></td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">$150.00</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                              📄 Receipt
                            </span>
                          </td>
                        </tr>
                        <tr className="text-slate-300">
                          <td className="py-2 px-3 font-sans">8/15/2026</td>
                          <td className="py-2 px-3 font-sans">Reunion Dinner Pass</td>
                          <td className="py-2 px-3"><span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">Reunion</span></td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-bold">$85.00</td>
                          <td className="py-2 px-3 text-center text-slate-500">📄</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Animated Simulated Cursor Pointer */}
                  <div
                    className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl transition-all"
                  >
                    <span className="text-base animate-bounce">👆</span>
                    <span>
                      {currentStepIndex === 0 && 'Click "My Transactions" in the left sidebar anytime to see your records.'}
                      {currentStepIndex === 1 && 'Every contribution shows exact local dates, categories, and amounts.'}
                      {currentStepIndex === 2 && 'Review your lifetime totals and click "Receipt" on any line item.'}
                    </span>
                  </div>
                </div>
              )}

              {activeChapterIndex === 1 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                        📄
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Opening the Receipt Dashboard</div>
                        <div className="text-[11px] text-slate-400">One-click Classmate Receipt Modal</div>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/30">
                      Step {currentStepIndex + 1} of 3
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Quick Action</div>
                      <div className="text-sm font-bold text-white mt-0.5">Click "📄 View Receipt" on any row</div>
                      <div className="text-xs text-slate-300 mt-1">Instant popup with official stamp and statements.</div>
                    </div>

                    <button
                      onClick={handleLaunchMyReceipts}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🚀</span>
                      <span>Try It Now (Open Receipt Hub)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
                    <span className="text-base">✨</span>
                    <span>
                      {currentStepIndex === 0 && 'Locate the blue receipt icon on your transaction row.'}
                      {currentStepIndex === 1 && 'The modal opens instantly without leaving your current page.'}
                      {currentStepIndex === 2 && 'Switch easily between single receipts and full cumulative statements.'}
                    </span>
                  </div>
                </div>
              )}

              {activeChapterIndex === 2 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                        🏷️
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Viewing a Single Receipt</div>
                        <div className="text-[11px] text-slate-400">Formal Alumni Dues Receipt (RCP-XXXX)</div>
                      </div>
                    </div>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
                      Step {currentStepIndex + 1} of 3
                    </span>
                  </div>

                  {/* Simulated Receipt Card */}
                  <div className="bg-white text-slate-900 rounded-xl p-4 text-left shadow-lg border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Receipt Reference</div>
                        <div className="text-xs font-mono font-bold text-blue-700">RCP-89FA102B</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ✓ PAID &amp; VERIFIED
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs my-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Classmate</span>
                        <span className="font-bold text-slate-800">{user?.name || 'Smith, John'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Date</span>
                        <span className="font-bold text-slate-800">August 24, 2026</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Category</span>
                        <span className="font-bold text-slate-800">Dues</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Amount</span>
                        <span className="font-bold text-emerald-600 text-sm">$150.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 p-2.5 rounded-xl">
                    <span className="text-base">📌</span>
                    <span>
                      {currentStepIndex === 0 && 'Single Receipt mode displays full verification stamps and ledger seals.'}
                      {currentStepIndex === 1 && 'Use the transaction dropdown inside the modal to switch payments.'}
                      {currentStepIndex === 2 && 'Every receipt is watermarked and ready for printing or emailing.'}
                    </span>
                  </div>
                </div>
              )}

              {activeChapterIndex === 3 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-sm">
                        📑
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">All Receipts / Cumulative Statement</div>
                        <div className="text-[11px] text-slate-400">Complete Lifetime Contribution Ledger</div>
                      </div>
                    </div>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/30">
                      Step {currentStepIndex + 1} of 3
                    </span>
                  </div>

                  {/* Simulated Statement Card */}
                  <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Lifetime Contributions</span>
                        <div className="text-lg font-extrabold text-emerald-400 font-mono">$485.00</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-900/50 px-2.5 py-1 rounded-md border border-purple-500/30">
                          Cumulative Statement
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-700/50 font-mono">
                        <span>8/24/2026 - Class Dues</span>
                        <span className="text-emerald-400 font-bold">$150.00</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/50 font-mono">
                        <span>8/15/2026 - Reunion Dinner</span>
                        <span className="text-emerald-400 font-bold">$85.00</span>
                      </div>
                      <div className="flex justify-between py-1 font-mono">
                        <span>7/01/2026 - Class Gift Fund</span>
                        <span className="text-emerald-400 font-bold">$250.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-950/40 border border-purple-500/30 p-2.5 rounded-xl">
                    <span className="text-base">💡</span>
                    <span>
                      {currentStepIndex === 0 && 'Toggle "All Receipts / Statement" at the top of the Receipt modal.'}
                      {currentStepIndex === 1 && 'Aggregates all your dues, merchandise, and event contributions.'}
                      {currentStepIndex === 2 && 'Provides an itemized printable ledger for your personal records.'}
                    </span>
                  </div>
                </div>
              )}

              {activeChapterIndex === 4 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-sm">
                        🖨️
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Share, Email &amp; Print Receipts</div>
                        <div className="text-[11px] text-slate-400">One-click Multi-channel Receipt Delivery</div>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30">
                      Step {currentStepIndex + 1} of 3
                    </span>
                  </div>

                  {/* 3 Action Buttons Simulation */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center gap-1">
                      <div className="text-xl">🖨️</div>
                      <div className="text-xs font-bold text-white">Print Receipt</div>
                      <div className="text-[10px] text-slate-400">Clean printer letterhead</div>
                    </div>

                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center gap-1">
                      <div className="text-xl">✉️</div>
                      <div className="text-xs font-bold text-white">Email Receipt</div>
                      <div className="text-[10px] text-slate-400">Pre-filled email draft</div>
                    </div>

                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center gap-1">
                      <div className="text-xl">📋</div>
                      <div className="text-xs font-bold text-white">Copy Text</div>
                      <div className="text-[10px] text-slate-400">Markdown for SMS &amp; Chat</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl">
                    <span className="text-base">🚀</span>
                    <span>
                      {currentStepIndex === 0 && 'Click "Print" to print directly or save as a pristine PDF.'}
                      {currentStepIndex === 1 && 'Click "Email" to draft an itemized receipt to your inbox.'}
                      {currentStepIndex === 2 && 'Click "Copy Text" to paste verified details into WhatsApp, iMessage, or email.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subtitles / Narration Caption Bar */}
          {showCaptions && (
            <div className="z-10 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center max-w-2xl mx-auto my-2 shadow-lg animate-in fade-in duration-200">
              <p className="text-xs sm:text-sm font-medium text-gray-200 leading-snug">
                <span className="text-brand-accent font-bold mr-1.5">Narration:</span>
                {currentChapter.keySteps[currentStepIndex]}
              </p>
            </div>
          )}

          {/* Video Controls Bar */}
          <div className="z-10 pt-3 border-t border-white/10 flex flex-col gap-2">
            {/* Progress / Scrubbing Bar */}
            <div
              onClick={handleSeek}
              className="relative h-2.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer overflow-hidden transition-all group"
              title="Click to jump timeline"
            >
              <div
                className="absolute top-0 left-0 h-full bg-linear-to-r from-blue-500 to-brand-accent rounded-full transition-all duration-75"
                style={{ width: `${progressInChapter * 100}%` }}
              ></div>
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center justify-between text-xs text-gray-300 pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevChapter}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                  title="Previous Chapter"
                >
                  ⏮️
                </button>
                <button
                  onClick={handleTogglePlay}
                  className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition-all flex items-center gap-1.5"
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button
                  onClick={handleNextChapter}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                  title="Next Chapter"
                >
                  ⏭️
                </button>
                <span className="text-xs font-mono text-gray-400">
                  {Math.round(progressInChapter * currentChapter.duration)}s / {currentChapter.duration}s
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Speed selector */}
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Speed:</span>
                  {[1, 1.25, 1.5].map(spd => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        playbackSpeed === spd ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={copyGuideLink}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <span>{copiedToast ? '✓ Copied!' : '🔗 Share Guide'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Selection Bar Below Screen */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-800 bg-gray-950 border-t border-gray-800">
          {CHAPTERS.map((ch, idx) => {
            const isSelected = idx === activeChapterIndex;
            return (
              <button
                key={ch.id}
                onClick={() => handleSelectChapter(idx)}
                className={`p-3.5 sm:p-4 text-left transition-all relative ${
                  isSelected
                    ? 'bg-slate-800/90 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/60'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-brand-accent"></div>
                )}
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-accent mb-0.5">
                  Part {ch.id}
                </div>
                <div className="text-xs font-bold truncate">{ch.shortTitle}</div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">{ch.duration} sec</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Step-by-Step Cards (Accessible Reading Guide) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-text">Step-by-Step Illustrated Guide</h2>
            <p className="text-xs text-gray-500">Quick reference cards for all receipt &amp; ledger features.</p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Print Guide</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CHAPTERS.map((chapter) => (
            <div
              key={chapter.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                chapter.id - 1 === activeChapterIndex
                  ? 'border-brand-primary ring-2 ring-brand-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold text-xs">
                    {chapter.id}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">{chapter.title}</h3>
                </div>
                <button
                  onClick={() => handleSelectChapter(chapter.id - 1)}
                  className="text-xs font-semibold text-brand-primary hover:text-brand-secondary underline shrink-0"
                >
                  Play Chapter
                </button>
              </div>

              <p className="text-xs text-gray-600 mb-4">{chapter.description}</p>

              <div className="space-y-2 mb-4 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Key Steps:</div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-700">
                  {chapter.keySteps.map((step, sIdx) => (
                    <li key={sIdx} className="leading-relaxed">
                      <span className="font-medium">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-center gap-2 text-xs text-blue-900 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                <span className="text-sm">💡</span>
                <span className="text-[11px] font-medium">{chapter.callout}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classmate Support Notice */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-md">
            🤝
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-950">Need Help with Your Account or Receipt?</h4>
            <p className="text-xs text-blue-800 mt-0.5">
              Your Class Administrators are available to assist with dues payments, check reconciliations, or receipt verification.
            </p>
          </div>
        </div>
        <button
          onClick={handleLaunchMyReceipts}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          View My Receipts Now
        </button>
      </div>
    </div>
  );
};

export default HowTos;
