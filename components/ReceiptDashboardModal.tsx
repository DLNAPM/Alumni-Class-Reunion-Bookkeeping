import React, { useState, useMemo } from 'react';
import { Transaction, Classmate, PaymentCategory } from '../types';

interface ReceiptDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  classmateName: string;
  initialTransactionId?: string;
  classmates: Classmate[];
  transactions: Transaction[];
  logo: string;
  subtitle: string;
  currentClassId: string;
}

const ReceiptDashboardModal: React.FC<ReceiptDashboardModalProps> = ({
  isOpen,
  onClose,
  classmateName: initialClassmateName,
  initialTransactionId,
  classmates,
  transactions,
  logo,
  subtitle,
  currentClassId,
}) => {
  const [selectedClassmateName, setSelectedClassmateName] = useState<string>(initialClassmateName);
  const [selectedTxId, setSelectedTxId] = useState<string | undefined>(initialTransactionId);
  const [activeTab, setActiveTab] = useState<'receipt' | 'history' | 'email'>('receipt');
  
  // Email Composer State
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailNote, setEmailNote] = useState<string>('Thank you for your payment and support of our class ledger!');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Sync selected classmate when props change or modal opens
  React.useEffect(() => {
    setSelectedClassmateName(initialClassmateName);
    setSelectedTxId(initialTransactionId);
  }, [initialClassmateName, initialTransactionId, isOpen]);

  // Find classmate profile
  const classmateProfile = useMemo(() => {
    if (!selectedClassmateName) return null;
    return classmates.find(
      c => c.name.trim().toLowerCase() === selectedClassmateName.trim().toLowerCase()
    );
  }, [classmates, selectedClassmateName]);

  // Update default recipient email when classmate profile loads
  React.useEffect(() => {
    if (classmateProfile?.email) {
      setRecipientEmail(classmateProfile.email);
    } else {
      setRecipientEmail('');
    }
  }, [classmateProfile]);

  // Classmate's transactions
  const classmateTxs = useMemo(() => {
    if (!selectedClassmateName) return [];
    const normName = selectedClassmateName.trim().toLowerCase();
    return transactions.filter(
      t => t.classmateName && t.classmateName.trim().toLowerCase() === normName
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedClassmateName]);

  // Selected Transaction for individual receipt
  const selectedTx = useMemo(() => {
    if (selectedTxId) {
      const found = classmateTxs.find(t => t.id === selectedTxId);
      if (found) return found;
    }
    return classmateTxs[0] || null;
  }, [classmateTxs, selectedTxId]);

  // Financial Summary Metrics
  const summary = useMemo(() => {
    let total = 0;
    let dues = 0;
    let donations = 0;
    let events = 0;
    let other = 0;

    classmateTxs.forEach(t => {
      const amt = Number(t.amount) || 0;
      total += amt;
      if (t.category === PaymentCategory.Dues) dues += amt;
      else if (t.category === PaymentCategory.Donation) donations += amt;
      else if (t.category === PaymentCategory.Event) events += amt;
      else other += amt;
    });

    return { total, dues, donations, events, other, count: classmateTxs.length };
  }, [classmateTxs]);

  // Generate Shareable URL
  const shareableUrl = useMemo(() => {
    const origin = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    if (currentClassId) params.set('classId', currentClassId);
    if (selectedClassmateName) params.set('classmate', selectedClassmateName);
    if (selectedTx) params.set('txId', selectedTx.id);
    return `${origin}?${params.toString()}`;
  }, [currentClassId, selectedClassmateName, selectedTx]);

  // Update default email subject when selectedTx or classmateName changes
  React.useEffect(() => {
    const txDesc = selectedTx ? `Receipt #${selectedTx.id.slice(0, 8).toUpperCase()}` : 'Statement';
    setEmailSubject(`[${subtitle || 'Class Ledger'}] Official Payment ${txDesc} - ${selectedClassmateName}`);
  }, [selectedTx, selectedClassmateName, subtitle]);

  if (!isOpen) return null;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const generateEmailBodyText = () => {
    let text = `OFFICIAL PAYMENT STATEMENT & RECEIPT\n`;
    text += `=====================================\n`;
    text += `Class Ledger: ${subtitle} (${currentClassId})\n`;
    text += `Classmate: ${selectedClassmateName}\n`;
    if (recipientEmail) text += `Email: ${recipientEmail}\n`;
    text += `Date Generated: ${new Date().toLocaleDateString()}\n\n`;

    if (selectedTx) {
      text += `SELECTED TRANSACTION RECEIPT:\n`;
      text += `-------------------------------------\n`;
      text += `Receipt ID: RCP-${selectedTx.id.slice(0, 8).toUpperCase()}\n`;
      text += `Date: ${new Date(selectedTx.date).toLocaleDateString()}\n`;
      text += `Category: ${selectedTx.category}\n`;
      text += `Amount Paid: ${formatMoney(selectedTx.amount)}\n`;
      if (selectedTx.paymentType) text += `Payment Method: ${selectedTx.paymentType}\n`;
      if (selectedTx.transactionId) text += `Reference ID: ${selectedTx.transactionId}\n`;
      if (selectedTx.description) text += `Description: ${selectedTx.description}\n`;
      text += `Status: VERIFIED & RECORDED\n\n`;
    }

    text += `CUMULATIVE LEDGER SUMMARY:\n`;
    text += `-------------------------------------\n`;
    text += `Total Dues Paid: ${formatMoney(summary.dues)}\n`;
    text += `Total Donations: ${formatMoney(summary.donations)}\n`;
    text += `Total Event Fees: ${formatMoney(summary.events)}\n`;
    text += `TOTAL CONTRIBUTION: ${formatMoney(summary.total)}\n\n`;

    if (emailNote) {
      text += `Note from Administrator:\n"${emailNote}"\n\n`;
    }

    text += `View Online Receipt Dashboard:\n${shareableUrl}\n\n`;
    text += `Thank you,\nClass Treasurer & Administration`;
    return text;
  };

  const handleSendEmailClient = () => {
    const body = encodeURIComponent(generateEmailBodyText());
    const subject = encodeURIComponent(emailSubject);
    const mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${subject}&body=${body}`;
    window.open(mailto, '_blank');
  };

  const handleCopyEmailText = () => {
    navigator.clipboard.writeText(generateEmailBodyText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Distinct classmate list for dropdown selector
  const allClassmateNames = Array.from(
    new Set([
      ...classmates.map(c => c.name),
      ...transactions.map(t => t.classmateName)
    ])
  ).filter(Boolean).sort();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-gray-900 via-brand-primary to-gray-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {logo && logo !== 'https://via.placeholder.com/150' ? (
              <img src={logo} alt="Class Logo" className="w-12 h-12 rounded-xl object-cover bg-white p-1 border border-white/20 shadow-xs" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xl border border-white/20">
                🎓
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Classmate Receipt Dashboard</h2>
                <span className="bg-emerald-400/20 text-emerald-300 text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Official Record
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">{subtitle} • Class ID: <span className="font-mono font-bold text-white">{currentClassId}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Classmate Picker */}
            <div className="relative">
              <select
                value={selectedClassmateName}
                onChange={(e) => {
                  setSelectedClassmateName(e.target.value);
                  setSelectedTxId(undefined);
                }}
                className="bg-white/10 text-white text-xs font-semibold rounded-xl px-3 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
              >
                {allClassmateNames.map(name => (
                  <option key={name} value={name} className="bg-gray-800 text-white">
                    👤 {name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              title="Close Modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Classmate Summary Banner */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">{selectedClassmateName}</h3>
              {classmateProfile?.role && (
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-md">
                  {classmateProfile.role}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
              <span>✉️ {recipientEmail || 'No email registered'}</span>
              {classmateProfile?.phone && <span>📞 {classmateProfile.phone}</span>}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Paid</div>
              <div className="text-base sm:text-lg font-black text-brand-primary">{formatMoney(summary.total)}</div>
            </div>
            <div className="text-right border-l border-gray-200 pl-3 sm:pl-6">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transactions</div>
              <div className="text-base sm:text-lg font-bold text-gray-800">{summary.count}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Action Bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('receipt')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'receipt'
                  ? 'bg-white text-brand-primary shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📄 Single Receipt
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-brand-primary shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📜 Full Statement ({classmateTxs.length})
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'email'
                  ? 'bg-white text-brand-primary shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✉️ Share &amp; Email
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs"
              title="Copy shareable direct link to clipboard"
            >
              {copiedLink ? (
                <>
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-emerald-700 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-secondary active:scale-95 transition-all shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>Email Receipt</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs"
              title="Print Receipt"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">

          {/* TAB 1: SINGLE RECEIPT VIEW */}
          {activeTab === 'receipt' && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Select specific transaction dropdown if classmate has multiple */}
              {classmateTxs.length > 1 && (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Select Transaction:</label>
                  <select
                    value={selectedTx?.id || ''}
                    onChange={(e) => setSelectedTxId(e.target.value)}
                    className="border border-gray-300 rounded-lg text-xs font-medium py-1.5 px-3 focus:ring-brand-primary focus:border-brand-primary max-w-xs"
                  >
                    {classmateTxs.map(t => (
                      <option key={t.id} value={t.id}>
                        {new Date(t.date).toLocaleDateString()} - {t.category} - {formatMoney(t.amount)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTx ? (
                <div id="printable-receipt" className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 sm:p-8 relative overflow-hidden">
                  {/* Decorative Watermark Stamp */}
                  <div className="absolute -right-10 -bottom-10 opacity-[0.04] pointer-events-none select-none">
                    <svg className="w-80 h-80 text-brand-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </div>

                  {/* Top Receipt Header */}
                  <div className="border-b-2 border-gray-100 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">Official Payment Receipt</div>
                      <h3 className="text-2xl font-black text-gray-900">{subtitle}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Class Ledger ID: <strong className="text-gray-800">{currentClassId}</strong></p>
                    </div>
                    <div className="text-left sm:text-right bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Status</div>
                      <div className="text-sm font-extrabold text-emerald-700 flex items-center gap-1">
                        <span>✓</span> VERIFIED &amp; RECORDED
                      </div>
                      <div className="text-[11px] text-emerald-600 font-mono mt-0.5">
                        RCP-{selectedTx.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Receipt Details Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 text-sm">
                    <div>
                      <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Received From</span>
                      <span className="font-bold text-gray-900 text-base">{selectedClassmateName}</span>
                      {recipientEmail && <span className="block text-xs text-gray-500">{recipientEmail}</span>}
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Date</span>
                      <span className="font-bold text-gray-900 text-base">{new Date(selectedTx.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Category</span>
                      <span className="inline-block bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md text-xs border border-blue-200">
                        {selectedTx.category}
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Method</span>
                      <span className="font-semibold text-gray-800">
                        {selectedTx.paymentType || 'Standard Payment'}
                      </span>
                    </div>

                    {selectedTx.transactionId && (
                      <div className="col-span-2">
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reference / Transaction ID</span>
                        <span className="font-mono text-xs bg-gray-100 px-2.5 py-1 rounded border border-gray-200 text-gray-800">
                          {selectedTx.transactionId}
                        </span>
                      </div>
                    )}

                    {selectedTx.description && (
                      <div className="col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description / Memo</span>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{selectedTx.description}</p>
                      </div>
                    )}

                    {selectedTx.attachmentUrl && (
                      <div className="col-span-2">
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Proof Attachment</span>
                        <a
                          href={selectedTx.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-brand-primary font-bold hover:underline bg-brand-primary/10 px-3 py-1.5 rounded-lg"
                        >
                          📎 {selectedTx.attachmentName || 'View Attachment Document'}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Amount Callout */}
                  <div className="bg-gradient-to-r from-brand-primary/10 via-emerald-500/10 to-brand-primary/10 border-2 border-brand-primary/20 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Paid Amount</div>
                      <div className="text-xs text-gray-400">Recorded into class balance</div>
                    </div>
                    <div className="text-3xl font-black text-brand-primary">
                      {formatMoney(selectedTx.amount)}
                    </div>
                  </div>

                  {/* Footer Seal */}
                  <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                    <div>Generated via Class Dues Ledger</div>
                    <div>{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
                  <div className="text-3xl mb-2">📥</div>
                  <h4 className="text-lg font-bold text-gray-700">No Transactions Found</h4>
                  <p className="text-xs text-gray-500 mt-1">There are no payment records associated with {selectedClassmateName} yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL STATEMENT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Complete Ledger Statement</h3>
                    <p className="text-xs text-gray-500">All recorded financial contributions for {selectedClassmateName}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                    <span className="text-xs font-bold text-gray-500">Cumulative Total:</span>
                    <span className="text-lg font-black text-brand-primary">{formatMoney(summary.total)}</span>
                  </div>
                </div>

                {classmateTxs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {classmateTxs.map(t => (
                          <tr key={t.id} className={selectedTx?.id === t.id ? 'bg-blue-50/60 font-medium' : 'hover:bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-block bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">
                                {t.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{t.description || '-'}</td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.paymentType || '-'}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMoney(t.amount)}</td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedTxId(t.id);
                                  setActiveTab('receipt');
                                }}
                                className="text-xs text-brand-primary font-bold hover:underline"
                              >
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 text-xs">No transactions found.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SHARE & EMAIL COMPOSER */}
          {activeTab === 'email' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Email Receipt &amp; Share Link</h3>
                <p className="text-xs text-gray-500 mt-0.5">Send a detailed payment receipt directly to {selectedClassmateName} or copy the statement text &amp; URL.</p>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="classmate@example.com"
                    className="w-full border-gray-300 rounded-xl shadow-xs focus:ring-brand-primary focus:border-brand-primary text-sm p-2.5"
                  />
                  {!recipientEmail && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      ⚠️ No email registered for {selectedClassmateName}. Enter an email above to send directly via mail client.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full border-gray-300 rounded-xl shadow-xs focus:ring-brand-primary focus:border-brand-primary text-sm p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Personalized Note to Classmate
                  </label>
                  <textarea
                    rows={2}
                    value={emailNote}
                    onChange={e => setEmailNote(e.target.value)}
                    placeholder="Add an optional message..."
                    className="w-full border-gray-300 rounded-xl shadow-xs focus:ring-brand-primary focus:border-brand-primary text-xs p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Shareable Dashboard URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareableUrl}
                      className="flex-1 bg-gray-50 border-gray-300 rounded-xl text-xs font-mono p-2.5 text-gray-600 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {/* Email Content Preview Box */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Message Content Preview
                  </label>
                  <pre className="bg-gray-900 text-emerald-300 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed border border-gray-800">
                    {generateEmailBodyText()}
                  </pre>
                </div>

                {/* Send Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSendEmailClient}
                    className="flex-1 bg-brand-primary hover:bg-brand-secondary text-white py-3 px-6 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span>Open Mail Client &amp; Send</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyEmailText}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {copiedText ? (
                      <span className="text-emerald-700 font-extrabold">✓ Text Copied!</span>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        <span>Copy Email Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center text-xs text-gray-500">
          <span>Viewing: <strong>{selectedClassmateName}</strong></span>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-xl font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReceiptDashboardModal;
