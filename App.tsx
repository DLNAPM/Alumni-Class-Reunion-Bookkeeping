import React, { useState, useMemo, useCallback } from 'react';
import { DataProvider } from './context/DataContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MakePayment from './components/MakePayment';
import Transactions from './components/Transactions';
import Admin from './components/Admin';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import type { User, Transaction, Announcement, PaymentCategory } from './types';
import { generateMockTransactions } from './services/mockData';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [logo, setLogo] = useState<string>('https://picsum.photos/seed/alumni/100/100');
  const [subtitle, setSubtitle] = useState<string>('A.E. Beach High C/o 89 Bulldogs');
  const [currentPage, setCurrentPage] = useState('dashboard');

  const [transactions, setTransactions] = useState<Transaction[]>(generateMockTransactions());
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: 'Upcoming Class Reunion!',
      content: 'Join us for our 20-year reunion on October 15th! Early bird tickets are now available. A down payment of $50 is required by August 31st to secure your spot. We can\'t wait to see you there!',
      date: '2024-07-15',
    },
    {
      id: 2,
      title: 'Class Fundraiser for John Doe',
      content: 'We are raising funds to support our classmate John Doe during a difficult time. Any donation, big or small, is greatly appreciated.',
      date: '2024-06-20',
    },
  ]);

  const handleLogin = (isAdmin: boolean) => {
    setUser({
      id: '123',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      isAdmin,
    });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...transaction, id: prev.length > 0 ? Math.max(...prev.map(t => t.id)) + 1 : 1 }, ...prev]);
  }, []);
  
  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  }, []);

  const deleteTransaction = useCallback((transactionId: number) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, []);

  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id'>) => {
    setAnnouncements(prev => [{ ...announcement, id: prev.length + 1 }, ...prev]);
  }, []);

  const dataProviderValue = useMemo(() => ({
    user,
    logo,
    setLogo,
    subtitle,
    setSubtitle,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    announcements,
    addAnnouncement,
    classBalance: transactions.reduce((acc, t) => acc + t.amount, 0),
  }), [user, logo, subtitle, transactions, announcements, addTransaction, updateTransaction, deleteTransaction, addAnnouncement]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'payment':
        return <MakePayment />;
      case 'transactions':
        return <Transactions />;
      case 'admin':
        return user?.isAdmin ? <Admin /> : <Dashboard />; // Fallback to dashboard if not admin
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} subtitle={subtitle} />;
  }

  return (
    <DataProvider value={dataProviderValue}>
      <div className="flex h-screen bg-brand-background text-brand-text">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isAdmin={user.isAdmin} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-background p-4 sm:p-6 lg:p-8">
            {renderPage()}
          </main>
        </div>
      </div>
    </DataProvider>
  );
};

export default App;