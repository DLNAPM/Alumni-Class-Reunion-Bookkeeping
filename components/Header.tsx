
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { parseLocalDate, formatDisplayDate } from '../services/dateUtils';

interface HeaderProps {
  onHelpClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHelpClick }) => {
  const { user, subtitle, transactions } = useData();

  const { firstTransactionDate, lastTransactionDate } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { firstTransactionDate: null, lastTransactionDate: null };
    }
    const validTimestamps = transactions
      .map(t => {
        const parsed = parseLocalDate(t.date);
        return parsed ? parsed.getTime() : new Date(t.date).getTime();
      })
      .filter(ts => !isNaN(ts));

    if (validTimestamps.length === 0) {
      return { firstTransactionDate: null, lastTransactionDate: null };
    }

    const minTs = Math.min(...validTimestamps);
    const maxTs = Math.max(...validTimestamps);

    return {
      firstTransactionDate: formatDisplayDate(minTs),
      lastTransactionDate: formatDisplayDate(maxTs)
    };
  }, [transactions]);

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div>
        <h1 className="text-lg font-bold text-brand-primary">Alumni Bookkeeping</h1>
        <p className="text-sm text-gray-600 -mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onHelpClick}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
          aria-label="Help"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <div className="flex flex-col items-end">
            <div className="flex items-center">
                <span className="text-gray-600 mr-3 hidden sm:inline font-medium">Welcome, {user?.name}</span>
                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
            </div>
            {firstTransactionDate && (
                 <span className="text-[10px] text-gray-400 mt-1 mr-1 uppercase tracking-wider font-semibold">
                    First Recorded Transaction Date: {firstTransactionDate}
                 </span>
            )}
            {lastTransactionDate && (
                 <span className="text-[10px] text-gray-400 mt-0.5 mr-1 uppercase tracking-wider font-semibold">
                    Last Transaction Date: {lastTransactionDate}
                 </span>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
