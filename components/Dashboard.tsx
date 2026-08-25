import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory, Announcement } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getYearFromDateString, formatDisplayDate } from '../services/dateUtils';
import { parseFacebookUrl } from '../services/facebookService';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className="bg-brand-accent p-3 rounded-full text-white">{icon}</div>
    <div className="ml-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-brand-text">{value}</p>
    </div>
  </div>
);

const categoryColors: { [key in PaymentCategory]: string } = {
  [PaymentCategory.Dues]: '#1976D2',
  [PaymentCategory.ReunionDeposit]: '#64B5F6',
  [PaymentCategory.Fundraiser]: '#4CAF50',
  [PaymentCategory.ClassmateSupport]: '#FFC107',
  [PaymentCategory.Benevolence]: '#F44336',
  [PaymentCategory.Bereavement]: '#9C27B0',
  [PaymentCategory.SimpleDeposit]: '#795548',
  [PaymentCategory.Picnic]: '#009688',
  [PaymentCategory.Expense]: '#E91E63',
  [PaymentCategory.BankMaintFee]: '#607D8B',
};

const Dashboard: React.FC = () => {
  const { 
    user, 
    classBalance, 
    transactions, 
    announcements, 
    facebookPageUrl,
    setFacebookPageUrl,
    subtitle
  } = useData();

  const isReadOnly = user?.role === 'Admin_ro';
  const isAdmin = user?.isAdmin && !isReadOnly;

  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<PaymentCategory[]>([PaymentCategory.Dues, PaymentCategory.Fundraiser]);
  
  // Facebook URL Modal State
  const [isFbUrlModalOpen, setIsFbUrlModalOpen] = useState(false);
  const [fbUrlInput, setFbUrlInput] = useState(facebookPageUrl || '');
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  // Keep input in sync with loaded data
  useEffect(() => {
    setFbUrlInput(facebookPageUrl || '');
  }, [facebookPageUrl]);

  // Parse Facebook details (Page vs Group)
  const fbInfo = useMemo(() => {
    return parseFacebookUrl(facebookPageUrl || '');
  }, [facebookPageUrl]);

  const handleCategoryChange = (category: PaymentCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const chartData = useMemo(() => {
    if (selectedCategories.length === 0) return [];

    const yearlyData: { [year: string]: { [category: string]: number } } = {};

    transactions.forEach(t => {
      if (selectedCategories.includes(t.category)) {
        const year = getYearFromDateString(t.date);
        if (!yearlyData[year]) {
          yearlyData[year] = {};
          selectedCategories.forEach(cat => {
            yearlyData[year][cat] = 0;
          });
        }
        yearlyData[year][t.category] = (yearlyData[year][t.category] || 0) + t.amount;
      }
    });

    return Object.entries(yearlyData)
      .map(([year, data]) => ({ year, ...data }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year))
      .slice(-5); // Show last 5 years
  }, [transactions, selectedCategories]);

  const totalContributions = useMemo(() => {
      const contributionCategories = [
          PaymentCategory.SimpleDeposit,
          PaymentCategory.Bereavement,
          PaymentCategory.ClassmateSupport,
          PaymentCategory.Benevolence
      ];
      return transactions
          .filter(t => contributionCategories.includes(t.category))
          .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const handleSaveFacebookUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingUrl(true);
      const clean = fbUrlInput.trim();
      await setFacebookPageUrl(clean);
      setIsFbUrlModalOpen(false);
    } catch (err) {
      console.error("Failed to save Facebook Page URL:", err);
    } finally {
      setIsSavingUrl(false);
    }
  };

  return (
    <div className="space-y-8">
      {user?.role !== 'Guest' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Class Account Balance" 
            value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(classBalance)}
            icon={<BalanceIcon />}
          />
          <StatCard 
            title="Total Contributions Received" 
            value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalContributions)}
            icon={<DonationIcon />}
          />
           <StatCard 
            title="Total Transactions" 
            value={transactions.length.toString()}
            icon={<TransactionsIcon />}
          />
        </div>
      )}

      {user?.role !== 'Guest' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Yearly Financials by Category</h3>
          
          <div className="border-y border-gray-200 my-4 py-4">
            <h4 className="text-md font-semibold mb-3 text-gray-600">Select categories to compare:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
              {Object.values(PaymentCategory).map(cat => (
                <label key={cat} className="flex items-center space-x-2 cursor-pointer p-1 rounded-md hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                    className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                    style={{ color: categoryColors[cat] }}
                  />
                  <span className="text-sm text-gray-700">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            {selectedCategories.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
                  <Legend />
                  {selectedCategories.map(cat => (
                    <Bar key={cat} dataKey={cat} fill={categoryColors[cat]} name={cat} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Please select one or more categories to display the chart.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FACEBOOK GROUP FEED & ANNOUNCEMENTS (READ-ONLY)                          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-[#1877F2] to-indigo-900 p-5 sm:p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-white text-[#1877F2] flex items-center justify-center font-extrabold text-2xl shadow-lg ring-4 ring-white/20 shrink-0">
                f
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Class Facebook Group Feed
                  </h3>
                  <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {fbInfo.isGroup ? 'Class Group' : 'Official Page'}
                  </span>
                  <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                    Read-Only Stream
                  </span>
                  <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Live Feed
                  </span>
                </div>
                <p className="text-blue-100/90 text-xs sm:text-sm mt-1">
                  {facebookPageUrl 
                    ? `Live connection to ${fbInfo.isGroup ? `Facebook Group #${fbInfo.groupIdOrName || 'Class Group'}` : (subtitle || 'Class Page')} — streaming real-time posts, photos & discussions.`
                    : "Connect your Class Facebook Group URL in Admin to display the live feed for all classmates."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {facebookPageUrl && (
                <a
                  href={facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-[#1877F2] hover:bg-blue-50 font-bold text-xs px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md hover:shadow"
                >
                  <span>{fbInfo.isGroup ? 'Open Group on Facebook' : 'Visit Facebook Page'}</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    setFbUrlInput(facebookPageUrl || '');
                    setIsFbUrlModalOpen(true);
                  }}
                  className="bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 backdrop-blur-sm shadow-sm"
                  title="Configure Class Facebook Group URL"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{facebookPageUrl ? 'Edit FB URL' : 'Set FB URL'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Connected Facebook Page Status Bar */}
          <div className="mt-4 pt-3 border-t border-blue-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {facebookPageUrl ? (
                <span className="text-blue-100 truncate max-w-xl">
                  {fbInfo.isGroup ? 'Connected Group: ' : 'Connected Page: '}
                  <strong className="text-white underline">{facebookPageUrl}</strong>
                </span>
              ) : (
                <span className="text-amber-200 font-medium">
                  Class Facebook URL is not configured yet.
                </span>
              )}
            </div>

            {facebookPageUrl && (
              <span className="text-blue-200 text-[11px] font-medium">
                Direct live stream • 100% genuine Facebook data
              </span>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Read-Only Notice Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>
                <strong>Read-Only Live Feed:</strong> Posts, photos, and discussions are served live from Facebook and cannot be edited or deleted inside this ledger. All interactions occur directly on Facebook.
              </span>
            </div>
            {facebookPageUrl && (
              <a
                href={facebookPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1877F2] hover:underline font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1 self-start sm:self-auto"
              >
                Open in Facebook ↗
              </a>
            )}
          </div>

          {/* Unconfigured Alert for Admin */}
          {!facebookPageUrl && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📢</span>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Connect Your Class Facebook Group or Page</h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Enter the URL of your Class Facebook Group (e.g. <code>https://www.facebook.com/groups/137851679602885</code>) to display the live feed, photos, and reunion updates.
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    setFbUrlInput('');
                    setIsFbUrlModalOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap shadow transition-colors"
                >
                  Enter Facebook URL
                </button>
              )}
            </div>
          )}

          {/* Connected Facebook Group Live Portal */}
          {facebookPageUrl && (
            <div className="space-y-6">
              {fbInfo.isGroup ? (
                /* Interactive Facebook Group Portal */
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                      <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#1877F2]"></span>
                        Official Class Facebook Group Feed
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Group ID: <strong className="text-gray-800">{fbInfo.groupIdOrName}</strong> • Live discussions, photo albums, events & classmate posts
                      </p>
                    </div>
                    <a
                      href={facebookPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow inline-flex items-center gap-1.5 self-start md:self-auto"
                    >
                      <span>View 10 Recent Posts on Facebook</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>

                  {/* 1-Click Launchers into the 10 most recent sections of the group */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <a 
                      href={facebookPageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group block"
                    >
                      <div className="text-2xl mb-1.5">💬</div>
                      <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 flex items-center justify-between">
                        <span>Latest 10 Posts & Wall</span>
                        <span className="text-gray-400 group-hover:text-blue-600 text-xs">↗</span>
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">Browse the latest 10 posts, discussions, and classmate threads live on Facebook</p>
                    </a>

                    <a 
                      href={`${facebookPageUrl}/photos`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group block"
                    >
                      <div className="text-2xl mb-1.5">📸</div>
                      <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 flex items-center justify-between">
                        <span>Group Photo Albums</span>
                        <span className="text-gray-400 group-hover:text-blue-600 text-xs">↗</span>
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">View authentic photos, senior memories, reunion snapshots and picnic galleries</p>
                    </a>

                    <a 
                      href={`${facebookPageUrl}/events`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group block"
                    >
                      <div className="text-2xl mb-1.5">📅</div>
                      <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 flex items-center justify-between">
                        <span>Class Events & Reunions</span>
                        <span className="text-gray-400 group-hover:text-blue-600 text-xs">↗</span>
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">RSVP for upcoming banquets, homecoming tailgates, fundraisers and meetups</p>
                    </a>

                    <a 
                      href={`${facebookPageUrl}/members`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group block"
                    >
                      <div className="text-2xl mb-1.5">👥</div>
                      <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 flex items-center justify-between">
                        <span>Group Members</span>
                        <span className="text-gray-400 group-hover:text-blue-600 text-xs">↗</span>
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">Connect with verified classmates, alumni committee members, and organizers</p>
                    </a>
                  </div>
                </div>
              ) : (
                /* Facebook Page Plugin Iframe (for standard Facebook Pages) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2]"></span>
                      Official Facebook Page Timeline Plugin (Live)
                    </h4>
                    <a
                      href={facebookPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1877F2] hover:underline font-semibold"
                    >
                      Open in Facebook &rarr;
                    </a>
                  </div>

                  <div className="w-full flex justify-center bg-gray-50 p-4 rounded-2xl border border-gray-200 overflow-hidden min-h-[500px]">
                    <iframe
                      title="Facebook Page Live Timeline"
                      src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookPageUrl)}&tabs=timeline&width=500&height=750&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                      width="500"
                      height="750"
                      style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }}
                      scrolling="no"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen={true}
                      className="rounded-xl shadow-sm bg-white"
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE CLASS FACEBOOK GROUP URL                                 */}
      {/* ========================================================================= */}
      {isFbUrlModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1877F2] text-white flex items-center justify-center font-bold text-lg">
                  f
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Configure Class Facebook Group URL</h3>
                  <p className="text-xs text-gray-500">Links your official Class Facebook Group or Page</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFbUrlModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFacebookUrl} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Facebook Group or Page URL *
                </label>
                <input
                  type="url"
                  placeholder="https://www.facebook.com/groups/137851679602885"
                  value={fbUrlInput}
                  onChange={e => setFbUrlInput(e.target.value)}
                  className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Example: <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">https://www.facebook.com/groups/137851679602885</code>
                </p>
              </div>

              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1 text-blue-950">
                  <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  Live Facebook Feed Connection
                </p>
                <p className="text-blue-800 leading-relaxed">
                  Saving your Facebook Group URL links the Facebook Group directly to the Dashboard. All posts, photos, and interactions are read-only and sourced live from Facebook.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                {fbUrlInput ? (
                  <a
                    href={fbUrlInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1877F2] hover:underline font-semibold"
                  >
                    Test URL ↗
                  </a>
                ) : <span />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFbUrlModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUrl}
                    className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow transition-colors disabled:bg-gray-400"
                  >
                    {isSavingUrl ? 'Saving...' : 'Save Facebook URL'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Enlarged Image Modal */}
      {enlargedImageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
          onClick={() => setEnlargedImageUrl(null)}
        >
          <img 
            src={enlargedImageUrl} 
            alt="Enlarged view" 
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="absolute top-4 right-4 text-white text-4xl font-bold leading-none hover:text-gray-300">&times;</button>
        </div>
      )}
    </div>
  );
};

const BalanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V5M12 20v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1" /></svg>;
const DonationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const TransactionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

export default Dashboard;
