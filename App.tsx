import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DataProvider } from './context/DataContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MakePayment from './components/MakePayment';
import Transactions from './components/Transactions';
import Admin from './components/Admin';
import Reporting from './components/Reporting';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Profile from './components/Profile';
import type { User, Transaction, Announcement, IntegrationSettings, IntegrationService } from './types';
import { generateMockTransactions } from './services/mockData';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('alumniApp-user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  });
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('alumniApp-user', JSON.stringify(user));
      } else {
        localStorage.removeItem('alumniApp-user');
      }
    } catch (e) {
      console.error("Failed to save user to localStorage", e);
    }
  }, [user]);

  const [logo, setLogo] = useState<string>(() => localStorage.getItem('alumniApp-logo') || 'https://picsum.photos/seed/alumni/100/100');
  useEffect(() => localStorage.setItem('alumniApp-logo', logo), [logo]);

  const [subtitle, setSubtitle] = useState<string>(() => localStorage.getItem('alumniApp-subtitle') || 'A.E. Beach High C/o 89 Bulldogs');
  useEffect(() => localStorage.setItem('alumniApp-subtitle', subtitle), [subtitle]);

  const [currentPage, setCurrentPage] = useState('dashboard');

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const storedTransactions = localStorage.getItem('alumniApp-transactions');
      return storedTransactions ? JSON.parse(storedTransactions) : generateMockTransactions();
    } catch (e) {
      console.error("Failed to parse transactions from localStorage", e);
      return generateMockTransactions();
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('alumniApp-transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to save transactions to localStorage", e);
    }
  }, [transactions]);

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const stored = localStorage.getItem('alumniApp-announcements');
      return stored ? JSON.parse(stored) : [
        {
          id: 1,
          title: 'Upcoming Class Reunion!',
          content: 'Join us for our 20-year reunion on October 15th! Early bird tickets are now available. A down payment of $50 is required by August 31st to secure your spot. We can\'t wait to see you there!',
          date: '2024-07-15',
          type: 'text'
        },
        {
          id: 2,
          title: 'Class Fundraiser for John Doe',
          content: 'We are raising funds to support our classmate John Doe during a difficult time. Any donation, big or small, is greatly appreciated.',
          date: '2024-06-20',
          type: 'text'
        },
      ];
    } catch (e) {
      console.error("Failed to parse announcements from localStorage", e);
      return []; // Return empty on error
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('alumniApp-announcements', JSON.stringify(announcements));
    } catch (e) {
      console.error("Failed to save announcements to localStorage", e);
    }
  }, [announcements]);
  
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>(() => {
    try {
      const stored = localStorage.getItem('alumniApp-integrationSettings');
      return stored ? JSON.parse(stored) : {
        cashApp: { connected: false, identifier: '' },
        payPal: { connected: false, identifier: '' },
        zelle: { connected: false, identifier: '' },
        bank: { connected: false, identifier: '' },
      };
    } catch (e) {
      console.error("Failed to parse integrationSettings from localStorage", e);
      return { cashApp: { connected: false, identifier: '' }, payPal: { connected: false, identifier: '' }, zelle: { connected: false, identifier: '' }, bank: { connected: false, identifier: '' } };
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('alumniApp-integrationSettings', JSON.stringify(integrationSettings));
    } catch (e) {
      console.error("Failed to save integrationSettings to localStorage", e);
    }
  }, [integrationSettings]);

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
  
  const updateIntegrationSettings = useCallback((service: keyof IntegrationSettings, settings: IntegrationService) => {
    setIntegrationSettings(prev => ({ ...prev, [service]: settings }));
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...transaction, id: Date.now() }, ...prev]);
  }, []);
  
  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  }, []);

  const deleteTransaction = useCallback((transactionId: number) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, []);
  
  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id'>) => {
    setAnnouncements(prev => [{ ...announcement, id: Date.now() }, ...prev]);
  }, []);

  const deleteAnnouncement = useCallback((announcementId: number) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  }, []);

  const updateUserName = useCallback((newName: string) => {
    setUser(currentUser => {
      if (currentUser) {
        return { ...currentUser, name: newName };
      }
      return null;
    });
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
    clearTransactions,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    classBalance: transactions.reduce((acc, t) => acc + t.amount, 0),
    integrationSettings,
    updateIntegrationSettings,
    updateUserName,
  }), [user, logo, subtitle, transactions, announcements, addTransaction, updateTransaction, deleteTransaction, clearTransactions, addAnnouncement, deleteAnnouncement, integrationSettings, updateIntegrationSettings, updateUserName]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'payment':
        return <MakePayment />;
      case 'transactions':
        return <Transactions />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return user?.isAdmin ? <Admin /> : <Dashboard />; // Fallback to dashboard if not admin
      case 'reporting':
        return user?.isAdmin ? <Reporting /> : <Dashboard />; // Fallback to dashboard if not admin
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
