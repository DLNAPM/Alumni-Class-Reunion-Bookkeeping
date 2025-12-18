
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
import HelpModal from './components/HelpModal';
import { auth, db, storage, FirebaseUser, Timestamp } from './firebase';
import type { User, Transaction, Announcement, IntegrationSettings, IntegrationService, Classmate, UserRole } from './types';
import firebase from 'firebase/compat/app';

// Hardcoded Super Admin Email
const SUPER_ADMIN_EMAIL = 'dues_beachhigh89@comcast.net';

const App: React.FC = () => {
  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Class Management State
  const [currentClassId, setCurrentClassId] = useState<string>('');
  const [isSelectingClass, setIsSelectingClass] = useState(false);
  const [inputClassId, setInputClassId] = useState('');
  const [userClasses, setUserClasses] = useState<string[]>([]);


  // App State
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  
  // Customization State
  const [logo, setLogo] = useState('https://via.placeholder.com/150');
  const [subtitle, setSubtitle] = useState('Class of 1989');
  
  // Help Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Integration Settings
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    cashApp: { connected: false, identifier: '' },
    payPal: { connected: false, identifier: '' },
    zelle: { connected: false, identifier: '' },
    bank: { connected: false, identifier: '' },
  });

  const [isLoading, setIsLoading] = useState(false);

  // ===============================================================================================
  // 1. Authentication Logic
  // ===============================================================================================

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setFirebaseUser(u);
      setIsAuthLoading(false);
      setAuthError(null);

      if (u) {
        // User is logged in, check for class associations
        const email = u.email?.toLowerCase() || '';
        const isSuperAdmin = email === SUPER_ADMIN_EMAIL.toLowerCase();

        // Check if user has existing classmate records
        const snapshot = await db.collection('classmates').where('email', '==', u.email).get();
        const classes = [...new Set(snapshot.docs.map(d => d.data().classId).filter(id => id))];

        if (isSuperAdmin) {
             // Admin can always select or enter new class
             setUserClasses(classes);
             setIsSelectingClass(true);
        } else {
             if (classes.length === 1) {
                 // Auto-select single class
                 setCurrentClassId(classes[0]);
             } else if (classes.length > 1) {
                 // User in multiple classes
                 setUserClasses(classes);
                 setIsSelectingClass(true);
             } else {
                 // New user, must enter a class ID
                 setIsSelectingClass(true);
             }
        }

      } else {
        // Logged out
        setUser(null);
        setCurrentClassId('');
        setIsSelectingClass(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleClassSelection = async (selectedId: string) => {
      const id = selectedId?.trim().toUpperCase();
      if (!id) return;

      try {
          // Check if class exists by looking for any classmates associated with it
          const snapshot = await db.collection('classmates').where('classId', '==', id).limit(1).get();
          
          if (snapshot.empty) {
              const confirmCreate = window.confirm(`Class ID '${id}' does not exist.\n\nAre you sure you want to create a New Class ID and be the Admin?`);
              if (!confirmCreate) {
                  return;
              }
          }

          setCurrentClassId(id);
          setIsSelectingClass(false);
      } catch (error) {
          console.error("Error checking class existence:", error);
          alert("An error occurred while checking Class ID. Please try again.");
      }
  };

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: 'guest',
      name: 'Guest User',
      email: '',
      isAdmin: false,
      role: 'Guest',
    };
    setUser(guestUser);
    setCurrentClassId('DEMO'); // Default class for guests
  };

  const handleLogout = async () => {
    await auth.signOut();
    setCurrentPage('dashboard');
    window.location.reload();
  };

  // ===============================================================================================
  // 2. Data Loading
  // ===============================================================================================

  // Fetch User Role/Profile
  useEffect(() => {
    if (!firebaseUser || !currentClassId) return;

    let unsubscribe: () => void;

    const fetchUserProfile = async () => {
      const email = firebaseUser.email?.toLowerCase() || '';

      // 1. Check if user is the Super Admin
      if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
        const adminProfile: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Super Admin',
          email: firebaseUser.email!,
          isAdmin: true,
          role: 'Admin',
        };
        
        // Try to fetch additional details
        try {
           const snapshot = await db.collection('classmates')
               .where('email', '==', firebaseUser.email)
               .where('classId', '==', currentClassId)
               .limit(1).get();
           if (!snapshot.empty) {
               const data = snapshot.docs[0].data();
               adminProfile.address = data.address;
               adminProfile.phone = data.phone;
               adminProfile.name = data.name;
           }
        } catch(e) { console.warn("Could not fetch super admin details", e); }
        
        setUser(adminProfile);
        return;
      }

      // 2. For regular users, find their Classmate record in current class
      try {
        unsubscribe = db.collection('classmates')
          .where('email', '==', firebaseUser.email)
          .where('classId', '==', currentClassId)
          .limit(1)
          .onSnapshot(async (snapshot) => {
            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              const data = doc.data() as Classmate;
              
              if (data.status === 'Inactive') {
                  setAuthError("Your account has been deactivated by the administrator.");
                  setUser(null);
                  return;
              }

              setUser({
                id: doc.id,
                name: data.name,
                email: data.email || firebaseUser.email!,
                isAdmin: data.role === 'Admin',
                role: data.role,
                address: data.address,
                phone: data.phone,
              });
            } else {
              // Check if class is empty - if so, this user is the creator and Admin
              const allClassmatesSnap = await db.collection('classmates').where('classId', '==', currentClassId).limit(1).get();
              const isFirstUser = allClassmatesSnap.empty;
              const role: UserRole = isFirstUser ? 'Admin' : 'Standard';

              const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email!,
                isAdmin: role === 'Admin',
                role: role,
              };
              
              setUser(newUser);

              if (role === 'Admin') {
                   await db.collection('classmates').add({
                       name: newUser.name,
                       email: newUser.email,
                       role: 'Admin',
                       status: 'Active',
                       classId: currentClassId,
                   });
              }
            }
          }, error => {
              console.error("Error listening to user profile:", error);
              setAuthError("Failed to load user profile.");
          });
      } catch (error) {
        console.error("Error setting up profile listener:", error);
      }
    };

    fetchUserProfile();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseUser, currentClassId]);


  // Fetch Transactions
  useEffect(() => {
    if (!currentClassId) return;
    setIsLoading(true);
    const unsubscribe = db.collection('transactions')
      .where('classId', '==', currentClassId)
      .onSnapshot((snapshot) => {
        const loadedTransactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Transaction));
        setTransactions(loadedTransactions);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching transactions:", error);
        setIsLoading(false);
      });
    return () => unsubscribe();
  }, [currentClassId]);

  // Fetch Classmates
  useEffect(() => {
    if (!currentClassId) return;
    const unsubscribe = db.collection('classmates')
      .where('classId', '==', currentClassId)
      .onSnapshot((snapshot) => {
        const loadedClassmates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Classmate));
        setClassmates(loadedClassmates);
      }, (error) => console.error("Error fetching classmates:", error));
    return () => unsubscribe();
  }, [currentClassId]);

  // Fetch Announcements
  useEffect(() => {
    if (!currentClassId) return;
    const unsubscribe = db.collection('announcements')
      .where('classId', '==', currentClassId)
      .onSnapshot((snapshot) => {
      const loadedAnnouncements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Announcement));
      loadedAnnouncements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAnnouncements(loadedAnnouncements);
    });
    return () => unsubscribe();
  }, [currentClassId]);

  useEffect(() => {
      if (!currentClassId) return;
      const docRef = db.collection('settings').doc(currentClassId);
      const unsubscribe = docRef.onSnapshot(doc => {
          if (doc.exists) {
              const data = doc.data();
              if (data?.logo) setLogo(data.logo);
              if (data?.subtitle) setSubtitle(data.subtitle);
              if (data?.integrationSettings) setIntegrationSettings(data.integrationSettings);
          } else {
             setLogo('https://via.placeholder.com/150');
             setSubtitle(`Class of ${currentClassId}`);
          }
      });
      return () => unsubscribe();
  }, [currentClassId]);


  // ===============================================================================================
  // 3. Data Mutation Functions
  // ===============================================================================================

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'classId'>) => {
    if (!currentClassId) return;
    try {
      await db.collection('transactions').add({
          ...transaction,
          classId: currentClassId,
      });
      
      const existingClassmate = classmates.find(c => c.name.toLowerCase() === transaction.classmateName.toLowerCase());
      if (!existingClassmate) {
          await db.collection('classmates').add({
              name: transaction.classmateName,
              role: 'Standard',
              status: 'Active',
              classId: currentClassId,
          });
      }
    } catch (error) {
      console.error("Error adding transaction: ", error);
      alert("Error adding transaction. Please check your connection.");
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction) => {
    try {
      await db.collection('transactions').doc(updatedTransaction.id).update(updatedTransaction);
       const existingClassmate = classmates.find(c => c.name.toLowerCase() === updatedTransaction.classmateName.toLowerCase());
       if (!existingClassmate) {
           await db.collection('classmates').add({
               name: updatedTransaction.classmateName,
               role: 'Standard',
               status: 'Active',
               classId: currentClassId,
           });
       }
    } catch (error) {
      console.error("Error updating transaction: ", error);
      alert("Error updating transaction.");
    }
  };
  
  const updateTransactions = async (updatedTransactions: Transaction[]) => {
      try {
          const batch = db.batch();
          updatedTransactions.forEach(t => {
              const ref = db.collection('transactions').doc(t.id);
              batch.update(ref, t);
          });
          await batch.commit();
      } catch (error) {
          console.error("Error batch updating transactions:", error);
          alert("Error updating transactions.");
      }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      await db.collection('transactions').doc(transactionId).delete();
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      alert("Error deleting transaction.");
    }
  };
  
  const deleteTransactions = async (transactionIds: string[]) => {
      try {
          const batch = db.batch();
          transactionIds.forEach(id => {
              const ref = db.collection('transactions').doc(id);
              batch.delete(ref);
          });
          await batch.commit();
      } catch (error) {
          console.error("Error deleting transactions:", error);
          alert("Error deleting transactions.");
      }
  };

  const clearTransactions = async () => {
    try {
      const batch = db.batch();
      transactions.forEach(t => {
        const ref = db.collection('transactions').doc(t.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (error) {
       console.error("Error clearing transactions: ", error);
       alert("Error clearing transactions.");
    }
  };

  const addAnnouncement = async (announcement: Omit<Announcement, 'id' | 'date' | 'classId'>) => {
    if (!currentClassId) return;
    try {
      await db.collection('announcements').add({
        ...announcement,
        date: new Date().toISOString(),
        classId: currentClassId,
      });
    } catch (error) {
      console.error("Error adding announcement: ", error);
      alert("Failed to add announcement.");
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    try {
       await db.collection('announcements').doc(announcementId).delete();
    } catch (error) {
       console.error("Error deleting announcement: ", error);
       alert("Failed to delete announcement.");
    }
  };

  const updateSettings = async (field: string, value: any) => {
      if (!currentClassId) return;
      try {
          const ref = db.collection('settings').doc(currentClassId);
          await ref.set({ [field]: value }, { merge: true });
          
          if (field === 'logo') setLogo(value);
          if (field === 'subtitle') setSubtitle(value);
      } catch (error) {
          console.error(`Error updating ${field}:`, error);
      }
  };

  const updateIntegrationSettings = async (service: keyof IntegrationSettings, settings: IntegrationService) => {
    if (!currentClassId) return;
    try {
        const newSettings = { ...integrationSettings, [service]: settings };
        const ref = db.collection('settings').doc(currentClassId);
        await ref.set({ integrationSettings: newSettings }, { merge: true });
        setIntegrationSettings(newSettings);
    } catch (error) {
        console.error("Error updating integration settings:", error);
    }
  };
  
  const updateUserProfile = async (data: Partial<User>) => {
    if (!user || !currentClassId) return;
    
    let docId = user.id;

    if (user.isAdmin && user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        const snapshot = await db.collection('classmates')
            .where('email', '==', user.email)
            .where('classId', '==', currentClassId)
            .limit(1).get();
        if (snapshot.empty) {
            const newDoc = await db.collection('classmates').add({
                name: data.name || user.name,
                email: user.email,
                role: 'Admin',
                status: 'Active',
                address: data.address,
                phone: data.phone,
                classId: currentClassId,
            });
            docId = newDoc.id;
        } else {
            docId = snapshot.docs[0].id;
        }
    }

    try {
        const updatePayload: any = {};
        if (data.name) updatePayload.name = data.name;
        if (data.email) updatePayload.email = data.email;
        if (data.address !== undefined) updatePayload.address = data.address;
        if (data.phone !== undefined) updatePayload.phone = data.phone;
        
        await db.collection('classmates').doc(docId).update(updatePayload);

        if (data.name && data.name !== user.name) {
             const batch = db.batch();
             const txSnapshot = await db.collection('transactions')
                .where('classmateName', '==', user.name)
                .where('classId', '==', currentClassId)
                .get();
             
             txSnapshot.docs.forEach(doc => {
                 batch.update(doc.ref, { classmateName: data.name });
             });
             await batch.commit();
        }

        setUser(prev => prev ? ({ ...prev, ...data }) : null);
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
  };

  const uploadTransactionAttachment = async (file: File): Promise<string> => {
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`receipts/${currentClassId}/${Date.now()}_${file.name}`);
      await fileRef.put(file);
      return await fileRef.getDownloadURL();
  };

  const updateClassmate = async (id: string, updatedData: Partial<Omit<Classmate, 'id' | 'classId'>>) => {
      try {
          await db.collection('classmates').doc(id).update(updatedData);
      } catch (error) {
          console.error("Error updating classmate:", error);
          alert("Failed to update classmate.");
      }
  };

  const updateClassmatesStatus = async (classmateIds: string[], status: 'Active' | 'Inactive') => {
      try {
          const batch = db.batch();
          classmateIds.forEach(id => {
              const ref = db.collection('classmates').doc(id);
              batch.update(ref, { status });
          });
          await batch.commit();
      } catch (error) {
          console.error("Error updating classmates status:", error);
          alert("Failed to update status.");
      }
  };

  const deleteClassmates = async (classmateIds: string[]): Promise<string | null> => {
      try {
          const toDeleteRefs = classmateIds.map(id => db.collection('classmates').doc(id));
          const toDeleteSnaps = await Promise.all(toDeleteRefs.map(ref => ref.get()));
          const namesToCheck = toDeleteSnaps.map(snap => snap.data()?.name).filter(n => n);

          for (const name of namesToCheck) {
              const txSnap = await db.collection('transactions')
                  .where('classmateName', '==', name)
                  .where('classId', '==', currentClassId)
                  .limit(1).get();
              if (!txSnap.empty) {
                  return `Cannot delete classmate '${name}' because they have associated transactions.`;
              }
          }

          const batch = db.batch();
          toDeleteRefs.forEach(ref => batch.delete(ref));
          await batch.commit();
          return null;
      } catch (error) {
          console.error("Error deleting classmates:", error);
          return "An error occurred while deleting classmates.";
      }
  };

  const mergeClassmates = async (targetClassmateId: string, sourceClassmateIds: string[]) => {
      try {
          const targetDoc = await db.collection('classmates').doc(targetClassmateId).get();
          if (!targetDoc.exists) throw new Error("Target classmate not found");
          const targetName = targetDoc.data()?.name;

          const sourceDocs = await Promise.all(sourceClassmateIds.map(id => db.collection('classmates').doc(id).get()));
          const sourceNames = sourceDocs.map(d => d.data()?.name).filter(n => n);

          const batch = db.batch();
          for (const sourceName of sourceNames) {
              const txSnap = await db.collection('transactions')
                  .where('classmateName', '==', sourceName)
                  .where('classId', '==', currentClassId)
                  .get();
              txSnap.docs.forEach(doc => {
                  batch.update(doc.ref, { classmateName: targetName });
              });
          }

          sourceClassmateIds.forEach(id => {
              batch.delete(db.collection('classmates').doc(id));
          });

          await batch.commit();
      } catch (error) {
          console.error("Error merging classmates:", error);
          alert("Failed to merge classmates.");
      }
  };

  const reconcileDuplicateClassmates = async () => {
    try {
      const snapshot = await db.collection('classmates').where('classId', '==', currentClassId).get();
      const allCms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classmate));
      const groups: { [name: string]: Classmate[] } = {};
      allCms.forEach(cm => {
        const norm = cm.name.trim().toLowerCase();
        if (!groups[norm]) groups[norm] = [];
        groups[norm].push(cm);
      });
      const updates: Promise<void>[] = [];
      Object.entries(groups).forEach(([name, group]) => {
        if (group.length > 1) {
          group.sort((a, b) => {
             if (a.role === 'Admin' && b.role !== 'Admin') return -1;
             if (b.role === 'Admin' && a.role !== 'Admin') return 1;
             if (a.email && !b.email) return -1;
             if (b.email && !a.email) return 1;
             return 0; 
          });
          const primary = group[0];
          const duplicates = group.slice(1).map(c => c.id);
          updates.push(mergeClassmates(primary.id, duplicates));
        }
      });
      await Promise.all(updates);
      alert("Reconciliation complete.");
    } catch (error) {
      console.error("Error reconciling:", error);
      alert("Error during reconciliation.");
    }
  };

  const migrateLegacyData = async () => {
      if (!currentClassId) return;
      try {
          const batch = db.batch();
          let count = 0;
          const collections = ['transactions', 'classmates', 'announcements'];
          for (const col of collections) {
              const snapshot = await db.collection(col).get();
              snapshot.docs.forEach(doc => {
                  const data = doc.data();
                  if (!data.classId) {
                      batch.update(doc.ref, { classId: currentClassId });
                      count++;
                  }
              });
          }
          if (count > 0) {
              await batch.commit();
              alert(`Successfully migrated ${count} legacy records to Class ID: ${currentClassId}`);
              window.location.reload();
          } else {
              alert("No legacy records found to migrate.");
          }
      } catch (error) {
          console.error("Migration error:", error);
          alert("An error occurred during migration.");
      }
  };

  const deleteClassLedger = async () => {
    if (!currentClassId) return;
    
    const confirm1 = window.confirm(`Are you sure you want to delete the COMPLETE Current Class Ledger for '${currentClassId}'? This action is IRREVERSIBLE.`);
    if (!confirm1) return;

    const typedId = prompt(`Type the Class ID '${currentClassId}' to confirm full deletion:`);
    if (typedId !== currentClassId) {
        alert("Deletion cancelled. Typed ID did not match.");
        return;
    }

    setIsLoading(true);
    try {
        const collections = ['transactions', 'classmates', 'announcements'];
        for (const col of collections) {
            const snapshot = await db.collection(col).where('classId', '==', currentClassId).get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        await db.collection('settings').doc(currentClassId).delete();
        alert(`Class Ledger '${currentClassId}' has been completely deleted.`);
        setCurrentClassId('');
        setIsSelectingClass(true);
    } catch (error) {
        console.error("Error deleting class ledger:", error);
        alert("Failed to delete the class ledger. Please check permissions.");
    } finally {
        setIsLoading(false);
    }
  };


  const classBalance = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);


  // ===============================================================================================
  // Render
  // ===============================================================================================

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (firebaseUser && isSelectingClass) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border border-gray-100">
                  <div className="bg-brand-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Select Ledger</h2>
                  <p className="mb-8 text-gray-500 text-sm">Access an existing class or create a new professional workspace.</p>
                  
                  {userClasses.length > 0 && (
                      <div className="space-y-3 mb-8">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left mb-2">My Class Ledgers</p>
                          {userClasses.map(id => (
                              <button 
                                key={id}
                                onClick={() => handleClassSelection(id)}
                                className="w-full py-4 px-6 bg-gray-50 hover:bg-white text-gray-900 font-bold rounded-2xl transition-all border border-gray-100 hover:border-brand-primary hover:shadow-md flex justify-between items-center group"
                              >
                                <span>{id}</span>
                                <svg className="h-5 w-5 text-gray-400 group-hover:text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </button>
                          ))}
                      </div>
                  )}
                  
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="px-3 bg-white text-gray-400 font-bold">New Ledger ID</span></div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleClassSelection(inputClassId); }}>
                      <input 
                        type="text" 
                        placeholder="e.g. BEACHHIGH89" 
                        className="w-full mb-4 px-6 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-accent/20 focus:border-brand-primary transition-all text-center uppercase font-bold tracking-widest"
                        value={inputClassId}
                        onChange={(e) => setInputClassId(e.target.value)}
                        required
                      />
                      <button type="submit" className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold hover:bg-brand-secondary transition-all shadow-xl hover:shadow-2xl active:scale-95">
                          Launch Ledger
                      </button>
                  </form>
                   <button onClick={handleLogout} className="mt-8 text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors uppercase tracking-widest">Sign Out</button>
              </div>
          </div>
      );
  }

  if (!user && !firebaseUser) {
     return (
        <>
            <Login onGuestLogin={handleGuestLogin} onHelpClick={() => setIsHelpModalOpen(true)} />
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
        </>
     );
  }

  if (firebaseUser && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <DataProvider value={{
      currentClassId,
      migrateLegacyData,
      deleteClassLedger,
      user,
      logo,
      setLogo: (val) => updateSettings('logo', val),
      subtitle,
      setSubtitle: (val) => updateSettings('subtitle', val),
      transactions,
      addTransaction,
      updateTransaction,
      updateTransactions,
      deleteTransaction,
      deleteTransactions,
      clearTransactions,
      announcements,
      addAnnouncement,
      deleteAnnouncement,
      classBalance,
      integrationSettings,
      updateIntegrationSettings,
      updateUserProfile,
      uploadTransactionAttachment,
      classmates,
      updateClassmate,
      mergeClassmates,
      deleteClassmates,
      updateClassmatesStatus,
      reconcileDuplicateClassmates
    }}>
      <div className="min-h-screen bg-brand-background flex flex-col lg:flex-row">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onHelpClick={() => setIsHelpModalOpen(true)} />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {authError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{authError}</p>
                </div>
            )}
            
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'payment' && <MakePayment />}
            {currentPage === 'transactions' && <Transactions />}
            {currentPage === 'admin' && <Admin />}
            {currentPage === 'reporting' && <Reporting />}
            {currentPage === 'profile' && <Profile />}
            {currentPage === 'classmates' && <Classmates />}
          </main>
        </div>
      </div>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </DataProvider>
  );
};

export default App;
