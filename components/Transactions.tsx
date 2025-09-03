
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory, Transaction } from '../types';

const Transactions: React.FC = () => {
  const { transactions, user } = useData();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

  const userTransactions = useMemo(() => {
    if (!user?.name) {
      return [];
    }
    const userNameParts = user.name.toLowerCase().split(' ').filter(p => p); // Get non-empty parts

    return transactions.filter(t => {
      if (!t.classmateName) {
        return false;
      }
      const transactionNameLower = t.classmateName.toLowerCase();
      // Check if every part of the user's name is present in the transaction's classmateName
      return userNameParts.every(part => transactionNameLower.includes(part));
    });
  }, [transactions, user]);

  const filteredTransactions = useMemo(() => {
    return userTransactions.filter(t => filterCategory === 'all' || t.category === filterCategory);
  }, [userTransactions, filterCategory]);

  const sortedTransactions = useMemo(() => {
    let sortableItems = [...filteredTransactions];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredTransactions, sortConfig]);
  
  const requestSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Transaction) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-brand-text">My Transaction History</h2>
        <div className="mt-4 sm:mt-0">
          <label htmlFor="category-filter" className="sr-only">Filter by category</label>
          <select 
            id="category-filter"
            onChange={(e) => setFilterCategory(e.target.value)}
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm rounded-md"
          >
            <option value="all">All Categories</option>
            {Object.values(PaymentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('date')}>Date {getSortIndicator('date')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('description')}>Description {getSortIndicator('description')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('category')}>Category {getSortIndicator('category')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('transactionId')}>Transaction ID {getSortIndicator('transactionId')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('amount')}>Amount {getSortIndicator('amount')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={transaction.transactionId}>{transaction.transactionId || ''}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(transaction.amount)}</td>
              </tr>
            ))}
             {sortedTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">No transactions found for the selected criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;