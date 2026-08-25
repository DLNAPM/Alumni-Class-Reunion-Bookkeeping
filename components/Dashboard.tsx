
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory, Announcement } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getYearFromDateString, formatDisplayDate } from '../services/dateUtils';

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
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [postSearchFilter, setPostSearchFilter] = useState('');

  // New Post Form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'facebook' as 'text' | 'facebook',
    url: '',
    imageUrl: ''
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
      // Logic: (Simple-Deposit + Bereavement + Classmate Support + Benevolence)
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
        p.url?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [announcements, postSearchFilter]);

  const handleSaveFacebookUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingUrl(true);
      await setFacebookPageUrl(fbUrlInput.trim());
      setIsFbUrlModalOpen(false);
    } catch (err) {
      console.error("Failed to save Facebook Page URL:", err);
    } finally {
      setIsSavingUrl(false);
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
      };
      if (newPost.type === 'facebook' && newPost.url) {
        payload.url = newPost.url.trim();
      }
      if (newPost.imageUrl?.trim()) {
        payload.imageUrl = newPost.imageUrl.trim();
      }

      await addAnnouncement(payload);
      setNewPost({ title: '', content: '', type: 'facebook', url: '', imageUrl: '' });
      setIsAddPostModalOpen(false);
    } catch (err) {
      console.error("Failed to add post:", err);
    }
  };

  const handleCopyPostLink = (post: Announcement) => {
    const link = post.url || window.location.href;
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
      {/* REVAMPED ANNOUNCEMENTS: CLASS FACEBOOK PAGE & LAST 10 POSTS               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-5 sm:p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#1877F2] text-white flex items-center justify-center font-bold text-2xl shadow-lg ring-2 ring-white/20">
                f
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Class Announcements & Facebook Feed
                  </h3>
                  <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Last 10 Posts
                  </span>
                </div>
                <p className="text-blue-100/80 text-xs sm:text-sm mt-0.5">
                  {facebookPageUrl 
                    ? `Streaming official updates from ${subtitle || `Class ${currentClassId}`}`
                    : "Connect your Class Facebook Page URL to stream the latest posts and reunions"}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {facebookPageUrl && (
                <a
                  href={facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all inline-flex items-center gap-1.5 backdrop-blur-sm"
                >
                  <span>Visit Facebook Page</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setFbUrlInput(facebookPageUrl || '');
                      setIsFbUrlModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all inline-flex items-center gap-1.5 shadow"
                    title="Configure Class Facebook Page URL"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{facebookPageUrl ? 'Edit FB URL' : 'Set FB Page URL'}</span>
                  </button>

                  <button
                    onClick={() => setIsAddPostModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all inline-flex items-center gap-1.5 shadow"
                    title="Publish Announcement or Facebook Post"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <span>Add Post</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Connected Facebook Page Status Bar */}
          <div className="mt-4 pt-3 border-t border-blue-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {facebookPageUrl ? (
                <span className="text-blue-100 truncate max-w-md">
                  Connected Page: <strong className="text-white underline">{facebookPageUrl}</strong>
                </span>
              ) : (
                <span className="text-amber-200 font-medium">
                  Class Facebook Page URL is not set yet.
                </span>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg self-start sm:self-auto">
              <button
                onClick={() => setFeedViewMode('cards')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
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
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    feedViewMode === 'timeline'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  🌐 Live FB Timeline
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Unconfigured Alert for Admin */}
          {!facebookPageUrl && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📢</span>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Connect Your Class Facebook Page</h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Admins can enter the URL of the Class Facebook Page to automatically stream the last 10 posts, pictures, and official announcements directly to all classmates here.
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    setFbUrlInput('');
                    setIsFbUrlModalOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap shadow transition-colors"
                >
                  Enter Facebook URL
                </button>
              )}
            </div>
          )}

          {/* View Mode: Live FB Timeline Embed */}
          {feedViewMode === 'timeline' && facebookPageUrl && (
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

          {/* View Mode: Cards List (Last 10 Posts) */}
          {feedViewMode === 'cards' && (
            <div className="space-y-4">
              {/* Search & Counter Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-800">
                    Latest Class Posts & Facebook Updates
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {last10Posts.length} {last10Posts.length === 1 ? 'post' : 'posts'} displayed
                  </span>
                </div>

                {announcements.length > 3 && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search announcements..."
                      value={postSearchFilter}
                      onChange={e => setPostSearchFilter(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 w-full sm:w-60 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                )}
              </div>

              {/* List of Last 10 Posts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {last10Posts.map((ann, index) => {
                  const isFbPost = ann.type === 'facebook';
                  const handleDelete = () => {
                    if (window.confirm(`Are you sure you want to delete "${ann.title}"?`)) {
                      deleteAnnouncement(ann.id);
                    }
                  };

                  return (
                    <div 
                      key={ann.id} 
                      className="bg-gray-50/70 hover:bg-gray-50 border border-gray-200/80 rounded-2xl p-5 relative group transition-all duration-200 hover:shadow-md flex flex-col justify-between"
                    >
                      {/* Top Meta */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                              isFbPost ? 'bg-[#1877F2] text-white' : 'bg-brand-primary text-white'
                            }`}>
                              {isFbPost ? 'f' : '📣'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-800">
                                  {isFbPost ? 'Class Facebook Post' : 'Class Announcement'}
                                </span>
                                <span className="text-[10px] font-semibold bg-gray-200/80 text-gray-600 px-1.5 py-0.2 rounded">
                                  #{index + 1}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400">
                                {formatDisplayDate(ann.date)}
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
                        <h4 className="font-bold text-base text-gray-900 leading-snug">
                          {ann.title}
                        </h4>

                        {/* Content text */}
                        {ann.content && (
                          <p className="text-sm text-gray-700 mt-2 whitespace-pre-line leading-relaxed">
                            {ann.content}
                          </p>
                        )}

                        {/* Embedded Facebook post iframe (if specific URL provided) */}
                        {isFbPost && ann.url && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-blue-100 bg-white p-2">
                            <div className="w-full overflow-hidden flex justify-center">
                              <iframe
                                title={ann.title}
                                src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(ann.url)}&show_text=true&width=450`}
                                width="450"
                                height="420"
                                style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }}
                                scrolling="no"
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                allowFullScreen={true}
                                className="rounded-lg"
                              ></iframe>
                            </div>
                          </div>
                        )}

                        {/* Image attachment */}
                        {ann.imageUrl && !isFbPost && (
                          <div className="mt-3 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                            <img 
                              src={ann.imageUrl} 
                              alt={ann.title} 
                              className="w-full max-h-56 object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                              onClick={() => setEnlargedImageUrl(ann.imageUrl || null)}
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {ann.url ? (
                            <a
                              href={ann.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1877F2] hover:text-blue-800 font-bold inline-flex items-center gap-1"
                            >
                              <span>View on Facebook</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                          ) : facebookPageUrl ? (
                            <a
                              href={facebookPageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1877F2] hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                            >
                              <span>Class Page</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                          ) : (
                            <span className="text-gray-400">Class Bulletin</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyPostLink(ann)}
                          className="text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1 py-1 px-2 rounded hover:bg-gray-200/60 transition-colors"
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

              {/* Zero State */}
              {last10Posts.length === 0 && (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-[#1877F2] mx-auto flex items-center justify-center font-bold text-3xl mb-3 shadow-inner">
                    f
                  </div>
                  <h4 className="text-base font-bold text-gray-800">No Posts in Feed Yet</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                    {facebookPageUrl
                      ? `Your Facebook Page is connected. Switch to the 'Live FB Timeline' tab above or publish new announcements to feature up to 10 posts here.`
                      : `Enter the URL of the Class Facebook Page to stream recent posts, reunions, and photo updates.`}
                  </p>

                  <div className="mt-5 flex justify-center gap-3">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setFbUrlInput(facebookPageUrl || '');
                            setIsFbUrlModalOpen(true);
                          }}
                          className="bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition-colors"
                        >
                          {facebookPageUrl ? 'Edit Facebook URL' : 'Connect Facebook Page URL'}
                        </button>
                        <button
                          onClick={() => setIsAddPostModalOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition-colors"
                        >
                          Add Post
                        </button>
                      </>
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
                  <h3 className="font-bold text-base text-gray-900">Configure Class Facebook Page URL</h3>
                  <p className="text-xs text-gray-500">Connects the Dashboard to your class's Facebook feed</p>
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
                  Facebook Page or Group URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.facebook.com/YourClassPage"
                  value={fbUrlInput}
                  onChange={e => setFbUrlInput(e.target.value)}
                  className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Example: <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">https://www.facebook.com/WestHigh89</code>
                </p>
              </div>

              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1 text-blue-950">
                  <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  What happens when you save this?
                </p>
                <p className="text-blue-800 leading-relaxed">
                  The Dashboard will display the latest 10 posts and allow classmates to view the live Facebook Timeline stream directly inside the app.
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

      {/* ========================================================================= */}
      {/* MODAL: PUBLISH NEW ANNOUNCEMENT / FACEBOOK POST                          */}
      {/* ========================================================================= */}
      {isAddPostModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-900">Publish Post to Dashboard Feed</h3>
                <p className="text-xs text-gray-500">Will be featured in the last 10 posts feed</p>
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Post Type
                </label>
                <select
                  value={newPost.type}
                  onChange={e => setNewPost({...newPost, type: e.target.value as 'text' | 'facebook'})}
                  className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5"
                >
                  <option value="facebook">Facebook Post / Media Link</option>
                  <option value="text">General Text Announcement</option>
                </select>
              </div>

              {newPost.type === 'facebook' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Facebook Post URL *
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.facebook.com/username/posts/12345"
                    value={newPost.url}
                    onChange={e => setNewPost({...newPost, url: e.target.value})}
                    className="w-full border-gray-300 rounded-xl shadow-sm text-sm px-3.5 py-2.5"
                    required={newPost.type === 'facebook'}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Content / Summary
                </label>
                <textarea
                  placeholder="Write the post caption or details here..."
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
                  placeholder="https://example.com/reunion-flyer.jpg"
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
