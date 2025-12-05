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
import { 
  auth, db, onAuthStateChanged, signOut, doc, getDoc, setDoc, onSnapshot, collection, 
  addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs, Timestamp 
} from './firebase';
import type { FirebaseUser } from './firebase';


// User-specific settings, stored in a 'users' collection document
interface UserSettings {
  announcements: Announcement[];
  logo: string;
  subtitle: string;
  integrationSettings: IntegrationSettings;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Global state, now populated from Firestore
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  
  // User-specific settings state
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const [firestoreListeners, setFirestoreListeners] = useState<(() => void)[]>([]);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up old Firestore listeners before setting new ones
      firestoreListeners.forEach(unsub => unsub());
      setFirestoreListeners([]);

      if (firebaseUser && firebaseUser.email) {
        setLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let userDocSnap = await getDoc(userDocRef);
        
        // Determine user role based on email and classmate records
        const isAdminByEmail = firebaseUser.email === 'dues_beachhigh89@comcast.net';
        let finalRole: UserRole = 'Standard';
        let finalName = firebaseUser.displayName || 'New User';
        let finalIsAdmin = isAdminByEmail;

        if (!isAdminByEmail) {
          const classmatesQuery = query(collection(db, 'classmates'), where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(classmatesQuery);
          if (!querySnapshot.empty) {
              const classmateData = querySnapshot.docs[0].data() as Classmate;
              if (classmateData.status === 'Inactive') {
                  alert("Your account is currently inactive. Please contact the administrator.");
                  await signOut(auth);
                  setLoading(false);
                  return;
              }
              finalRole = classmateData.role;
              finalName = classmateData.name;
              finalIsAdmin = classmateData.role === 'Admin';
          }
        }
        
        // If user document doesn't exist in Firestore, create it
        if (!userDocSnap.exists()) {
          const defaultSettings: UserSettings = {
            announcements: [
              { id: '1', title: 'Upcoming Class Reunion!', content: 'Join us for our 20-year reunion on October 15th! Early bird tickets are now available. A down payment of $50 is required by August 31st to secure your spot. We can\'t wait to see you there!', date: '2024-07-15', type: 'text' },
              { id: '2', title: 'Class Fundraiser for John Doe', content: 'We are raising funds to support our classmate John Doe during a difficult time. Any donation, big or small, is greatly appreciated.', date: '2024-06-20', type: 'text' },
            ],
            logo: 'https://picsum.photos/seed/alumni/100/100',
            subtitle: 'A.E. Beach High C/o 89 Bulldogs',
            integrationSettings: {
              cashApp: { connected: false, identifier: '' }, payPal: { connected: false, identifier: '' },
              zelle: { connected: false, identifier: '' }, bank: { connected: false, identifier: '' },
            },
          };
          const newUserProfile = {
              name: finalName,
              email: firebaseUser.email,
              ...defaultSettings
          };
          await setDoc(userDocRef, newUserProfile);
          userDocSnap = await getDoc(userDocRef); // Re-fetch the doc
        }

        // Set up app user object for the session
        const appUser: User = {
          id: firebaseUser.uid,
          name: finalName,
          email: firebaseUser.email,
          isAdmin: finalIsAdmin,
          role: finalRole,
        };
        setUser(appUser);
        
        // Set up real-time Firestore listeners
        const unsubUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setUserSettings({
                    announcements: data.announcements || [],
                    logo: data.logo || '',
                    subtitle: data.subtitle || '',
                    integrationSettings: data.integrationSettings || {},
                });
            }
        });

        const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
          const fetchedTransactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Transaction);
          setTransactions(fetchedTransactions);
        });

        const unsubClassmates = onSnapshot(collection(db, 'classmates'), (snapshot) => {
          const fetchedClassmates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Classmate);
          setClassmates(fetchedClassmates);
        });

        setFirestoreListeners([unsubUser, unsubTransactions, unsubClassmates]);
        setCurrentPage('dashboard');

      } else {
        // User is logged out
        setUser(null);
        setUserSettings(null);
        setTransactions([]);
        setClassmates([]);
      }
      setLoading(false);
    });
    
    // Cleanup auth listener on component unmount
    return () => authUnsubscribe();
  }, []); // Run only once on mount

  const handleLogout = async () => {
    await signOut(auth);
  };
  
  const updateUserDoc = useCallback(async (data: Partial<UserSettings & User>) => {
    if (user?.id) {
        await updateDoc(doc(db, 'users', user.id), data);
    }
  }, [user]);

  const setLogo = useCallback(async (logoUpdater: string | ((prevLogo: string) => string)) => {
    const newLogo = typeof logoUpdater === 'function' ? logoUpdater(userSettings?.logo || '') : logoUpdater;
    await updateUserDoc({ logo: newLogo });
  }, [userSettings, updateUserDoc]);

  const setSubtitle = useCallback(async (subtitleUpdater: string | ((prevSubtitle: string) => string)) => {
    const newSubtitle = typeof subtitleUpdater === 'function' ? subtitleUpdater(userSettings?.subtitle || '') : subtitleUpdater;
    await updateUserDoc({ subtitle: newSubtitle });
  }, [userSettings, updateUserDoc]);
  
  const updateIntegrationSettings = useCallback(async (service: keyof IntegrationSettings, settings: IntegrationService) => {
    if(userSettings?.integrationSettings) {
        const newSettings = { ...userSettings.integrationSettings, [service]: settings };
        await updateUserDoc({ integrationSettings: newSettings });
    }
  }, [userSettings, updateUserDoc]);
  
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    const classmatesQuery = query(collection(db, 'classmates'), where('name', '==', transaction.classmateName.trim()));
    const querySnapshot = await getDocs(classmatesQuery);
    if (querySnapshot.empty) {
      const newClassmate: Omit<Classmate, 'id'> = {
          name: transaction.classmateName.trim(),
          role: 'Standard', email: '', address: '', phone: '', status: 'Active'
      };
      await addDoc(collection(db, 'classmates'), newClassmate);
    }
    await addDoc(collection(db, 'transactions'), transaction);
  }, []);
  
  const updateTransaction = useCallback(async (updatedTransaction: Transaction) => {
    const { id, ...data } = updatedTransaction;
    if (!id) return;
    await updateDoc(doc(db, 'transactions', id), data);
  }, []);

  const updateTransactions = useCallback(async (transactionsToUpdate: Transaction[]) => {
    const batch = writeBatch(db);
    transactionsToUpdate.forEach(t => {
        const { id, ...data } = t;
        if(id) batch.update(doc(db, 'transactions', id), data);
    });
    await batch.commit();
  }, []);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    await deleteDoc(doc(db, 'transactions', transactionId));
  }, []);

  const deleteTransactions = useCallback(async (transactionIds: string[]) => {
    const batch = writeBatch(db);
    transactionIds.forEach(id => batch.delete(doc(db, 'transactions', id)));
    await batch.commit();
  }, []);
  
  const clearTransactions = useCallback(async () => {
    // This is a dangerous operation, so we fetch and delete in batches for safety
    const querySnapshot = await getDocs(collection(db, 'transactions'));
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }, []);

  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id'| 'date'>) => {
    if (userSettings) {
      const newAnnouncement = { 
        ...announcement, 
        id: Timestamp.now().toMillis().toString(),
        date: new Date().toISOString().split('T')[0],
      };
      const updatedAnnouncements = [newAnnouncement, ...userSettings.announcements];
      await updateUserDoc({ announcements: updatedAnnouncements });
    }
  }, [userSettings, updateUserDoc]);

  const deleteAnnouncement = useCallback(async (announcementId: string) => {
    if (userSettings) {
      const updatedAnnouncements = userSettings.announcements.filter(a => a.id !== announcementId);
      await updateUserDoc({ announcements: updatedAnnouncements });
    }
  }, [userSettings, updateUserDoc]);

  const updateUserName = useCallback(async (newName: string) => {
    if (user) {
      setUser({ ...user, name: newName });
      await updateUserDoc({ name: newName });
    }
  }, [user, updateUserDoc]);

  const updateClassmate = useCallback(async (id: string, updatedData: Partial<Omit<Classmate, 'id'>>) => {
      if(!id) return;
      await updateDoc(doc(db, 'classmates', id), updatedData);
  }, []);
  
  const mergeClassmates = useCallback(async (targetId: string, sourceIds: string[]) => {
    const targetClassmate = classmates.find(c => c.id === targetId);
    if (!targetClassmate) return;

    const sourceClassmates = classmates.filter(c => sourceIds.includes(c.id));
    const sourceNames = sourceClassmates.map(c => c.name);

    // Re-assign transactions
    const transactionsQuery = query(collection(db, 'transactions'), where('classmateName', 'in', sourceNames));
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    const batch = writeBatch(db);
    transactionsSnapshot.forEach(doc => {
        batch.update(doc.ref, { classmateName: targetClassmate.name });
    });

    // Delete source classmate profiles
    sourceIds.forEach(id => {
        batch.delete(doc(db, "classmates", id));
    });

    await batch.commit();
  }, [classmates]);

  const deleteClassmates = useCallback(async (idsToDelete: string[]): Promise<string | null> => {
      const relevantClassmates = classmates.filter(c => idsToDelete.includes(c.id));
      const namesToDelete = relevantClassmates.map(c => c.name);
      
      const q = query(collection(db, 'transactions'), where('classmateName', 'in', namesToDelete));
      const transactionsSnapshot = await getDocs(q);
      
      if (!transactionsSnapshot.empty) {
        const namesWithTransactions = [...new Set(transactionsSnapshot.docs.map(doc => doc.data().classmateName))];
        return `Cannot delete. The following classmates have associated transactions: ${namesWithTransactions.join(', ')}. Please merge or re-assign their transactions first.`;
      }
      
      const batch = writeBatch(db);
      idsToDelete.forEach(id => batch.delete(doc(db, "classmates", id)));
      await batch.commit();
      return null; // Success
  }, [classmates]);

  const updateClassmatesStatus = useCallback(async (idsToUpdate: string[], status: 'Active' | 'Inactive') => {
    const batch = writeBatch(db);
    idsToUpdate.forEach(id => {
        batch.update(doc(db, "classmates", id), { status });
    });
    await batch.commit();
  }, []);

  const dataProviderValue = useMemo(() => ({
    user,
    logo: userSettings?.logo || '', setLogo,
    subtitle: userSettings?.subtitle || '', setSubtitle,
    transactions, addTransaction, updateTransaction, updateTransactions, deleteTransaction, deleteTransactions, clearTransactions,
    announcements: userSettings?.announcements || [], addAnnouncement, deleteAnnouncement,
    classBalance: transactions.reduce((acc, t) => acc + t.amount, 0) || 0,
    integrationSettings: userSettings?.integrationSettings || { cashApp: { connected: false, identifier: '' }, payPal: { connected: false, identifier: '' }, zelle: { connected: false, identifier: '' }, bank: { connected: false, identifier: '' } },
    updateIntegrationSettings,
    updateUserName,
    classmates, updateClassmate, mergeClassmates, deleteClassmates, updateClassmatesStatus,
  }), [user, userSettings, transactions, classmates, setLogo, setSubtitle, addTransaction, updateTransaction, updateTransactions, deleteTransaction, deleteTransactions, clearTransactions, addAnnouncement, deleteAnnouncement, updateIntegrationSettings, updateUserName, updateClassmate, mergeClassmates, deleteClassmates, updateClassmatesStatus]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'payment': return user?.role === 'Admin' ? <MakePayment /> : <Dashboard />;
      case 'transactions': return <Transactions />;
      case 'profile': return user?.role === 'Admin' ? <Profile /> : <Dashboard />;
      case 'admin': return user?.role === 'Admin' ? <Admin /> : <Dashboard />;
      case 'classmates': return user?.role === 'Admin' ? <Classmates /> : <Dashboard />;
      case 'reporting': return user?.role === 'Admin' ? <Reporting /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-brand-background">
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 animate-spin text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="mt-4 text-xl font-semibold text-brand-text">Loading Application...</h2>
            </div>
        </div>
    );
  }

  if (!user || !userSettings) {
    return <Login />;
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
