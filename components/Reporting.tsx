
import React, { useState, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { useData } from '../context/DataContext';
import { PaymentCategory, Transaction, PaymentType } from '../types';

const Reporting: React.FC = () => {
  const { transactions } = useData();

  const initialFilters = {
    startDate: '',
    endDate: '',
    classmateName: '',
    categories: [] as PaymentCategory[],
    minAmount: '',
    maxAmount: '',
    description: '',
    paymentTypes: [] as PaymentType[],
    transactionId: '',
  };

  const [filters, setFilters] = useState(initialFilters);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value as PaymentCategory);
    setFilters(prev => ({ ...prev, categories: selectedOptions }));
  };
  
  const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value as PaymentType);
    setFilters(prev => ({ ...prev, paymentTypes: selectedOptions }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate && transactionDate < startDate) return false;
      if (endDate && transactionDate > endDate) return false;
      if (filters.classmateName && !t.classmateName.toLowerCase().includes(filters.classmateName.toLowerCase())) return false;
      if (filters.description && !t.description.toLowerCase().includes(filters.description.toLowerCase())) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(t.category)) return false;
      if (filters.paymentTypes.length > 0 && !filters.paymentTypes.includes(t.paymentType)) return false;
      if (filters.minAmount && t.amount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && t.amount > parseFloat(filters.maxAmount)) return false;
      if (filters.transactionId && (!t.transactionId || !t.transactionId.toLowerCase().includes(filters.transactionId.toLowerCase()))) return false;
      
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  const summary = useMemo(() => {
    return {
      count: filteredTransactions.length,
      totalAmount: filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    };
  }, [filteredTransactions]);

  const exportToCsv = () => {
    const headers = ['ID', 'Date', 'Classmate Name', 'Category', 'Payment Type', 'Description', 'Transaction ID', 'Amount'];
    const rows = filteredTransactions.map(t => 
      [t.id, t.date, `"${t.classmateName}"`, t.category, t.paymentType, `"${t.description.replace(/"/g, '""')}"`, t.transactionId || '', t.amount].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addRecipient = () => {
    const email = emailInput.trim();
    if (email && isValidEmail(email) && !recipients.includes(email)) {
      setRecipients([...recipients, email]);
      setEmailInput('');
    }
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      addRecipient();
    }
  };

  const removeRecipient = (indexToRemove: number) => {
    setRecipients(recipients.filter((_, index) => index !== indexToRemove));
  };
  
  const handleGenerateEmail = async () => {
      if (recipients.length === 0 || filteredTransactions.length === 0) return;
      
      setIsGeneratingEmail(true);
      setError(null);
      
      try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
          setError("Configuration Error: The API_KEY is not set. Please ask the administrator to configure it in the deployment settings.");
          setIsGeneratingEmail(false);
          return;
        }
        
        const ai = new GoogleGenAI({ apiKey });
        const transactionsForPrompt = filteredTransactions.slice(0, 50).map(t => ({
          Date: t.date,
          Classmate: t.classmateName,
          Description: t.description,
          Category: t.category,
          Amount: t.amount.toFixed(2)
        }));

        const prompt = `
          Generate a professional email draft for an alumni association bookkeeper.
          The purpose of the email is to share a filtered transaction report.

          The report summary is:
          - Total Transactions: ${summary.count}
          - Total Amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.totalAmount)}
          - Date Range: ${filters.startDate || 'N/A'} to ${filters.endDate || 'N/A'}

          The email should contain:
          1. A clear subject line.
          2. A polite opening.
          3. The report summary.
          4. A statement mentioning that the top 50 transactions are included below and the full report can be exported as a CSV.
          5. A markdown table of the transaction data provided.
          6. A professional closing.

          Here is the transaction data (JSON format):
          ${JSON.stringify(transactionsForPrompt, null, 2)}
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  body: { type: Type.STRING },
                },
                required: ['subject', 'body'],
              },
            }
        });

        const text = response.text;
        const parsedEmail = JSON.parse(text);

        setGeneratedEmail(parsedEmail);
        setIsEmailModalOpen(true);
      } catch(e) {
        console.error("Error generating email:", e);
        setError("Failed to generate the email. Please check your connection and try again.");
      } finally {
        setIsGeneratingEmail(false);
      }
  };

  const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
    return <button onClick={handleCopy} className={`text-sm px-3 py-1 rounded ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{copied ? 'Copied!' : 'Copy'}</button>;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-brand-text">Advanced Transaction Reporting</h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="border-gray-300 rounded-md shadow-sm" title="Start Date" />
          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="border-gray-300 rounded-md shadow-sm" title="End Date" />
          <input type="text" name="classmateName" placeholder="Classmate Name..." value={filters.classmateName} onChange={handleFilterChange} className="border-gray-300 rounded-md shadow-sm" />
          <input type="text" name="description" placeholder="Description contains..." value={filters.description} onChange={handleFilterChange} className="border-gray-300 rounded-md shadow-sm" />
          <input type="text" name="transactionId" placeholder="Transaction ID..." value={filters.transactionId} onChange={handleFilterChange} className="border-gray-300 rounded-md shadow-sm" />
          <div className="flex gap-2">
            <input type="number" name="minAmount" placeholder="Min Amount" value={filters.minAmount} onChange={handleFilterChange} className="w-1/2 border-gray-300 rounded-md shadow-sm" min="0" />
            <input type="number" name="maxAmount" placeholder="Max Amount" value={filters.maxAmount} onChange={handleFilterChange} className="w-1/2 border-gray-300 rounded-md shadow-sm" min="0" />
          </div>
          <select multiple name="categories" value={filters.categories} onChange={handleCategoryChange} className="border-gray-300 rounded-md shadow-sm h-24">
            {Object.values(PaymentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select multiple name="paymentTypes" value={filters.paymentTypes} onChange={handlePaymentTypeChange} className="border-gray-300 rounded-md shadow-sm h-24" title="Payment Type">
            {Object.values(PaymentType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
          </select>
        </div>
         <div className="flex gap-4 mt-4">
            <button onClick={resetFilters} className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">Reset Filters</button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="sm:flex sm:items-center sm:justify-between mb-4">
            <div>
                <h3 className="text-xl font-semibold">Results</h3>
                <p className="text-sm text-gray-600">
                    Found <strong>{summary.count}</strong> transactions totaling <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.totalAmount)}</strong>.
                </p>
            </div>
            <button onClick={exportToCsv} className="mt-4 sm:mt-0 bg-success text-white py-2 px-4 rounded-md hover:bg-green-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                Export to CSV
            </button>
        </div>
        <div className="overflow-x-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Classmate</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map(t => (
                        <tr key={t.id}>
                            <td className="px-4 py-2 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{t.classmateName}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{t.category}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs">{t.paymentType}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-600 truncate max-w-xs">{t.description}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-500 truncate max-w-xs" title={t.transactionId}>{t.transactionId || ''}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-right font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(t.amount)}</td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-500">No transactions match the current filters.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Email Report</h3>
        <div className="space-y-4">
            <div>
                <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md">
                    {recipients.map((email, index) => (
                        <div key={index} className="flex items-center gap-2 bg-brand-accent/20 text-brand-primary text-sm font-medium px-2 py-1 rounded-full">
                            {email}
                            <button onClick={() => removeRecipient(index)} className="text-brand-primary hover:text-red-500">&times;</button>
                        </div>
                    ))}
                    <input
                        type="email"
                        id="recipients"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={handleEmailInputKeyDown}
                        onBlur={addRecipient}
                        placeholder="Add email and press Enter..."
                        className="flex-grow p-1 border-0 focus:ring-0"
                    />
                </div>
                 <p className="mt-1 text-xs text-gray-500">Add emails by pressing Enter, space, or comma.</p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
                onClick={handleGenerateEmail}
                disabled={isGeneratingEmail || recipients.length === 0 || filteredTransactions.length === 0}
                className="w-full sm:w-auto bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isGeneratingEmail ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : "Generate Email Draft"}
            </button>
        </div>
      </div>
      
      {isEmailModalOpen && generatedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Email Preview</h3>
                    <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Recipients:</span>
                        <span className="text-sm text-gray-700">{recipients.join(', ')}</span>
                      </div>
                      <CopyButton textToCopy={recipients.join(', ')} />
                    </div>
                     <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Subject: <span className="font-normal">{generatedEmail.subject}</span></h4>
                        <CopyButton textToCopy={generatedEmail.subject} />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-sm">Body:</h4>
                            <CopyButton textToCopy={generatedEmail.body} />
                        </div>
                        <div className="prose prose-sm max-w-none border rounded-md p-4 bg-gray-50 whitespace-pre-wrap">
                            {generatedEmail.body}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t text-right">
                    <button onClick={() => setIsEmailModalOpen(false)} className="bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary">Close</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Reporting;
