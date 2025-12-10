
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

// Hardcoded Super Admin Email
const SUPER_ADMIN_EMAIL = 'dues_beachhigh89@comcast.net';

const App: React.FC = () => {
  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // App State
  const [user, setUser] = useState<User | null>(null);
  const [currentClassId, setCurrentClassId] = useState<string>('');
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [classInput, setClassInput] = useState('');

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
  // 1. Authentication & Class Selection Logic
  // ===============================================================================================

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setFirebaseUser(u);
      setIsAuthLoading(false);
      setAuthError(null);

      if (u) {
        const email = u.email?.toLowerCase() || '';
        // User is logged in. Now determine Class ID context.
        if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
          // Super Admin: Can enter any class ID.
          setAvailableClasses([]);
          setShowClassSelector(true);
        } else {
          // Standard User: Fetch all their associated classmate records to find classIds.
          try {
            const snaps = await db.collection('classmates').where('email', '==', u.email).get();
            const classes = new Set<string>();
            snaps.forEach(doc => {
              const data = doc.data();
              if (data.classId) classes.add(data.classId);
            });

            const classList = Array.from(classes);
            if (classList.length === 1) {
              // Only one class, auto-select
              setCurrentClassId(classList[0]);
              setShowClassSelector(false);
            } else if (classList.length > 1) {
              // Multiple classes, show selector
              setAvailableClasses(classList);
              setShowClassSelector(true);
            } else {
              // No classes found (New User), allow them to enter/join one
              setAvailableClasses([]);
              setShowClassSelector(true);
            }
          } catch (error) {
            console.error("Error fetching user classes:", error);
            setAuthError("Failed to load user profile. Please check your connection.");
          }
        }
      } else {
        // Logged out
        setUser(null);
        setCurrentClassId('');
        setShowClassSelector(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleClassSelection = (classIdToSelect: string) => {
    if (!classIdToSelect.trim()) {
        alert("Please enter a valid Class ID.");
        return;
    }
    setCurrentClassId(classIdToSelect.trim());
    setShowClassSelector(false);
  };

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: 'guest',
      name: 'Guest User',
      email: '',
      isAdmin: false,
      role: 'Guest',
      classId: 'demo' 
    };
    setUser(guestUser);
    setCurrentClassId('demo'); // Guest gets a demo class ID or read-only view of a public one if we had it. 
    // For now, let's treat guest as a separate non-persisted session or read from a demo class.
    // Ideally, Guest should select a class too if public classes existed, but for now we'll mock it.
  };

  const handleLogout = async () => {
    await auth.signOut();
    setCurrentPage('dashboard');
    window.location.reload();
  };

  // ===============================================================================================
  // 2. Data Loading (Scoped by currentClassId)
  // ===============================================================================================

  // Fetch User Role/Profile for the selected Class ID
  useEffect(() => {
    if (!firebaseUser || !currentClassId) return;

    let unsubscribe: () => void;

    const fetchUserProfile = async () => {
      const email = firebaseUser.email?.toLowerCase() || '';

      // 1. Check if user is the Super Admin
      if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
        // Find existing classmate profile for admin in this class, or create mock
        const adminProfile: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'A.E. Beach High C/o 89',
          email: firebaseUser.email!,
          isAdmin: true,
          role: 'Admin',
          classId: currentClassId
        };
        // Try to fetch specific details from Firestore if they exist
        try {
           const snapshot = await db.collection('classmates')
            .where('email', '==', firebaseUser.email)
            .where('classId', '==', currentClassId)
            .limit(1).get();
           
           if (!snapshot.empty) {
               const data = snapshot.docs[0].data();
               adminProfile.address = data.address;
               adminProfile.phone = data.phone;
               adminProfile.name = data.name; // Use stored name
           }
        } catch(e) { console.warn("Could not fetch admin details", e); }
        
        setUser(adminProfile);
        return;
      }

      // 2. For regular users, find their Classmate record in this Class ID
      try {
        unsubscribe = db.collection('classmates')
          .where('email', '==', firebaseUser.email)
          .where('classId', '==', currentClassId)
          .limit(1)
          .onSnapshot(snapshot => {
            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              const data = doc.data() as Classmate;
              
              if (data.status === 'Inactive') {
                  setAuthError("Your account has been deactivated by the administrator.");
                  setUser(null);
                  return;
              }

              setUser({
                id: doc.id, // Use Firestore ID
                name: data.name,
                email: data.email || firebaseUser.email!,
                isAdmin: data.role === 'Admin',
                role: data.role,
                address: data.address,
                phone: data.phone,
                classId: currentClassId
              });
            } else {
              // User has no profile in this Class ID yet. 
              // Create a default "Standard" profile for them? 
              // OR treat them as a new user pending approval?
              // For this app, we will auto-create a Standard profile if they logged in successfully.
              const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email!,
                isAdmin: false,
                role: 'Standard',
                classId: currentClassId
              };
              setUser(newUser);
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
        // Only show alert if it's NOT the "offline" error which we suppress
        if (error.code !== 'unavailable') {
           // Handle specific errors
        }
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
    // Note: Previously announcements were in user settings. Now moving to collection for multi-tenancy.
    // We will query a root 'announcements' collection filtered by classId.
    const unsubscribe = db.collection('announcements')
      .where('classId', '==', currentClassId)
      .onSnapshot((snapshot) => {
      const loadedAnnouncements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Announcement));
      // Sort client-side for simplicity
      loadedAnnouncements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAnnouncements(loadedAnnouncements);
    });
    return () => unsubscribe();
  }, [currentClassId]);

  // Fetch Settings (Logo, Subtitle, Integration) - These might need to be per-class too.
  // We'll store them in a 'classSettings' collection keyed by classId.
  useEffect(() => {
      if (!currentClassId) return;
      const docRef = db.collection('classSettings').doc(currentClassId);
      
      const unsubscribe = docRef.onSnapshot(doc => {
          if (doc.exists) {
              const data = doc.data();
              if (data?.logo) setLogo(data.logo);
              if (data?.subtitle) setSubtitle(data.subtitle);
              if (data?.integrationSettings) setIntegrationSettings(data.integrationSettings);
          } else {
              // Defaults if no settings exist yet
              setLogo('https://via.placeholder.com/150');
              setSubtitle('Alumni Bookkeeping');
          }
      });
      return () => unsubscribe();
  }, [currentClassId]);


  // ===============================================================================================
  // 3. Data Mutation Functions
  // ===============================================================================================

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'classId'>) => {
    try {
      if (!currentClassId) throw new Error("No Class ID selected");
      const docRef = await db.collection('transactions').add({
          ...transaction,
          classId: currentClassId
      });
      
      // Auto-create/update classmate profile
      const existingClassmate = classmates.find(c => c.name.toLowerCase() === transaction.classmateName.toLowerCase());
      if (!existingClassmate) {
          await db.collection('classmates').add({
              name: transaction.classmateName,
              role: 'Standard',
              status: 'Active',
              classId: currentClassId
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
       // Check if name changed and update classmate list if it's a new name
       const existingClassmate = classmates.find(c => c.name.toLowerCase() === updatedTransaction.classmateName.toLowerCase());
       if (!existingClassmate && currentClassId) {
           await db.collection('classmates').add({
               name: updatedTransaction.classmateName,
               role: 'Standard',
               status: 'Active',
               classId: currentClassId
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
    try {
      if (!currentClassId) throw new Error("No Class ID");
      await db.collection('announcements').add({
        ...announcement,
        classId: currentClassId,
        date: new Date().toISOString()
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
          const ref = db.collection('classSettings').doc(currentClassId);
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
        const ref = db.collection('classSettings').doc(currentClassId);
        await ref.set({ integrationSettings: newSettings }, { merge: true });
        setIntegrationSettings(newSettings);
    } catch (error) {
        console.error("Error updating integration settings:", error);
    }
  };
  
  const updateUserProfile = async (data: Partial<User>) => {
    if (!user || !currentClassId) return;
    
    // Determine the ID of the classmate document to update.
    // If user.id is 'guest', we don't save.
    // If user.id matches the auth uid, we might need to find the corresponding classmate doc if it's separate.
    // In our logic above, we set user.id to the Classmate Doc ID for regular users.
    // For Admin (dues_...), we need to find their doc or create one.
    
    let docId = user.id;

    // Handle Admin Logic: Find or Create doc for Super Admin
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
                classId: currentClassId,
                address: data.address,
                phone: data.phone
            });
            docId = newDoc.id;
        } else {
            docId = snapshot.docs[0].id;
        }
    }

    try {
        // Prepare update data
        const updatePayload: any = {};
        if (data.name) updatePayload.name = data.name;
        if (data.email) updatePayload.email = data.email;
        if (data.address !== undefined) updatePayload.address = data.address;
        if (data.phone !== undefined) updatePayload.phone = data.phone;
        
        await db.collection('classmates').doc(docId).update(updatePayload);

        // If name changed, update all transactions linked to old name
        if (data.name && data.name !== user.name) {
             const batch = db.batch();
             const txSnapshot = await db.collection('transactions')
                .where('classId', '==', currentClassId)
                .where('classmateName', '==', user.name).get();
             
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
      if (!currentClassId) throw new Error("No class ID");
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`${currentClassId}/receipts/${Date.now()}_${file.name}`);
      await fileRef.put(file);
      return await fileRef.getDownloadURL();
  };

  // Classmate Management Functions
  const updateClassmate = async (id: string, updatedData: Partial<Omit<Classmate, 'id'>>) => {
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
          // Verify no transactions exist for these classmates
          // This is a bit complex in bulk, so we'll check individually or rely on UI to be safe.
          // For safety, we will prevent deletion if ANY transactions match the names.
          
          // Fetch names first
          const toDeleteRefs = classmateIds.map(id => db.collection('classmates').doc(id));
          const toDeleteSnaps = await Promise.all(toDeleteRefs.map(ref => ref.get()));
          const namesToCheck = toDeleteSnaps.map(snap => snap.data()?.name).filter(n => n);

          // Check transactions (simple check, expensive if many)
          for (const name of namesToCheck) {
              const txSnap = await db.collection('transactions')
                  .where('classId', '==', currentClassId)
                  .where('classmateName', '==', name).limit(1).get();
              if (!txSnap.empty) {
                  return `Cannot delete classmate '${name}' because they have associated transactions. Please re-assign or delete transactions first.`;
              }
          }

          const batch = db.batch();
          toDeleteRefs.forEach(ref => batch.delete(ref));
          await batch.commit();
          return null; // Success
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

          // 1. Update transactions for each source name
          for (const sourceName of sourceNames) {
              const txSnap = await db.collection('transactions')
                  .where('classId', '==', currentClassId)
                  .where('classmateName', '==', sourceName).get();
              txSnap.docs.forEach(doc => {
                  batch.update(doc.ref, { classmateName: targetName });
              });
          }

          // 2. Delete source classmates
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
    if (!currentClassId) return;
    try {
      // 1. Fetch all classmates
      const snapshot = await db.collection('classmates').where('classId', '==', currentClassId).get();
      const allCms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classmate));

      // 2. Group by normalized name
      const groups: { [name: string]: Classmate[] } = {};
      allCms.forEach(cm => {
        const norm = cm.name.trim().toLowerCase();
        if (!groups[norm]) groups[norm] = [];
        groups[norm].push(cm);
      });

      // 3. Identify duplicates
      const updates: Promise<void>[] = [];
      
      Object.entries(groups).forEach(([name, group]) => {
        if (group.length > 1) {
          // Prioritize: Admin role > Has Email > Created First (by ID sorting usually works or timestamp if we had it)
          group.sort((a, b) => {
             if (a.role === 'Admin' && b.role !== 'Admin') return -1;
             if (b.role === 'Admin' && a.role !== 'Admin') return 1;
             if (a.email && !b.email) return -1;
             if (b.email && !a.email) return 1;
             return 0; 
          });

          const primary = group[0];
          const duplicates = group.slice(1).map(c => c.id);
          
          // Call merge logic (we have to do this carefully in a loop or batch)
          // Since mergeClassmates handles batching internally, we can await it.
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

  // NEW: Migrate Legacy Data
  const migrateLegacyData = async (): Promise<number> => {
      if (!currentClassId) return 0;
      
      let totalMigrated = 0;
      const collections = ['transactions', 'announcements', 'classmates'];
      
      for (const colName of collections) {
          const snapshot = await db.collection(colName).get();
          const batch = db.batch();
          let batchCount = 0;
          
          snapshot.docs.forEach(doc => {
              const data = doc.data();
              // If classId is undefined, null, or empty string, migrate it
              if (!data.classId) {
                  batch.update(doc.ref, { classId: currentClassId });
                  batchCount++;
                  totalMigrated++;
              }
          });
          
          if (batchCount > 0) {
              await batch.commit();
          }
      }
      return totalMigrated;
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

  // State: Not Logged In
  if (!user && !firebaseUser) {
     return (
        <>
            <Login onGuestLogin={handleGuestLogin} onHelpClick={() => setIsHelpModalOpen(true)} />
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
        </>
     );
  }

  // State: Logged In but selecting Class
  if (showClassSelector) {
      return (
          <div className="min-h-screen bg-brand-background flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                  <h2 className="text-2xl font-bold text-center text-brand-primary mb-6">Select Your Class</h2>
                  
                  {availableClasses.length > 0 && (
                      <div className="space-y-3 mb-6">
                          <p className="text-sm text-gray-600 text-center">You are a member of multiple classes:</p>
                          {availableClasses.map(cls => (
                              <button 
                                key={cls} 
                                onClick={() => handleClassSelection(cls)}
                                className="w-full p-3 bg-gray-50 border hover:bg-brand-accent hover:text-white rounded-md transition-colors font-medium"
                              >
                                  {cls}
                              </button>
                          ))}
                      </div>
                  )}

                  <div className="border-t pt-6">
                      <p className="text-sm text-gray-600 mb-2">
                          {availableClasses.length > 0 ? "Or enter a different Class ID:" : "Please enter your Class ID to continue:"}
                      </p>
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              value={classInput} 
                              onChange={(e) => setClassInput(e.target.value)} 
                              placeholder="e.g. BEACH89"
                              className="flex-grow border-gray-300 rounded-md shadow-sm"
                          />
                          <button 
                              onClick={() => handleClassSelection(classInput)}
                              className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary"
                          >
                              Go
                          </button>
                      </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 underline">Logout</button>
                  </div>
              </div>
          </div>
      );
  }

  // State: Loading User Profile (Logged in, Class Selected, but Data not ready)
  if (firebaseUser && !user && !showClassSelector) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // State: Logged In & Class Selected
  return (
    <DataProvider value={{
      user,
      currentClassId,
      setCurrentClassId: handleClassSelection,
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
      reconcileDuplicateClassmates,
      migrateLegacyData
    }}>
      <div className="min-h-screen bg-brand-background flex flex-col lg:flex-row">
        {/* Mobile Header for Nav Toggle is inside Sidebar component, but we need structure */}
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onHelpClick={() => setIsHelpModalOpen(true)} />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {authError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{authError}</p>
                    {authError.includes("API Key") && <p className="text-sm mt-1">Please check your <code>firebase.ts</code> configuration.</p>}
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
