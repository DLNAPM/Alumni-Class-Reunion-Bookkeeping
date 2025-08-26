import React, { useState, useMemo } from 'react';
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
  };

  const [filters, setFilters] = useState(initialFilters);
  
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
    const headers = ['ID', 'Date', 'Classmate Name', 'Category', 'Payment Type', 'Description', 'Amount'];
    const rows = filteredTransactions.map(t => 
      [t.id, t.date, `"${t.classmateName}"`, t.category, t.paymentType, `"${t.description.replace(/"/g, '""')}"`, t.amount].join(',')
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
                            <td className="px-4 py-2 whitespace-nowrap text-right font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(t.amount)}</td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-10 text-gray-500">No transactions match the current filters.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Reporting;