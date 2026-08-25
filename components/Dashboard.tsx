import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory, Announcement } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getYearFromDateString, formatDisplayDate, getTodayLocalDateString } from '../services/dateUtils';
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
    addAnnouncement,
    facebookPageUrl,
    setFacebookPageUrl,
    syncFacebookPosts,
    loginWithFacebookAndSync,
    isFbAdminLoggedIn,
    fbAdminName,
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

  // Facebook Sync State on Dashboard
  const [isSyncingFb, setIsSyncingFb] = useState(false);
  const [fbSyncMessage, setFbSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Direct Add / Paste Facebook Post Modal on Dashboard
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({
    title: '',
    content: '',
    authorName: '',
    url: '',
    imageUrl: '',
    date: getTodayLocalDateString(),
  });
  const [isSavingPost, setIsSavingPost] = useState(false);

  const handleCreatePostFromDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostData.content.trim() && !newPostData.title.trim()) {
      alert("Please enter post text or a title.");
      return;
    }
    try {
      setIsSavingPost(true);
      await addAnnouncement({
        title: newPostData.title.trim() || (newPostData.content.slice(0, 50) + (newPostData.content.length > 50 ? '...' : '')),
        content: newPostData.content.trim(),
        authorName: newPostData.authorName.trim() || 'Class Facebook Member',
        url: newPostData.url.trim() || (facebookPageUrl || ''),
        imageUrl: newPostData.imageUrl.trim() || undefined,
        type: 'facebook'
      });
      setFbSyncMessage({
        type: 'success',
        text: 'Facebook post added successfully to the Dashboard feed!'
      });
      setTimeout(() => setFbSyncMessage(null), 4000);
      setIsAddPostModalOpen(false);
      setNewPostData({
        title: '',
        content: '',
        authorName: '',
        url: '',
        imageUrl: '',
        date: getTodayLocalDateString(),
      });
    } catch (err: any) {
      console.error("Error creating post:", err);
      alert(err.message || "Failed to save post.");
    } finally {
      setIsSavingPost(false);
    }
  };

  // Filter the 10 most recent Facebook announcements
  const recentFbPosts = useMemo(() => {
    return (announcements || [])
      .filter(a => a.type === 'facebook' || (a.url && a.url.includes('facebook.com')) || (!a.type && a.content))
      .slice(0, 10);
  }, [announcements]);

  // Keep input in sync with loaded data
  useEffect(() => {
    setFbUrlInput(facebookPageUrl || '');
  }, [facebookPageUrl]);

  // Parse Facebook details (Page vs Group)
  const fbInfo = useMemo(() => {
    return parseFacebookUrl(facebookPageUrl || '');
  }, [facebookPageUrl]);

  const handleAdminFbLoginAndSync = async () => {
    try {
      setIsSyncingFb(true);
      setFbSyncMessage(null);
      const count = await loginWithFacebookAndSync(facebookPageUrl);
      setFbSyncMessage({
        type: 'success',
        text: `Successfully authenticated with Facebook and fetched ${count} latest posts!`
      });
      setTimeout(() => setFbSyncMessage(null), 5000);
    } catch (err: any) {
      console.error("Dashboard FB Login & Sync Error:", err);
      setFbSyncMessage({
        type: 'error',
        text: err.message || 'Failed to authenticate with Facebook or fetch posts.'
      });
    } finally {
      setIsSyncingFb(false);
    }
  };

  const handleAdminRefreshSync = async () => {
    try {
      setIsSyncingFb(true);
      setFbSyncMessage(null);
      const count = await syncFacebookPosts(facebookPageUrl);
      setFbSyncMessage({
        type: 'success',
        text: `Feed updated! Fetched ${count} most recent posts from Facebook.`
      });
      setTimeout(() => setFbSyncMessage(null), 5000);
    } catch (err: any) {
      console.error("Dashboard FB Sync Error:", err);
      setFbSyncMessage({
        type: 'error',
        text: err.message || 'Failed to refresh posts from Facebook.'
      });
    } finally {
      setIsSyncingFb(false);
    }
  };

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
              {/* Admin Facebook Auth & Sync Control Bar */}
              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${isFbAdminLoggedIn ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`}></div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <span>{isFbAdminLoggedIn ? `Connected to Facebook (${fbAdminName || 'Admin'})` : 'Admin Facebook Authentication Required'}</span>
                    </h4>
                    <p className="text-xs text-gray-500">
                      {isFbAdminLoggedIn 
                        ? 'Admin is authenticated to fetch the 10 most recent posts from the Facebook feed.' 
                        : 'Admin must log into Facebook to authorize and fetch the 10 most recent posts.'}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {isFbAdminLoggedIn ? (
                      <button
                        type="button"
                        onClick={handleAdminRefreshSync}
                        disabled={isSyncingFb}
                        className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <svg className={`w-3.5 h-3.5 ${isSyncingFb ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        <span>{isSyncingFb ? 'Fetching Posts...' : 'Refresh 10 Latest Posts'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAdminFbLoginAndSync}
                        disabled={isSyncingFb}
                        className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <div className="w-4 h-4 rounded bg-white text-[#1877F2] font-black text-[10px] flex items-center justify-center">f</div>
                        <span>{isSyncingFb ? 'Authenticating & Fetching...' : 'Log in with FB to Fetch 10 Posts'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {fbSyncMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-medium ${
                  fbSyncMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {fbSyncMessage.type === 'success' ? '✓ ' : '⚠️ '}
                  {fbSyncMessage.text}
                </div>
              )}

              {/* 10 Most Recent Posts Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2]"></span>
                      10 Most Recent Facebook Posts
                    </h4>
                    <span className="text-xs text-gray-500 font-medium">
                      ({recentFbPosts.length} posts)
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsAddPostModalOpen(true)}
                      className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all"
                    >
                      <span>+ Add / Paste Facebook Post</span>
                    </button>
                  )}
                </div>

                {recentFbPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentFbPosts.map((post, index) => (
                      <div 
                        key={post.id || index}
                        className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Post Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1877F2] flex items-center justify-center font-bold text-xs shrink-0">
                                {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'FB'}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-gray-900 leading-tight">
                                  {post.authorName || (fbInfo.isGroup ? 'Class Facebook Member' : 'Class Facebook Page')}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {post.date ? formatDisplayDate(post.date) : 'Recent'}
                                </p>
                              </div>
                            </div>
                            <span className="bg-blue-50 text-[#1877F2] border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                              Post #{index + 1}
                            </span>
                          </div>

                          {/* Post Text */}
                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line break-words">
                            {post.content || post.title}
                          </p>

                          {/* Attached Photo */}
                          {post.imageUrl && (
                            <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 max-h-64 flex items-center justify-center cursor-pointer group relative" onClick={() => setEnlargedImageUrl(post.imageUrl || null)}>
                              <img 
                                src={post.imageUrl} 
                                alt="Facebook Post Media" 
                                className="w-full h-full object-cover max-h-64 transition-transform group-hover:scale-102 duration-200"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-900 text-[11px] font-bold px-2.5 py-1 rounded-full shadow transition-opacity">
                                  🔍 Click to Enlarge
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Post Footer Actions */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Read-Only Feed
                          </span>
                          <a
                            href={post.url || facebookPageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1877F2] hover:text-blue-800 font-bold inline-flex items-center gap-1 hover:underline text-xs"
                          >
                            <span>View on Facebook</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1877F2] mx-auto flex items-center justify-center font-bold text-xl">
                      f
                    </div>
                    <div className="max-w-md mx-auto space-y-1.5">
                      <h5 className="font-bold text-sm text-gray-900">No Facebook Posts Loaded Yet</h5>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        You can paste your Facebook Group / Page posts directly or enter a Facebook Access Token above to fetch them automatically.
                      </p>
                    </div>
                    {isAdmin ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddPostModalOpen(true)}
                          className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow inline-flex items-center gap-2 cursor-pointer"
                        >
                          <span>+ Add / Paste Facebook Post</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open('https://developers.facebook.com/tools/explorer/', '_blank')}
                          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                        >
                          <span>Graph API Explorer</span>
                          <span>↗</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 max-w-sm mx-auto">
                        Class Facebook posts will be visible once an Admin adds or synchronizes the latest posts.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 1-Click Launchers into key sections of the Facebook Group / Page */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1877F2]"></span>
                    Class Facebook Group Launchers
                  </h4>
                  <a
                    href={facebookPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1877F2] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>Open Main Page on Facebook</span>
                    <span>↗</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <a 
                    href={facebookPageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group block"
                  >
                    <div className="text-2xl mb-1.5">💬</div>
                    <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 flex items-center justify-between">
                      <span>Latest Posts & Wall</span>
                      <span className="text-gray-400 group-hover:text-blue-600 text-xs">↗</span>
                    </h5>
                    <p className="text-xs text-gray-500 mt-1">Browse all posts, discussions, and classmate threads live on Facebook</p>
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

      {/* Add / Paste Facebook Post Modal */}
      {isAddPostModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-y-auto max-h-[90vh] space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#1877F2] text-white font-black text-xs flex items-center justify-center">f</div>
                  <span>Add / Paste Facebook Post</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Paste content directly from your Facebook Group or Page to show in the 10 Recent Posts feed.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddPostModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePostFromDashboard} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Post Content / Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste the Facebook post text or announcement here..."
                  value={newPostData.content}
                  onChange={e => setNewPostData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full border-gray-300 rounded-xl text-xs p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Author / Poster Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe or Committee"
                    value={newPostData.authorName}
                    onChange={e => setNewPostData(prev => ({ ...prev, authorName: e.target.value }))}
                    className="w-full border-gray-300 rounded-lg text-xs p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Post Date
                  </label>
                  <input
                    type="date"
                    value={newPostData.date}
                    onChange={e => setNewPostData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full border-gray-300 rounded-lg text-xs p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Facebook Post Link / URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.facebook.com/groups/.../posts/..."
                  value={newPostData.url}
                  onChange={e => setNewPostData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full border-gray-300 rounded-lg text-xs p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Attached Photo / Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://... image link"
                  value={newPostData.imageUrl}
                  onChange={e => setNewPostData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full border-gray-300 rounded-lg text-xs p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddPostModalOpen(false)}
                  className="bg-gray-100 text-gray-800 py-2 px-4 rounded-xl hover:bg-gray-200 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  className="bg-[#1877F2] hover:bg-blue-700 text-white py-2 px-5 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <span>{isSavingPost ? 'Saving...' : 'Add Post to Feed'}</span>
                </button>
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
