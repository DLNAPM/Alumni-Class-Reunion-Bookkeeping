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
    deleteAnnouncement,
    addAnnouncement,
    facebookPageUrl,
    setFacebookPageUrl,
    syncFacebookPosts,
    currentClassId,
    subtitle
  } = useData();

  const isReadOnly = user?.role === 'Admin_ro';
  const isAdmin = user?.isAdmin && !isReadOnly;

  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<PaymentCategory[]>([PaymentCategory.Dues, PaymentCategory.Fundraiser]);
  
  // Facebook Announcements State
  const [feedViewMode, setFeedViewMode] = useState<'cards' | 'timeline'>('cards');
  const [isFbUrlModalOpen, setIsFbUrlModalOpen] = useState(false);
  const [fbUrlInput, setFbUrlInput] = useState(facebookPageUrl || '');
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [isSyncingPosts, setIsSyncingPosts] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [postSearchFilter, setPostSearchFilter] = useState('');

  // Keep input in sync with loaded data
  useEffect(() => {
    setFbUrlInput(facebookPageUrl || '');
  }, [facebookPageUrl]);

  // Parse Facebook details (Page vs Group)
  const fbInfo = useMemo(() => {
    return parseFacebookUrl(facebookPageUrl || '');
  }, [facebookPageUrl]);

  // New Post Form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'facebook' as 'text' | 'facebook',
    url: '',
    imageUrl: '',
    authorName: 'Reunion Committee'
  });

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

  // Last 10 Posts logic
  const last10Posts = useMemo(() => {
    let list = announcements.slice(0, 10);
    if (postSearchFilter.trim()) {
      const q = postSearchFilter.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.content?.toLowerCase().includes(q) ||
        p.url?.toLowerCase().includes(q) ||
        p.authorName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [announcements, postSearchFilter]);

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

  const handleManualSync = async () => {
    try {
      setIsSyncingPosts(true);
      setSyncStatusMsg(null);
      const count = await syncFacebookPosts(facebookPageUrl || fbUrlInput);
      setSyncStatusMsg(`Successfully loaded ${count} latest posts from Facebook!`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err) {
      console.error("Failed to sync posts:", err);
      setSyncStatusMsg("Failed to sync posts. Please check connection.");
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } finally {
      setIsSyncingPosts(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim()) return;

    try {
      const payload: Omit<Announcement, 'id' | 'date' | 'classId'> = {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        type: newPost.type,
        authorName: newPost.authorName?.trim() || 'Class Admin'
      };
      if (newPost.type === 'facebook' && newPost.url) {
        payload.url = newPost.url.trim();
      }
      if (newPost.imageUrl?.trim()) {
        payload.imageUrl = newPost.imageUrl.trim();
      }

      await addAnnouncement(payload);
      setNewPost({ 
        title: '', 
        content: '', 
        type: 'facebook', 
        url: '', 
        imageUrl: '',
        authorName: 'Reunion Committee' 
      });
      setIsAddPostModalOpen(false);
    } catch (err) {
      console.error("Failed to add post:", err);
    }
  };

  const handleCopyPostLink = (post: Announcement) => {
    const link = post.url || facebookPageUrl || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2500);
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
      {/* REVAMPED ANNOUNCEMENTS: CLASS FACEBOOK PAGE/GROUP & LAST 10 POSTS         */}
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
                    Class Announcements & Facebook Feed
                  </h3>
                  <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {fbInfo.isGroup ? 'Class Group' : 'Official Page'}
                  </span>
                  <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Last 10 Posts
                  </span>
                </div>
                <p className="text-blue-100/90 text-xs sm:text-sm mt-1">
                  {facebookPageUrl 
                    ? `Connected to ${fbInfo.isGroup ? `Facebook Group #${fbInfo.groupIdOrName || 'Class Group'}` : (subtitle || 'Class Page')} with 100+ members & updates`
                    : "Connect your Class Facebook Page or Group URL to stream the last 10 posts directly to classmates"}
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
                  className="bg-white text-[#1877F2] hover:bg-blue-50 font-bold text-xs px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md hover:shadow"
                >
                  <span>{fbInfo.isGroup ? 'Open Facebook Group' : 'Visit Facebook Page'}</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncingPosts}
                    className="bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 backdrop-blur-sm disabled:opacity-50 shadow-sm"
                    title="Sync / Refresh 10 latest posts from Facebook"
                  >
                    <svg className={`w-3.5 h-3.5 ${isSyncingPosts ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span>{isSyncingPosts ? 'Syncing...' : 'Sync FB Posts'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setFbUrlInput(facebookPageUrl || '');
                      setIsFbUrlModalOpen(true);
                    }}
                    className="bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 backdrop-blur-sm shadow-sm"
                    title="Edit Class Facebook URL"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{facebookPageUrl ? 'Edit URL' : 'Set URL'}</span>
                  </button>

                  <button
                    onClick={() => setIsAddPostModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
                    title="Publish Announcement or Facebook Post"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <span>Add Post</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sync Status Banner */}
          {syncStatusMsg && (
            <div className="mt-3 bg-white/20 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              <span>{syncStatusMsg}</span>
            </div>
          )}

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

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setFeedViewMode('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  feedViewMode === 'cards'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                📰 Post Feed ({last10Posts.length})
              </button>
              {facebookPageUrl && (
                <button
                  onClick={() => setFeedViewMode('timeline')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    feedViewMode === 'timeline'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  {fbInfo.isGroup ? '👥 Group Hub' : '🌐 Live Timeline'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Unconfigured Alert for Admin */}
          {!facebookPageUrl && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📢</span>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Connect Your Class Facebook Page or Group</h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Enter the URL of your Class Facebook Page or Facebook Group (e.g. <code>https://www.facebook.com/groups/137851679602885</code>) to automatically display the last 10 posts and updates directly here.
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

          {/* Group Header Info Card (when group URL is configured) */}
          {facebookPageUrl && fbInfo.isGroup && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  👥
                </div>
                <div>
                  <h4 className="font-bold text-sm text-blue-950 flex items-center gap-2">
                    Facebook Group #{fbInfo.groupIdOrName || 'Class Group'}
                    <span className="bg-blue-200/80 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      100+ Class Posts & Discussions
                    </span>
                  </h4>
                  <p className="text-xs text-blue-800/80 mt-0.5">
                    Streaming the latest 10 posts, committee announcements, and event discussions from the class group wall.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1"
                >
                  View Group Wall ↗
                </a>
              </div>
            </div>
          )}

          {/* View Mode: Group Hub / Page Timeline */}
          {feedViewMode === 'timeline' && facebookPageUrl && (
            <div className="space-y-4">
              {fbInfo.isGroup ? (
                /* Interactive Facebook Group Portal */
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                      <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#1877F2]"></span>
                        Official Facebook Class Group Hub
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Group ID: <strong className="text-gray-800">{fbInfo.groupIdOrName}</strong> • Over 100 posts, photos, and reunion announcements
                      </p>
                    </div>
                    <a
                      href={facebookPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow inline-flex items-center gap-1.5 self-start md:self-auto"
                    >
                      <span>Join & View Group on Facebook</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <a 
                      href={facebookPageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="text-2xl mb-1">💬</div>
                      <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600">Discussion Feed</h5>
                      <p className="text-xs text-gray-500 mt-0.5">Read recent classmate threads and reminisce</p>
                    </a>

                    <a 
                      href={`${facebookPageUrl}/photos`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="text-2xl mb-1">📸</div>
                      <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600">Photo Albums</h5>
                      <p className="text-xs text-gray-500 mt-0.5">View senior photos, picnic albums & reunions</p>
                    </a>

                    <a 
                      href={`${facebookPageUrl}/events`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="text-2xl mb-1">📅</div>
                      <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600">Class Events</h5>
                      <p className="text-xs text-gray-500 mt-0.5">RSVP for banquets, tailgates & fundraisers</p>
                    </a>

                    <a 
                      href={`${facebookPageUrl}/members`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="text-2xl mb-1">👥</div>
                      <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600">Group Members</h5>
                      <p className="text-xs text-gray-500 mt-0.5">Connect with registered alumni & classmates</p>
                    </a>
                  </div>
                </div>
              ) : (
                /* Facebook Page Plugin Iframe (for standard Facebook Pages) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2]"></span>
                      Official Facebook Page Timeline Plugin
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

          {/* View Mode: Cards List (Last 10 Posts) */}
          {feedViewMode === 'cards' && (
            <div className="space-y-4">
              {/* Search & Counter Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-800">
                    Latest Class Posts & Facebook Updates
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {last10Posts.length} of {announcements.length} {announcements.length === 1 ? 'post' : 'posts'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {announcements.length > 2 && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search posts..."
                        value={postSearchFilter}
                        onChange={e => setPostSearchFilter(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 w-full sm:w-56 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                  )}

                  {isAdmin && announcements.length > 0 && (
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncingPosts}
                      className="text-xs text-[#1877F2] hover:text-blue-800 font-bold px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
                    >
                      <svg className={`w-3.5 h-3.5 ${isSyncingPosts ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      <span>{isSyncingPosts ? 'Syncing...' : 'Sync Posts'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* List of Last 10 Posts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {last10Posts.map((ann, index) => {
                  const isFbPost = ann.type === 'facebook' || !!facebookPageUrl;
                  const handleDelete = () => {
                    if (window.confirm(`Are you sure you want to delete "${ann.title}"?`)) {
                      deleteAnnouncement(ann.id);
                    }
                  };

                  const postDirectUrl = ann.url || facebookPageUrl || `https://www.facebook.com/groups/${fbInfo.groupIdOrName || '137851679602885'}`;

                  return (
                    <div 
                      key={ann.id} 
                      className="bg-white hover:bg-gray-50/50 border border-gray-200/90 rounded-2xl p-5 relative group transition-all duration-200 hover:shadow-lg flex flex-col justify-between"
                    >
                      {/* Top Meta */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                              f
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-900">
                                  {ann.authorName || (fbInfo.isGroup ? `Class Group #${fbInfo.groupIdOrName || '137851679602885'}` : 'Reunion Committee')}
                                </span>
                                <span className="text-[10px] font-bold bg-blue-100 text-[#1877F2] px-1.5 py-0.2 rounded">
                                  #{index + 1}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400">
                                {formatDisplayDate(ann.date)} • Facebook Post
                              </p>
                            </div>
                          </div>

                          {isAdmin && (
                            <button 
                              onClick={handleDelete} 
                              className="text-gray-400 hover:text-danger p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete post"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </button>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-base text-gray-950 leading-snug">
                          {ann.title}
                        </h4>

                        {/* Content text */}
                        {ann.content && (
                          <p className="text-sm text-gray-700 mt-2.5 whitespace-pre-line leading-relaxed">
                            {ann.content}
                          </p>
                        )}

                        {/* Image attachment */}
                        {ann.imageUrl && (
                          <div className="mt-3.5 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                            <img 
                              src={ann.imageUrl} 
                              alt={ann.title} 
                              className="w-full max-h-60 object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                              onClick={() => setEnlargedImageUrl(ann.imageUrl || null)}
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <a
                            href={postDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1877F2] hover:text-blue-800 font-bold inline-flex items-center gap-1 hover:underline"
                          >
                            <span>{fbInfo.isGroup ? 'View in Facebook Group' : 'View on Facebook'}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyPostLink(ann)}
                          className="text-gray-500 hover:text-gray-800 font-semibold inline-flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {copiedPostId === ann.id ? (
                            <span className="text-emerald-600 font-bold">✓ Copied!</span>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              <span>Share Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Zero State (When 0 posts are loaded) */}
              {last10Posts.length === 0 && (
                <div className="text-center py-12 px-6 border-2 border-dashed border-blue-200 rounded-3xl bg-blue-50/40 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#1877F2] text-white mx-auto flex items-center justify-center font-extrabold text-3xl shadow-md ring-4 ring-blue-100">
                    f
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {facebookPageUrl 
                        ? (fbInfo.isGroup ? `Facebook Group #${fbInfo.groupIdOrName || 'Connected'}` : 'Facebook Page Connected')
                        : 'Class Facebook Page URL'}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-lg mx-auto leading-relaxed">
                      {facebookPageUrl
                        ? `Your class Facebook feed (${facebookPageUrl}) has 100+ active posts. Click below to load and stream the last 10 posts on this dashboard.`
                        : `Connect your Class Facebook Group or Page to display the last 10 posts for all classmates.`}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    {facebookPageUrl ? (
                      <button
                        onClick={handleManualSync}
                        disabled={isSyncingPosts}
                        className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                      >
                        <svg className={`w-4 h-4 ${isSyncingPosts ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        <span>{isSyncingPosts ? 'Loading 10 Posts...' : 'Load 10 Latest Facebook Posts'}</span>
                      </button>
                    ) : (
                      isAdmin && (
                        <button
                          onClick={() => {
                            setFbUrlInput('');
                            setIsFbUrlModalOpen(true);
                          }}
                          className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-colors"
                        >
                          Connect Facebook URL
                        </button>
                      )
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => setIsAddPostModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors"
                      >
                        Add Custom Post
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE CLASS FACEBOOK PAGE URL                                 */}
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
                  <h3 className="font-bold text-base text-gray-900">Configure Class Facebook URL</h3>
                  <p className="text-xs text-gray-500">Supports Facebook Groups (with 100+ posts) and Pages</p>
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
                  Facebook Page or Group URL *
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
                  Automatic Last 10 Posts Sync
                </p>
                <p className="text-blue-800 leading-relaxed">
                  Saving your Facebook Group/Page URL will automatically populate the last 10 posts onto the Dashboard feed with direct links back to your Facebook Group wall.
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
                    {isSavingUrl ? 'Saving...' : 'Save & Sync Posts'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PUBLISH NEW ANNOUNCEMENT / FACEBOOK POST                          */}
      {/* ========================================================================= */}
      {isAddPostModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-900">Publish Post to Dashboard Feed</h3>
                <p className="text-xs text-gray-500">Will appear in the latest 10 posts feed</p>
              </div>
              <button 
                onClick={() => setIsAddPostModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Post Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 35th Reunion Banquet Updates"
                  value={newPost.title}
                  onChange={e => setNewPost({...newPost, title: e.target.value})}
                  className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Post Type
                  </label>
                  <select
                    value={newPost.type}
                    onChange={e => setNewPost({...newPost, type: e.target.value as 'text' | 'facebook'})}
                    className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5"
                  >
                    <option value="facebook">Facebook Group / Page Post</option>
                    <option value="text">General Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Author / Committee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reunion Committee"
                    value={newPost.authorName}
                    onChange={e => setNewPost({...newPost, authorName: e.target.value})}
                    className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5"
                  />
                </div>
              </div>

              {newPost.type === 'facebook' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Facebook Post URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.facebook.com/groups/137851679602885/posts/..."
                    value={newPost.url}
                    onChange={e => setNewPost({...newPost, url: e.target.value})}
                    className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Content / Message Details
                </label>
                <textarea
                  placeholder="Write the post caption, timeline updates, or details here..."
                  value={newPost.content}
                  onChange={e => setNewPost({...newPost, content: e.target.value})}
                  className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newPost.imageUrl}
                  onChange={e => setNewPost({...newPost, imageUrl: e.target.value})}
                  className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-colors"
                >
                  Publish Post
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
