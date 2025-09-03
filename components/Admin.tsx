import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory, Transaction, Announcement, IntegrationSettings, PaymentType } from '../types';
import Papa from 'papaparse';

// Generic card component for the admin panel sections
const AdminCard: React.FC<{ title: string; children: React.ReactNode; borderColor?: string }> = ({ title, children, borderColor = 'border-b' }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className={`text-xl font-semibold mb-4 text-brand-text ${borderColor} pb-2`}>{title}</h3>
    {children}
  </div>
);

// Integration Settings Component
const IntegrationManager: React.FC<{
  service: keyof IntegrationSettings;
  title: string;
  label: string;
  placeholder: string;
}> = ({ service, title, label, placeholder }) => {
  const { integrationSettings, updateIntegrationSettings } = useData();
  const [identifier, setIdentifier] = useState(integrationSettings[service].identifier);

  const handleConnect = () => {
    if (identifier) {
      updateIntegrationSettings(service, { connected: true, identifier });
      alert(`Successfully connected to ${title}!`);
    } else {
      alert(`Please enter a valid ${label}.`);
    }
  };

  const handleDisconnect = () => {
    updateIntegrationSettings(service, { connected: false, identifier: '' });
    setIdentifier('');
  };

  const isConnected = integrationSettings[service].connected;

  return (
    <div>
      <h4 className="font-semibold text-gray-800">{title}</h4>
      {isConnected ? (
        <div className="mt-2 flex items-center justify-between bg-green-50 p-3 rounded-md">
          <div>
            <p className="text-sm font-medium text-green-800">Connected</p>
            <p className="text-sm text-gray-600 truncate">{integrationSettings[service].identifier}</p>
          </div>
          <button onClick={handleDisconnect} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={placeholder}
              className="flex-grow w-full border-gray-300 rounded-md shadow-sm text-sm"
            />
            <button onClick={handleConnect} className="py-2 px-4 bg-brand-secondary text-white rounded-md hover:bg-brand-primary text-sm whitespace-nowrap">Connect</button>
          </div>
        </div>
      )}
    </div>
  );
};


// Modal for editing transactions
const EditTransactionModal: React.FC<{
  transaction: Transaction;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}> = ({ transaction, onClose, onSave }) => {
  const [formData, setFormData] = useState(transaction);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Edit Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Classmate Name</label>
            <input type="text" name="classmateName" value={formData.classmateName} onChange={handleChange} required className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="mt-1 w-full border-gray-300 rounded-md shadow-sm" min="0.01" step="0.01"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
              {Object.values(PaymentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Type</label>
            <select name="paymentType" value={formData.paymentType} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm">
                {Object.values(PaymentType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Transaction ID (Optional)</label>
            <input type="text" name="transactionId" value={formData.transactionId || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const ReconciliationModal: React.FC<{
  duplicateGroups: Transaction[][];
  onClose: () => void;
  onDeleteTransactions: (ids: number[]) => void;
}> = ({ duplicateGroups, onClose, onDeleteTransactions }) => {
  const [transactionsToDelete, setTransactionsToDelete] = useState<Set<number>>(new Set());

  const handleToggleDelete = (id: number) => {
    setTransactionsToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSmartSelect = (group: Transaction[]) => {
    const sortedGroup = [...group].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id);
    const idsToSelect = sortedGroup.slice(1).map(tx => tx.id);
    setTransactionsToDelete(prev => {
      const newSet = new Set(prev);
      idsToSelect.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const isDeleteDisabled = useMemo(() => {
    if (transactionsToDelete.size === 0) return true;
    for (const group of duplicateGroups) {
      if (group.every(tx => transactionsToDelete.has(tx.id))) {
        return true;
      }
    }
    return false;
  }, [transactionsToDelete, duplicateGroups]);

  const handleDelete = () => {
    if (isDeleteDisabled) {
        if (transactionsToDelete.size === 0) {
            alert('No transactions selected for deletion.');
        } else {
            alert('You cannot delete all transactions in a group. Please keep at least one.');
        }
        return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${transactionsToDelete.size} selected transaction(s)? This action cannot be undone.`)) {
        onDeleteTransactions(Array.from(transactionsToDelete));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-brand-text">Reconcile Duplicate Transactions</h2>
        <p className="text-sm text-gray-600 mb-6">The following groups of transactions appear to be duplicates based on matching Payment Type, Transaction ID, and Amount. Please review and select the records you wish to delete. You must keep at least one transaction in each group.</p>
        
        <div className="flex-grow overflow-y-auto pr-4 space-y-6">
          {duplicateGroups.map((group, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="sm:flex sm:justify-between sm:items-center mb-3">
                <div>
                    <h4 className="font-semibold text-lg text-brand-secondary">Duplicate Group {index + 1}</h4>
                    <p className="text-xs text-gray-500">
                        {group[0].paymentType} / ID: {group[0].transactionId} / Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(group[0].amount)}
                    </p>
                </div>
                <button onClick={() => handleSmartSelect(group)} className="mt-2 sm:mt-0 text-sm bg-brand-accent/20 text-brand-primary hover:bg-brand-accent/30 font-semibold py-1 px-3 rounded-full">
                    Keep Oldest, Select Rest
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 p-2" aria-label="Select"></th>
                      <th className="p-2 text-left font-medium text-gray-500">Date</th>
                      <th className="p-2 text-left font-medium text-gray-500">Classmate</th>
                      <th className="p-2 text-left font-medium text-gray-500">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map(tx => (
                      <tr key={tx.id} className={`${transactionsToDelete.has(tx.id) ? 'bg-red-50' : ''}`}>
                        <td className="p-2 text-center">
                            <input 
                                type="checkbox" 
                                className="h-4 w-4 text-brand-primary focus:ring-brand-secondary border-gray-300 rounded"
                                checked={transactionsToDelete.has(tx.id)}
                                onChange={() => handleToggleDelete(tx.id)}
                                aria-label={`Select transaction ${tx.id} for deletion`}
                            />
                        </td>
                        <td className="p-2 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="p-2 whitespace-nowrap font-medium">{tx.classmateName}</td>
                        <td className="p-2 whitespace-nowrap">{tx.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
          <button type="button" onClick={onClose} className="py-2 px-6 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={isDeleteDisabled}
            className="py-2 px-6 bg-danger text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={isDeleteDisabled ? 'You must select at least one transaction and keep at least one per group.' : ''}
          >
            Delete Selected ({transactionsToDelete.size})
          </button>
        </div>
      </div>
    </div>
  );
};



const Admin: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, clearTransactions, announcements, addAnnouncement, deleteAnnouncement, setLogo, subtitle, setSubtitle, integrationSettings } = useData();
  
  const [manualTx, setManualTx] = useState({ classmateName: '', amount: '', category: PaymentCategory.Dues, description: '', transactionId: '' });
  const [announcement, setAnnouncement] = useState({ title: '', content: '' });
  const [announcementImage, setAnnouncementImage] = useState<File | null>(null);
  const [announcementImagePreview, setAnnouncementImagePreview] = useState<string | null>(null);
  const announcementImageInputRef = useRef<HTMLInputElement>(null);

  const [fbPost, setFbPost] = useState({ title: '', url: '' });
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [foundDuplicates, setFoundDuplicates] = useState<Transaction[][]>([]);

  const handleManualTxChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setManualTx(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAnnouncementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAnnouncement(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAnnouncementImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setAnnouncementImage(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setAnnouncementImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      } else {
          setAnnouncementImage(null);
          setAnnouncementImagePreview(null);
      }
  };

  const handleFbPostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFbPost(prev => ({...prev, [name]: value }));
  }

  const handleManualTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTx.classmateName && manualTx.amount) {
      addTransaction({
          date: new Date().toISOString().split('T')[0],
          description: manualTx.description || `${manualTx.category} (Manual)`,
          category: manualTx.category,
          amount: parseFloat(manualTx.amount),
          classmateName: manualTx.classmateName,
          paymentType: PaymentType.ManualEntry,
          transactionId: manualTx.transactionId || undefined,
      });
      alert('Transaction added successfully!');
      setManualTx({ classmateName: '', amount: '', category: PaymentCategory.Dues, description: '', transactionId: '' });
    }
  };
  
  const resetAnnouncementForm = () => {
      alert('Announcement posted successfully!');
      setAnnouncement({ title: '', content: '' });
      setAnnouncementImage(null);
      setAnnouncementImagePreview(null);
      if (announcementImageInputRef.current) {
          announcementImageInputRef.current.value = "";
      }
  };

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(announcement.title && announcement.content) {
          const newAnnouncementData: Omit<Announcement, 'id'> = {
              title: announcement.title,
              content: announcement.content,
              date: new Date().toISOString().split('T')[0],
              type: 'text',
          };

          if (announcementImage) {
              const reader = new FileReader();
              reader.onloadend = () => {
                  addAnnouncement({
                      ...newAnnouncementData,
                      imageUrl: reader.result as string,
                  });
                  resetAnnouncementForm();
              };
              reader.readAsDataURL(announcementImage);
          } else {
              addAnnouncement(newAnnouncementData);
              resetAnnouncementForm();
          }
      }
  };
  
  const handleFbPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fbPost.title && fbPost.url) {
      addAnnouncement({
        title: fbPost.title,
        content: `Facebook Post: ${fbPost.url}`, // For fallback
        date: new Date().toISOString().split('T')[0],
        type: 'facebook',
        url: fbPost.url,
      });
      alert('Facebook post embedded successfully!');
      setFbPost({ title: '', url: '' });
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }
    const file = e.target.files[0];

    if (type === 'logo') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
        setUploadStatus(prev => ({...prev, logo: `Logo '${file.name}' uploaded!`}));
      };
      reader.readAsDataURL(file);
    } else if (type === 'excel') {
      setUploadStatus(prev => ({...prev, excel: `Processing '${file.name}'...`}));
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            let importedCount = 0;
            (results.data as any[]).forEach(row => {
              // Normalize headers (case-insensitive, ignore spaces)
              const normalizedRow: {[key: string]: any} = {};
              for (const key in row) {
                  normalizedRow[key.trim().toLowerCase().replace(/\s/g, '')] = row[key];
              }

              const amountStr = normalizedRow.amount || normalizedRow.debit || normalizedRow.credit || '0';
              const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g,""));

              const name = normalizedRow.classmatename || normalizedRow.name;

              if (!normalizedRow.date || !name || isNaN(amount) || amount === 0) {
                  console.warn('Skipping invalid row:', row);
                  return; // Skip rows without essential data
              }

              const categoryString = normalizedRow.category || 'Simple-Deposit';
              const category = Object.values(PaymentCategory).find(c => c.toLowerCase() === categoryString.toLowerCase()) || PaymentCategory.SimpleDeposit;
              
              const newTransaction: Omit<Transaction, 'id'> = {
                date: new Date(normalizedRow.date).toISOString().split('T')[0],
                classmateName: name,
                amount: amount,
                category: category,
                description: normalizedRow.description || `${category} - Imported`,
                paymentType: PaymentType.ImportedExcel,
                transactionId: normalizedRow.transactionid || undefined,
              };

              addTransaction(newTransaction);
              importedCount++;
            });

            if (importedCount > 0) {
                setUploadStatus(prev => ({...prev, excel: `Successfully imported ${importedCount} transactions from '${file.name}'!`}));
            } else {
                setUploadStatus(prev => ({...prev, excel: `Could not find any valid transactions to import from '${file.name}'. Please check the file format.`}));
            }
          } catch (error) {
            console.error("Error processing CSV data:", error);
            setUploadStatus(prev => ({...prev, excel: `Error processing '${file.name}'. Please check the console for details.`}));
          }
        },
        error: (error: any) => {
          console.error("PapaParse error:", error);
          setUploadStatus(prev => ({...prev, excel: `Failed to parse '${file.name}': ${error.message}`}));
        }
      });
    }
  };
  
  const handleImport = (source: string) => {
      setUploadStatus(prev => ({...prev, [source]: `Simulating import from ${source}...`}));
      setTimeout(() => {
        setUploadStatus(prev => ({...prev, [source]: `Successfully imported transactions from ${source}!`}));
      }, 2500);
  };
  
  const handleDeleteTx = (transactionId: number) => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      deleteTransaction(transactionId);
    }
  };
  
  const handleDeleteAnnouncement = (announcementId: number) => {
      if (window.confirm('Are you sure you want to delete this announcement?')) {
          deleteAnnouncement(announcementId);
      }
  };
  
  const handleClearDatabase = () => {
      if (window.confirm('DANGER: This will delete ALL transaction records and reset the class balance to $0. This action is irreversible. Are you absolutely sure?')) {
          clearTransactions();
          alert('All transactions have been cleared.');
      }
  }

  const handleReconcileClick = () => {
    const potentialDuplicates = transactions.filter(tx => tx.transactionId && tx.paymentType && tx.transactionId.trim() !== '');

    const groups = new Map<string, Transaction[]>();

    potentialDuplicates.forEach(tx => {
        const key = `${tx.paymentType}|${tx.transactionId!.trim().toUpperCase()}|${tx.amount}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(tx);
    });

    const duplicateGroups = Array.from(groups.values()).filter(group => group.length > 1);
    
    if (duplicateGroups.length > 0) {
        setFoundDuplicates(duplicateGroups);
        setShowReconciliationModal(true);
    } else {
        alert('No duplicate transactions found based on Payment Type, Transaction ID, and Amount.');
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.classmateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-brand-text">Administrator Panel</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <AdminCard title="App Customization">
            <div className="space-y-4">
               <div>
                  <label className="text-sm font-medium">Update Class Logo</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent/20 file:text-brand-primary hover:file:bg-brand-accent/30"/>
                  {uploadStatus.logo && <p className="text-sm text-success mt-2">{uploadStatus.logo}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Update App Subtitle</label>
                  <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g., A.E. Beach High C/o 89 Bulldogs" className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
                  <p className="text-xs text-gray-500 mt-1">Appears on the login screen and header.</p>
                </div>
            </div>
          </AdminCard>
          
          <AdminCard title="Payment Integration Settings">
            <div className="space-y-6">
              <IntegrationManager service="cashApp" title="CashApp" label="$Cashtag" placeholder="$your-cashtag" />
              <IntegrationManager service="payPal" title="PayPal" label="PayPal.Me Username or Email" placeholder="your-paypal" />
              <IntegrationManager service="zelle" title="Zelle" label="Email or Phone Number" placeholder="your-email@example.com" />
              <IntegrationManager service="bank" title="Bank Checking Account" label="Account Number (Last 4 Digits)" placeholder="1234" />
            </div>
          </AdminCard>
          
          <AdminCard title="Manage Announcements">
              {/* New Text Announcement */}
              <form onSubmit={handleAnnouncementSubmit} className="space-y-4 p-4 border rounded-md">
                  <h4 className="font-semibold">Post a New Announcement</h4>
                  <input type="text" name="title" placeholder="Announcement Title" value={announcement.title} onChange={handleAnnouncementChange} required className="w-full border-gray-300 rounded-md shadow-sm"/>
                  <textarea name="content" placeholder="Announcement Content" value={announcement.content} onChange={handleAnnouncementChange} required className="w-full border-gray-300 rounded-md shadow-sm" rows={3}></textarea>
                  <div>
                    <label className="text-sm font-medium">Attach an Image (Optional)</label>
                    <input type="file" accept="image/*" ref={announcementImageInputRef} onChange={handleAnnouncementImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"/>
                  </div>
                  {announcementImagePreview && <img src={announcementImagePreview} alt="Preview" className="mt-2 h-24 w-auto rounded-md object-cover"/>}
                  <button type="submit" className="w-full bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary">Post Text Announcement</button>
              </form>
              
              {/* Embed FB Post */}
               <form onSubmit={handleFbPostSubmit} className="space-y-4 p-4 border rounded-md mt-4">
                  <h4 className="font-semibold">Embed a Facebook Post</h4>
                  <input type="text" name="title" placeholder="Post Title (e.g., Reunion Details)" value={fbPost.title} onChange={handleFbPostChange} required className="w-full border-gray-300 rounded-md shadow-sm"/>
                  <input type="url" name="url" placeholder="Facebook Post URL" value={fbPost.url} onChange={handleFbPostChange} required className="w-full border-gray-300 rounded-md shadow-sm"/>
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Embed Facebook Post</button>
              </form>

              {/* Existing Announcements */}
              <div className="mt-6 space-y-2">
                <h4 className="font-semibold border-t pt-4">Existing Announcements</h4>
                {announcements.map(ann => (
                  <div key={ann.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span className="text-sm truncate pr-2">{ann.title}</span>
                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-danger hover:text-red-700 font-medium text-sm flex-shrink-0">Delete</button>
                  </div>
                ))}
              </div>
          </AdminCard>
          
           <AdminCard title="Danger Zone" borderColor="border-danger">
              <p className="text-sm text-gray-600 mb-4">These actions are permanent and cannot be undone. Proceed with caution.</p>
              <button onClick={handleClearDatabase} className="w-full bg-danger text-white py-2 px-4 rounded-md hover:bg-red-700 font-bold">
                Zero Out Database (Clear All Transactions)
              </button>
          </AdminCard>
        </div>
        
        <div className="space-y-8">
          <AdminCard title="Import Transactions">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Upload Excel/CSV File</label>
                    <input type="file" accept=".csv, .xlsx, .xls" onChange={(e) => handleFileUpload(e, 'excel')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent/20 file:text-brand-primary hover:file:bg-brand-accent/30"/>
                    {uploadStatus.excel && <p className="text-sm text-success mt-2">{uploadStatus.excel}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleImport('CashApp')} disabled={!integrationSettings.cashApp.connected} className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">Import from CashApp</button>
                    <button onClick={() => handleImport('PayPal')} disabled={!integrationSettings.payPal.connected} className="bg-blue-800 text-white py-2 px-4 rounded-md hover:bg-blue-900 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">Import from PayPal</button>
                    <button onClick={() => handleImport('Zelle')} disabled={!integrationSettings.zelle.connected} className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">Import from Zelle</button>
                    <button onClick={() => handleImport('Bank')} disabled={!integrationSettings.bank.connected} className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">Import from Bank</button>
                </div>
                 {Object.keys(uploadStatus).filter(k => k !== 'logo' && k !== 'excel').map(key => 
                    uploadStatus[key] && <p key={key} className="text-sm text-success mt-2">{uploadStatus[key]}</p>
                )}
            </div>
          </AdminCard>
          <AdminCard title="Manually Enter Transaction">
            <form onSubmit={handleManualTxSubmit} className="space-y-4">
              <input type="text" name="classmateName" placeholder="Classmate Name" value={manualTx.classmateName} onChange={handleManualTxChange} required className="w-full border-gray-300 rounded-md shadow-sm"/>
              <input type="number" name="amount" placeholder="Amount" value={manualTx.amount} onChange={handleManualTxChange} required className="w-full border-gray-300 rounded-md shadow-sm" min="0.01" step="0.01"/>
              <select name="category" value={manualTx.category} onChange={handleManualTxChange} className="w-full border-gray-300 rounded-md shadow-sm">
                  {Object.values(PaymentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input type="text" name="description" placeholder="Description (Optional)" value={manualTx.description} onChange={handleManualTxChange} className="w-full border-gray-300 rounded-md shadow-sm"/>
              <input type="text" name="transactionId" placeholder="Transaction ID (Optional)" value={manualTx.transactionId} onChange={handleManualTxChange} className="w-full border-gray-300 rounded-md shadow-sm"/>
              <button type="submit" className="w-full bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary">Add Transaction</button>
            </form>
          </AdminCard>
        </div>
      </div>

      <div className="mt-8">
        <AdminCard title="Manage All Transactions">
          <div className="sm:flex sm:items-center sm:justify-between mb-4">
            <input type="text" placeholder="Search by name or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-auto border-gray-300 rounded-md shadow-sm"/>
            <button 
              onClick={handleReconcileClick}
              className="mt-2 sm:mt-0 w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-4 bg-brand-secondary text-white rounded-md hover:bg-brand-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2l4.45-1.483a1 1 0 011.212 1.212L18.324 11.4l4.938 1.646a1 1 0 01-.434 1.898l-5.457-1.819-2.23 4.46a1 1 0 01-1.789 0l-2.23-4.46-5.457 1.819a1 1 0 01-.434-1.898L7.676 11.4 6.193 6.93a1 1 0 011.212-1.212l4.45 1.483.179-4.457A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Reconcile Duplicates
            </button>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Classmate</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{tx.classmateName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{tx.category}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs">{tx.paymentType}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 truncate" title={tx.transactionId}>{tx.transactionId || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}</td>
                    <td className="px-4 py-2 whitespace-nowrap space-x-2">
                      <button onClick={() => setEditingTransaction(tx)} className="text-brand-secondary hover:text-brand-primary font-medium">Edit</button>
                      <button onClick={() => handleDeleteTx(tx.id)} className="text-danger hover:text-red-700 font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
                 {filteredTransactions.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-500">No matching transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>

      {editingTransaction && (
        <EditTransactionModal 
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={(updatedTx) => {
            updateTransaction(updatedTx);
            setEditingTransaction(null);
          }}
        />
      )}
      {showReconciliationModal && (
        <ReconciliationModal
          duplicateGroups={foundDuplicates}
          onClose={() => setShowReconciliationModal(false)}
          onDeleteTransactions={(ids) => {
            ids.forEach(id => deleteTransaction(id));
            setShowReconciliationModal(false);
            alert(`${ids.length} duplicate transaction(s) deleted successfully.`);
          }}
        />
      )}
    </div>
  );
};

export default Admin;