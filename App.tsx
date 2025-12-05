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
import Classmates from './components/Classmates';
import type { User, Transaction, Announcement, IntegrationSettings, IntegrationService, Classmate, UserRole } from './types';
import { generateMockTransactions } from './services/mockData';


// User-specific settings, excluding transactions
interface UserSettings {
  announcements: Announcement[];
  logo: string;
  subtitle: string;
  integrationSettings: IntegrationSettings;
}

const App: React.FC = () => {
  // State for the currently logged-in user
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('alumniApp-currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  });

  // GLOBAL state for all transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const storedTransactions = localStorage.getItem('alumniApp-transactions');
      // If no global transactions, initialize with mock data.
      return storedTransactions ? JSON.parse(storedTransactions) : generateMockTransactions();
    } catch (e) {
      console.error("Failed to parse transactions from localStorage", e);
      return [];
    }
  });

  // GLOBAL state for all classmates and their roles
  const [classmates, setClassmates] = useState<Classmate[]>(() => {
    try {
      const stored = localStorage.getItem('alumniApp-classmates');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse classmates from localStorage", e);
      return [];
    }
  });


  // State for user-specific settings
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Load user settings when user logs in or on initial load
  useEffect(() => {
    if (user) {
      try {
        const storedSettings = localStorage.getItem(`alumniApp-settings-${user.email}`);
        if (storedSettings) {
          setUserSettings(JSON.parse(storedSettings));
        } else {
          // Initialize with default/mock settings for a new user
          const defaultSettings: UserSettings = {
            announcements: [
              { id: 1, title: 'Upcoming Class Reunion!', content: 'Join us for our 20-year reunion on October 15th! Early bird tickets are now available. A down payment of $50 is required by August 31st to secure your spot. We can\'t wait to see you there!', date: '2024-07-15', type: 'text' },
              { id: 2, title: 'Class Fundraiser for John Doe', content: 'We are raising funds to support our classmate John Doe during a difficult time. Any donation, big or small, is greatly appreciated.', date: '2024-06-20', type: 'text' },
            ],
            logo: 'https://picsum.photos/seed/alumni/100/100',
            subtitle: 'A.E. Beach High C/o 89 Bulldogs',
            integrationSettings: {
              cashApp: { connected: false, identifier: '' },
              payPal: { connected: false, identifier: '' },
              zelle: { connected: false, identifier: '' },
              bank: { connected: false, identifier: '' },
            },
          };
          setUserSettings(defaultSettings);
        }
        localStorage.setItem('alumniApp-currentUser', JSON.stringify(user));
      } catch (e) {
        console.error("Failed to load user settings from localStorage", e);
      }
    } else {
      localStorage.removeItem('alumniApp-currentUser');
      setUserSettings(null); // Clear settings on logout
    }
  }, [user]);

  // Save GLOBAL transactions whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('alumniApp-transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to save transactions to localStorage", e);
    }
  }, [transactions]);

  // Save GLOBAL classmates whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('alumniApp-classmates', JSON.stringify(classmates));
    } catch (e) {
      console.error("Failed to save classmates to localStorage", e);
    }
  }, [classmates]);

  // Sync classmates list with transactions
  useEffect(() => {
    const uniqueNames = [...new Set(transactions.map(t => t.classmateName.trim()).filter(Boolean))];
    setClassmates(prevClassmates => {
      const existingNames = new Set(prevClassmates.map(c => c.name));
      const newClassmatesToAdd = uniqueNames
        .filter(name => !existingNames.has(name))
        .map(name => ({ name, role: 'Standard' as UserRole }));

      if (newClassmatesToAdd.length > 0) {
        return [...prevClassmates, ...newClassmatesToAdd].sort((a,b) => a.name.localeCompare(b.name));
      }
      return prevClassmates;
    });
  }, [transactions]);


  // Save user-specific settings whenever they change
  useEffect(() => {
    if (user && userSettings) {
      try {
        localStorage.setItem(`alumniApp-settings-${user.email}`, JSON.stringify(userSettings));
      } catch (e) {
        console.error("Failed to save user settings to localStorage", e);
      }
    }
  }, [user, userSettings]);
  

  const handleLogin = (loggedInUser: Pick<User, 'id' | 'name' | 'email'>) => {
    const foundClassmate = classmates.find(c =>
        c.name.toLowerCase() === loggedInUser.name.toLowerCase()
    );

    const role: UserRole = loggedInUser.email === 'dues_beachhigh89@comcast.net'
        ? 'Admin'
        : foundClassmate
        ? foundClassmate.role
        : 'Standard';

    const finalUser: User = {
        ...loggedInUser,
        role,
        isAdmin: role === 'Admin',
    };

    setUser(finalUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };
  
  const setLogo = useCallback((logo: string | ((prevLogo: string) => string)) => {
    setUserSettings(prev => prev ? { ...prev, logo: typeof logo === 'function' ? logo(prev.logo) : logo } : null);
  }, []);

  const setSubtitle = useCallback((subtitle: string | ((prevSubtitle: string) => string)) => {
    setUserSettings(prev => prev ? { ...prev, subtitle: typeof subtitle === 'function' ? subtitle(prev.subtitle) : subtitle } : null);
  }, []);

  const updateIntegrationSettings = useCallback((service: keyof IntegrationSettings, settings: IntegrationService) => {
    setUserSettings(prev => {
      if (!prev) return null;
      return { ...prev, integrationSettings: { ...prev.integrationSettings, [service]: settings }};
    });
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => {
      const newTransaction = { ...transaction, id: Date.now() + Math.random() };
      return [newTransaction, ...prev];
    });
  }, []);
  
  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  }, []);

  const updateTransactions = useCallback((transactionsToUpdate: Transaction[]) => {
    setTransactions(prev => {
        const updatesMap = new Map(transactionsToUpdate.map(t => [t.id, t]));
        return prev.map(t => updatesMap.get(t.id) || t);
    });
  }, []);

  const deleteTransaction = useCallback((transactionId: number) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, []);

  const deleteTransactions = useCallback((transactionIds: number[]) => {
    setTransactions(prev => {
      const idsToDelete = new Set(transactionIds);
      return prev.filter(t => !idsToDelete.has(t.id));
    });
  }, []);
  
  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id'>) => {
    setUserSettings(prev => {
        if (!prev) return null;
        const newAnnouncement = { ...announcement, id: Date.now() };
        return { ...prev, announcements: [newAnnouncement, ...prev.announcements] };
    });
  }, []);

  const deleteAnnouncement = useCallback((announcementId: number) => {
    setUserSettings(prev => prev ? { ...prev, announcements: prev.announcements.filter(a => a.id !== announcementId) } : null);
  }, []);

  const updateUserName = useCallback((newName: string) => {
    setUser(currentUser => {
      if (currentUser) {
        return { ...currentUser, name: newName };
      }
      return null;
    });
  }, []);

  const updateClassmateRole = useCallback((name: string, role: UserRole) => {
    setClassmates(prev => prev.map(c => c.name === name ? { ...c, role } : c));
  }, []);


  const dataProviderValue = useMemo(() => ({
    user,
    logo: userSettings?.logo || '',
    setLogo,
    subtitle: userSettings?.subtitle || '',
    setSubtitle,
    transactions: transactions || [],
    addTransaction,
    updateTransaction,
    updateTransactions,
    deleteTransaction,
    deleteTransactions,
    clearTransactions,
    announcements: userSettings?.announcements || [],
    addAnnouncement,
    deleteAnnouncement,
    classBalance: transactions.reduce((acc, t) => acc + t.amount, 0) || 0,
    integrationSettings: userSettings?.integrationSettings || { cashApp: { connected: false, identifier: '' }, payPal: { connected: false, identifier: '' }, zelle: { connected: false, identifier: '' }, bank: { connected: false, identifier: '' } },
    updateIntegrationSettings,
    updateUserName,
    classmates: classmates || [],
    updateClassmateRole,
  }), [user, userSettings, transactions, addTransaction, updateTransaction, updateTransactions, deleteTransaction, deleteTransactions, clearTransactions, addAnnouncement, deleteAnnouncement, setLogo, setSubtitle, updateIntegrationSettings, updateUserName, classmates, updateClassmateRole]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'payment':
        return user?.role === 'Admin' ? <MakePayment /> : <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'profile':
        return user?.role === 'Admin' ? <Profile /> : <Dashboard />;
      case 'admin':
        return user?.role === 'Admin' ? <Admin /> : <Dashboard />;
      case 'classmates':
        return user?.role === 'Admin' ? <Classmates /> : <Dashboard />;
      case 'reporting':
        return user?.role === 'Admin' ? <Reporting /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  if (!user || !userSettings) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <DataProvider value={dataProviderValue}>
      <div className="flex h-screen bg-brand-background text-brand-text">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
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