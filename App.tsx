
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
// Fix: Updated imports to match Firebase v8 SDK structure provided by the updated firebase.ts file.
import { auth, db, Timestamp } from './firebase';
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
  const [error, setError] = useState<string | null>(null);
  
  // Global state, now populated from Firestore
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  
  // User-specific settings state
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const [firestoreListeners, setFirestoreListeners] = useState<(() => void)[]>([]);

  useEffect(() => {
    // Fix: Use Firebase v8 auth method `onAuthStateChanged`.
    const authUnsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      // Clean up old Firestore listeners before setting new ones
      firestoreListeners.forEach(unsub => unsub());
      setFirestoreListeners([]);
      setError(null);

      if (firebaseUser && firebaseUser.email) {
        setLoading(true);
        try {
            // Fix: Use Firebase v8 Firestore syntax `collection().doc()`.
            const userDocRef = db.collection('users').doc(firebaseUser.uid);
            // Fix: Use Firebase v8 Firestore method `get()`.
            let userDocSnap = await userDocRef.get();
            
            // Determine user role based on email and classmate records
            const isAdminByEmail = firebaseUser.email === 'dues_beachhigh89@comcast.net';
            let finalRole: UserRole = 'Standard';
            let finalName = firebaseUser.displayName || 'New User';
            let finalIsAdmin = isAdminByEmail;

            if (!isAdminByEmail) {
            // Fix: Use Firebase v8 Firestore query syntax.
            const classmatesQuery = db.collection('classmates').where('email', '==', firebaseUser.email);
            // Fix: Use Firebase v8 Firestore method `get()` on query.
            const querySnapshot = await classmatesQuery.get();
            if (!querySnapshot.empty) {
                const classmateData = querySnapshot.docs[0].data() as Classmate;
                if (classmateData.status === 'Inactive') {
                    alert("Your account is currently inactive. Please contact the administrator.");
                    // Fix: Use Firebase v8 auth method `signOut`.
                    await auth.signOut();
                    setLoading(false);
                    return;
                }
                finalRole = classmateData.role;
                finalName = classmateData.name;
                finalIsAdmin = classmateData.role === 'Admin';
            }
            }
            
            // If user document doesn't exist in Firestore, create it
            if (!userDocSnap.exists) {
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
            // Fix: Use Firebase v8 Firestore method `set()`.
            await userDocRef.set(newUserProfile);
            // Fix: Use Firebase v8 Firestore method `get()`.
            userDocSnap = await userDocRef.get(); // Re-fetch the doc
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
            // Fix: Use Firebase v8 Firestore method `onSnapshot`.
            const unsubUser = userDocRef.onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    setUserSettings({
                        announcements: data.announcements || [],
                        logo: data.logo || '',
                        subtitle: data.subtitle || '',
                        integrationSettings: data.integrationSettings || {},
                    });
                }
            });

            // Fix: Use Firebase v8 Firestore syntax for collection listener.
            const unsubTransactions = db.collection('transactions').onSnapshot((snapshot) => {
            const fetchedTransactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Transaction);
            setTransactions(fetchedTransactions);
            });

            // Fix: Use Firebase v8 Firestore syntax for collection listener.
            const unsubClassmates = db.collection('classmates').onSnapshot((snapshot) => {
            const fetchedClassmates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Classmate);
            setClassmates(fetchedClassmates);
            });

            setFirestoreListeners([unsubUser, unsubTransactions, unsubClassmates]);
            setCurrentPage('dashboard');

        } catch (err) {
            console.error("Firebase Connection Error:", err);
            setError("Failed to connect to the database. This is likely due to an incorrect Firebase configuration or restrictive security rules in your project. Please verify your `firebase.ts` file and ensure that Firestore is enabled and accessible in your Firebase console.");
            setUser(null);
            setUserSettings(null);
        } finally {
            setLoading(false);
        }
      } else {
        // User is logged out
        setUser(null);
        setUserSettings(null);
        setTransactions([]);
        setClassmates([]);
        setLoading(false);
      }
    });
    
    // Cleanup auth listener on component unmount
    return () => authUnsubscribe();
  }, []); // Run only once on mount

  const handleLogout = async () => {
    // Fix: Use Firebase v8 auth method `signOut`.
    await auth.signOut();
  };
  
  const updateUserDoc = useCallback(async (data: Partial<UserSettings & User>) => {
    if (user?.id) {
        // Fix: Use Firebase v8 Firestore syntax `collection().doc().update()`.
        await db.collection('users').doc(user.id).update(data);
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
    // Fix: Use Firebase v8 Firestore query syntax.
    const classmatesQuery = db.collection('classmates').where('name', '==', transaction.classmateName.trim());
    // Fix: Use Firebase v8 Firestore method `get()` on query.
    const querySnapshot = await classmatesQuery.get();
    if (querySnapshot.empty) {
      const newClassmate: Omit<Classmate, 'id'> = {
          name: transaction.classmateName.trim(),
          role: 'Standard', email: '', address: '', phone: '', status: 'Active'
      };
      // Fix: Use Firebase v8 Firestore method `add()`.
      await db.collection('classmates').add(newClassmate);
    }
    // Fix: Use Firebase v8 Firestore method `add()`.
    await db.collection('transactions').add(transaction);
  }, []);
  
  const updateTransaction = useCallback(async (updatedTransaction: Transaction) => {
    const { id, ...data } = updatedTransaction;
    if (!id) return;
    // Fix: Use Firebase v8 Firestore syntax `collection().doc().update()`.
    await db.collection('transactions').doc(id).update(data);
  }, []);

  const updateTransactions = useCallback(async (transactionsToUpdate: Transaction[]) => {
    // Fix: Use Firebase v8 method `batch()`.
    const batch = db.batch();
    transactionsToUpdate.forEach(t => {
        const { id, ...data } = t;
        // Fix: Use Firebase v8 Firestore syntax to get doc reference for batch update.
        if(id) batch.update(db.collection('transactions').doc(id), data);
    });
    await batch.commit();
  }, []);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    // Fix: Use Firebase v8 Firestore syntax `collection().doc().delete()`.
    await db.collection('transactions').doc(transactionId).delete();
  }, []);

  const deleteTransactions = useCallback(async (transactionIds: string[]) => {
    // Fix: Use Firebase v8 method `batch()`.
    const batch = db.batch();
    // Fix: Use Firebase v8 Firestore syntax to get doc reference for batch delete.
    transactionIds.forEach(id => batch.delete(db.collection('transactions').doc(id)));
    await batch.commit();
  }, []);
  
  const clearTransactions = useCallback(async () => {
    // This is a dangerous operation, so we fetch and delete in batches for safety
    // Fix: Use Firebase v8 Firestore syntax to get all documents.
    const querySnapshot = await db.collection('transactions').get();
    // Fix: Use Firebase v8 method `batch()`.
    const batch = db.batch();
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
      // Fix: Use Firebase v8 Firestore syntax `collection().doc().update()`.
      await db.collection('classmates').doc(id).update(updatedData);
  }, []);
  
  const mergeClassmates = useCallback(async (targetId: string, sourceIds: string[]) => {
    const targetClassmate = classmates.find(c => c.id === targetId);
    if (!targetClassmate) return;

    const sourceClassmates = classmates.filter(c => sourceIds.includes(c.id));
    const sourceNames = sourceClassmates.map(c => c.name);

    // Re-assign transactions
    // Fix: Use Firebase v8 Firestore query syntax.
    const transactionsQuery = db.collection('transactions').where('classmateName', 'in', sourceNames);
    // Fix: Use Firebase v8 Firestore method `get()` on query.
    const transactionsSnapshot = await transactionsQuery.get();
    
    // Fix: Use Firebase v8 method `batch()`.
    const batch = db.batch();
    transactionsSnapshot.forEach(doc => {
        batch.update(doc.ref, { classmateName: targetClassmate.name });
    });

    // Delete source classmate profiles
    sourceIds.forEach(id => {
        // Fix: Use Firebase v8 Firestore syntax to get doc reference for batch delete.
        batch.delete(db.collection("classmates").doc(id));
    });

    await batch.commit();
  }, [classmates]);

  const deleteClassmates = useCallback(async (idsToDelete: string[]): Promise<string | null> => {
      const relevantClassmates = classmates.filter(c => idsToDelete.includes(c.id));
      const namesToDelete = relevantClassmates.map(c => c.name);
      
      // Fix: Use Firebase v8 Firestore query syntax.
      const q = db.collection('transactions').where('classmateName', 'in', namesToDelete);
      // Fix: Use Firebase v8 Firestore method `get()` on query.
      const transactionsSnapshot = await q.get();
      
      if (!transactionsSnapshot.empty) {
        const namesWithTransactions = [...new Set(transactionsSnapshot.docs.map(doc => doc.data().classmateName))];
        return `Cannot delete. The following classmates have associated transactions: ${namesWithTransactions.join(', ')}. Please merge or re-assign their transactions first.`;
      }
      
      // Fix: Use Firebase v8 method `batch()`.
      const batch = db.batch();
      // Fix: Use Firebase v8 Firestore syntax to get doc reference for batch delete.
      idsToDelete.forEach(id => batch.delete(db.collection("classmates").doc(id)));
      await batch.commit();
      return null; // Success
  }, [classmates]);

  const updateClassmatesStatus = useCallback(async (idsToUpdate: string[], status: 'Active' | 'Inactive') => {
    // Fix: Use Firebase v8 method `batch()`.
    const batch = db.batch();
    idsToUpdate.forEach(id => {
        // Fix: Use Firebase v8 Firestore syntax to get doc reference for batch update.
        batch.update(db.collection("classmates").doc(id), { status });
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

  if (error) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-brand-background p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 text-center">
                <h2 className="text-2xl font-bold text-danger mb-4">Application Error</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-brand-primary text-white py-2 px-6 rounded-md hover:bg-brand-secondary"
                >
                    Refresh Page
                </button>
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
