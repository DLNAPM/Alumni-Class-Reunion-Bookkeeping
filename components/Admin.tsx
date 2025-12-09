
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory, Transaction, PaymentType, IntegrationSettings, Announcement } from '../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Fix: Removed unused and incorrect EditableTransaction type. The Transaction type is used directly for editing.
type BulkEditData = {
  category?: PaymentCategory;
  paymentType?: PaymentType;
  classmateName?: string;
};


const Admin: React.FC = () => {
  const { 
    user,
    transactions, addTransaction, updateTransaction, updateTransactions, deleteTransaction, deleteTransactions, clearTransactions, 
    logo, setLogo, subtitle, setSubtitle, integrationSettings, updateIntegrationSettings,
    announcements, addAnnouncement, deleteAnnouncement, uploadTransactionAttachment
  } = useData();
  
  const isReadOnly = user?.role === 'Admin_ro';

  // Fix: Changed editingTransaction state to use the correct Transaction type.
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    classmateName: '',
    amount: 0,
    description: '',
    category: PaymentCategory.Dues,
    paymentType: PaymentType.Other,
    transactionId: '',
  });

  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<Transaction[][]>([]);
  // Fix: Transaction IDs are strings. Changed state to hold a Set of strings.
  const [transactionsToDelete, setTransactionsToDelete] = useState<Set<string>>(new Set());
  
  // Fix: Transaction IDs are strings. Changed state to hold a Set of strings.
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({});

  // Customization state
  const [tempLogo, setTempLogo] = useState(logo);
  const [tempSubtitle, setTempSubtitle] = useState(subtitle);

  // Announcement state
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'text' as 'text' | 'facebook', url: '', imageUrl: '' });

  // Integration state
  const [tempIntegrationSettings, setTempIntegrationSettings] = useState(integrationSettings);

  const handleNewTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
  };
  
  const handleNewTransactionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(true);
      try {
        const url = await uploadTransactionAttachment(file);
        setNewTransaction(prev => ({ ...prev, attachmentUrl: url, attachmentName: file.name }));
      } catch (err) {
        console.error("Upload failed", err);
        alert("Failed to upload file");
      } finally {
        setUploadingFile(false);
      }
    }
  };

  const handleEditTransactionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingTransaction) {
      setUploadingFile(true);
      try {
        const url = await uploadTransactionAttachment(file);
        setEditingTransaction(prev => prev ? ({ ...prev, attachmentUrl: url, attachmentName: file.name }) : null);
      } catch (err) {
        console.error("Upload failed", err);
        alert("Failed to upload file");
      } finally {
        setUploadingFile(false);
      }
    }
  };

  const handleAddNewTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTransaction.classmateName && newTransaction.amount !== undefined) {
      addTransaction(newTransaction);
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        classmateName: '',
        amount: 0,
        description: '',
        category: PaymentCategory.Dues,
        paymentType: PaymentType.Other,
        transactionId: '',
      });
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingTransaction(null);
    setIsEditModalOpen(false);
  };

  // Fix: Simplified handler to work with the correct Transaction type, removing the need for a type cast.
  const handleUpdateTransaction = () => {
    if (editingTransaction) {
      updateTransaction(editingTransaction);
      closeEditModal();
    }
  };
  
  // Fix: The transaction ID is a string. Changed parameter type from number to string.
  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.classmateName.toLowerCase().includes(filter.toLowerCase()) ||
      t.description.toLowerCase().includes(filter.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.toLowerCase()) ||
      t.paymentType.toLowerCase().includes(filter.toLowerCase()) ||
      (t.transactionId && t.transactionId.toLowerCase().includes(filter.toLowerCase()))
    );
  }, [transactions, filter]);

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
    setSelectedTransactions(new Set());
  };
  
  const getSortIndicator = (key: keyof Transaction) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const handleClearTransactions = () => {
    if (window.confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
      clearTransactions();
    }
  };
  
  const parseAmount = (amountStr: any): number => {
    if (typeof amountStr === 'number') return amountStr;
    if (typeof amountStr !== 'string') return 0;
    const cleaned = amountStr.replace(/[$,\s]/g, '').trim();
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      return -parseFloat(cleaned.substring(1, cleaned.length - 1));
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };
  
  const parseDate = (dateValue: any): string | null => {
    if (!dateValue) return null;
    if (typeof dateValue === 'number') { // Excel date serial number
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
        return date.toISOString().split('T')[0];
    }
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    // Handle '6-Jun-09' format
    const parts = String(dateValue).match(/(\d{1,2})-(\w{3})-(\d{2,4})/);
    if (parts) {
      const year = parseInt(parts[3]);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      const parsedDate = new Date(`${parts[1]} ${parts[2]} ${fullYear}`);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
    return null;
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus({ message: `Processing '${file.name}'...`, type: 'info' });

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            let jsonData: any[];

            if (file.name.endsWith('.csv')) {
                const result = Papa.parse(data as string, { header: true, skipEmptyLines: true });
                jsonData = result.data;
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            } else {
                throw new Error("Unsupported file type. Please upload a CSV or Excel file.");
            }

            const newTransactions: Omit<Transaction, 'id'>[] = [];
            const header = Object.keys(jsonData[0] || {}).map(h => h.toLowerCase().replace(/\s+/g, ''));
            
            const findHeader = (possibleNames: string[]) => {
              for (const name of possibleNames) {
                  const normalizedName = name.toLowerCase().replace(/\s+/g, '');
                  const index = header.findIndex(h => h.includes(normalizedName));
                  if (index !== -1) {
                      return Object.keys(jsonData[0])[index];
                  }
              }
              return null;
            };

            const dateKey = findHeader(['date']);
            const nameKey = findHeader(['classmate', 'name']);
            const amountKey = findHeader(['amount']);
            const descKey = findHeader(['description', 'desc']);
            const catKey = findHeader(['category']);
            const paymentTypeKey = findHeader(['paymenttype', 'type']);
            const transactionIdKey = findHeader(['transactionid', 'txid']);

            for (const row of jsonData) {
                const date = dateKey ? parseDate(row[dateKey]) : null;
                const amount = amountKey ? parseAmount(row[amountKey]) : 0;
                
                if (!date && !(nameKey && row[nameKey])) {
                  continue; // Skip rows without a date or a name
                }
                
                const categoryStr = catKey && row[catKey] ? String(row[catKey]).trim().toLowerCase() : '';
                const matchedCategory = Object.values(PaymentCategory).find(cat => cat.toLowerCase() === categoryStr);

                const paymentTypeStr = paymentTypeKey && row[paymentTypeKey] ? String(row[paymentTypeKey]).trim().toLowerCase() : '';
                const matchedPaymentType = Object.values(PaymentType).find(pt => pt.toLowerCase() === paymentTypeStr);

                const newTx: Omit<Transaction, 'id'> = {
                    date: date || new Date().toISOString().split('T')[0],
                    classmateName: nameKey ? String(row[nameKey] || 'N/A') : 'N/A',
                    amount: amount,
                    description: descKey ? String(row[descKey] || '') : '',
                    category: matchedCategory || PaymentCategory.SimpleDeposit,
                    paymentType: matchedPaymentType || PaymentType.Other,
                    transactionId: transactionIdKey ? String(row[transactionIdKey] || '') : undefined,
                };

                newTransactions.push(newTx);
            }

            if (newTransactions.length > 0) {
                newTransactions.forEach(addTransaction);
                setImportStatus({ message: `Successfully imported ${newTransactions.length} transactions from '${file.name}'.`, type: 'success' });
            } else {
                setImportStatus({ message: `Could not find any valid transactions to import from '${file.name}'. Please check the file format.`, type: 'error' });
            }
        } catch (error) {
            console.error("File processing error:", error);
            setImportStatus({ message: `Error processing '${file.name}': ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset file input
            }
        }
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
  };

  const findDuplicates = useCallback(() => {
    const duplicatesMap = new Map<string, Transaction[]>();
    transactions.forEach(t => {
      if (t.transactionId && t.paymentType) {
        const key = `${t.paymentType}-${t.transactionId}-${t.amount}`;
        if (!duplicatesMap.has(key)) {
          duplicatesMap.set(key, []);
        }
        duplicatesMap.get(key)!.push(t);
      }
    });
    
    const groups = Array.from(duplicatesMap.values()).filter(group => group.length > 1);
    setDuplicateGroups(groups);
    setTransactionsToDelete(new Set());
    setReconciliationModalOpen(true);
  }, [transactions]);

  // Fix: The transaction ID is a string. Changed parameter type from number to string.
  const toggleTransactionToDelete = (id: string) => {
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

  const handleReconciliationDelete = () => {
    if (transactionsToDelete.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${transactionsToDelete.size} duplicate transaction(s)?`)) {
      deleteTransactions(Array.from(transactionsToDelete));
      setReconciliationModalOpen(false);
    }
  };

  const selectForDeletion = (group: Transaction[]) => {
      const sortedGroup = [...group].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const toDelete = sortedGroup.slice(1).map(t => t.id);
      setTransactionsToDelete(prev => {
          const newSet = new Set(prev);
          toDelete.forEach(id => newSet.add(id));
          return newSet;
      });
  };
  
  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTransactions(new Set(sortedTransactions.map(t => t.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  // Fix: The transaction ID is a string. Changed parameter type from number to string.
  const handleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTransactions.size} selected transactions? This action cannot be undone.`)) {
      deleteTransactions(Array.from(selectedTransactions));
      setSelectedTransactions(new Set());
    }
  };

  const handleBulkEditChange = (field: keyof BulkEditData, value: string) => {
    setBulkEditData(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const handleApplyBulkEdit = () => {
    const changes = Object.fromEntries(
      Object.entries(bulkEditData).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(changes).length === 0) {
      alert("No changes specified.");
      return;
    }

    const transactionsToUpdate = transactions
      .filter(t => selectedTransactions.has(t.id))
      .map(t => ({ ...t, ...changes }));

    if (transactionsToUpdate.length > 0) {
      updateTransactions(transactionsToUpdate);
    }

    setIsBulkEditModalOpen(false);
    setSelectedTransactions(new Set());
    setBulkEditData({});
  };

  const handleCustomizationSave = () => {
    setLogo(tempLogo);
    setSubtitle(tempSubtitle);
    alert('Customization saved!');
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if(newAnnouncement.title && (newAnnouncement.content || newAnnouncement.url)) {
      const announcementToAdd: Omit<Announcement, 'id' | 'date'> = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type,
      };
      if (newAnnouncement.type === 'facebook' && newAnnouncement.url) {
        announcementToAdd.url = newAnnouncement.url;
      }
      if (newAnnouncement.imageUrl) {
        announcementToAdd.imageUrl = newAnnouncement.imageUrl;
      }
      addAnnouncement(announcementToAdd);
      setNewAnnouncement({ title: '', content: '', type: 'text', url: '', imageUrl: '' });
    }
  };
  
  const handleIntegrationSettingsChange = (service: keyof IntegrationSettings, field: keyof IntegrationSettings[keyof IntegrationSettings], value: string | boolean) => {
      setTempIntegrationSettings(prev => ({
          ...prev,
          [service]: {
              ...prev[service],
              [field]: value,
          }
      }));
  };

  const saveIntegrationSettings = () => {
      (Object.keys(tempIntegrationSettings) as Array<keyof IntegrationSettings>).forEach(service => {
          updateIntegrationSettings(service, tempIntegrationSettings[service]);
      });
      alert('Integration settings saved!');
  };

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      const isIndeterminate = selectedTransactions.size > 0 && selectedTransactions.size < sortedTransactions.length;
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedTransactions, sortedTransactions.length]);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-brand-text">Admin Panel {isReadOnly && <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">(Read-Only)</span>}</h2>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Manage All Transactions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="sm:flex sm:items-center sm:justify-between mb-4">
              <h3 className="text-xl font-semibold">Manage All Transactions</h3>
              <div className="mt-4 sm:mt-0 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Filter transactions..." 
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md" 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                 {!isReadOnly && <button onClick={findDuplicates} className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 whitespace-nowrap">Reconcile Duplicates</button>}
              </div>
            </div>
             {importStatus && (
              <div className={`p-4 mb-4 text-sm rounded-lg ${
                importStatus.type === 'success' ? 'bg-green-100 text-green-700' : 
                importStatus.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`} role="alert">
                <span className="font-medium">{importStatus.type.charAt(0).toUpperCase() + importStatus.type.slice(1)}:</span> {importStatus.message}
              </div>
            )}
             {!isReadOnly && selectedTransactions.size > 0 && (
              <div className="bg-brand-secondary text-white p-3 rounded-lg shadow-md mb-4 flex items-center justify-between sticky top-0 z-10">
                <span className="font-semibold">{selectedTransactions.size} transaction(s) selected</span>
                <div className="flex gap-4 items-center">
                  <button onClick={() => setIsBulkEditModalOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-md text-sm font-medium">Edit Selected</button>
                  <button onClick={handleBulkDelete} className="bg-danger hover:bg-red-700 px-3 py-1 rounded-md text-sm font-medium">Delete Selected</button>
                  <button onClick={() => setSelectedTransactions(new Set())} className="text-white hover:text-gray-200 text-sm font-light">Clear Selection</button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto max-h-[600px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-5">
                  <tr>
                    {!isReadOnly && (
                    <th className="px-4 py-2 w-12">
                       <input
                          ref={selectAllRef}
                          type="checkbox"
                          className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                          onChange={handleSelectAll}
                          checked={sortedTransactions.length > 0 && selectedTransactions.size === sortedTransactions.length}
                        />
                    </th>
                    )}
                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('date')}>Date {getSortIndicator('date')}</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('classmateName')}>Classmate {getSortIndicator('classmateName')}</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('description')}>Description {getSortIndicator('description')}</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('category')}>Category {getSortIndicator('category')}</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('paymentType')}>Payment Type {getSortIndicator('paymentType')}</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('transactionId')}>Transaction ID {getSortIndicator('transactionId')}</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('amount')}>Amount {getSortIndicator('amount')}</th>
                    <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                    {!isReadOnly && <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTransactions.map(t => (
                    <tr key={t.id} className={selectedTransactions.has(t.id) ? 'bg-brand-accent/20' : ''}>
                      {!isReadOnly && (
                      <td className="px-4 py-2">
                         <input
                            type="checkbox"
                            className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                            checked={selectedTransactions.has(t.id)}
                            onChange={() => handleSelectTransaction(t.id)}
                          />
                      </td>
                      )}
                      <td className="px-4 py-2 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{t.classmateName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-600 truncate max-w-xs" title={t.description}>{t.description}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{t.category}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs">{t.paymentType}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-500 truncate max-w-xs" title={t.transactionId}>{t.transactionId || ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(t.amount)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                          {t.attachmentUrl ? (
                              <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700" title={t.attachmentName || "View Receipt"}>
                                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              </a>
                          ) : (
                              <span className="text-gray-300">-</span>
                          )}
                      </td>
                      {!isReadOnly && (
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openEditModal(t)} className="text-brand-secondary hover:text-brand-primary mr-3">Edit</button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="text-danger hover:text-red-700">Delete</button>
                      </td>
                      )}
                    </tr>
                  ))}
                   {sortedTransactions.length === 0 && (
                        <tr><td colSpan={isReadOnly ? 9 : 10} className="text-center py-10 text-gray-500">No transactions match your search.</td></tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
            {/* Manage Announcements */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Manage Announcements</h3>
                {!isReadOnly && (
                <form onSubmit={handleAddAnnouncement} className="space-y-4">
                  <input type="text" placeholder="Title" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm" required />
                  <select value={newAnnouncement.type} onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value as 'text' | 'facebook'})} className="w-full border-gray-300 rounded-md shadow-sm">
                      <option value="text">Text Announcement</option>
                      <option value="facebook">Facebook Post</option>
                  </select>
                  {newAnnouncement.type === 'text' ? (
                      <textarea placeholder="Content" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm" rows={3}></textarea>
                  ) : (
                      <input type="url" placeholder="Facebook Post URL" value={newAnnouncement.url} onChange={e => setNewAnnouncement({...newAnnouncement, url: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm" required />
                  )}
                  <input type="url" placeholder="Image URL (Optional)" value={newAnnouncement.imageUrl} onChange={e => setNewAnnouncement({...newAnnouncement, imageUrl: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm" />
                  <button type="submit" className="bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary">Add Announcement</button>
                </form>
                )}
                <div className="mt-6 space-y-2 max-h-60 overflow-y-auto">
                    <h4 className="font-semibold">Current Announcements</h4>
                    {announcements.map(ann => (
                        <div key={ann.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span>{ann.title}</span>
                            {!isReadOnly && <button onClick={() => deleteAnnouncement(ann.id)} className="text-danger hover:text-red-700 text-sm">Delete</button>}
                        </div>
                    ))}
                    {announcements.length === 0 && <p className="text-gray-500 italic">No announcements found.</p>}
                </div>
            </div>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Manually Enter Transaction */}
          {!isReadOnly && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Manually Enter Transaction</h3>
            <form onSubmit={handleAddNewTransaction} className="space-y-4">
              <input type="date" name="date" value={newTransaction.date} onChange={handleNewTransactionChange} className="w-full border-gray-300 rounded-md shadow-sm" required />
              <input type="text" name="classmateName" placeholder="Classmate Name" value={newTransaction.classmateName} onChange={handleNewTransactionChange} className="w-full border-gray-300 rounded-md shadow-sm" required />
              <input type="number" step="0.01" name="amount" placeholder="Amount" value={newTransaction.amount} onChange={handleNewTransactionChange} className="w-full border-gray-300 rounded-md shadow-sm" required />
              <textarea name="description" placeholder="Description" value={newTransaction.description} onChange={handleNewTransactionChange} className="w-full border-gray-300 rounded-md shadow-sm" rows={2}></textarea>
              <select name="category" value={newTransaction.category} onChange={handleNewTransactionChange} className="w-full border-gray-300 rounded-md shadow-sm">
                {Object.values(PaymentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
               <select name="paymentType" value={newTransaction.paymentType} onChange={handleNewTransactionChange} className="w-full border-gray-300 rounded-md shadow-sm">
                {Object.values(PaymentType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
              <input type="text" name="transactionId" placeholder="Transaction ID (Optional)" value={newTransaction.transactionId} onChange={handleNewTransactionChange} className="w-full border-gray-300 rounded-md shadow-sm" />
              
              {newTransaction.category === PaymentCategory.Expense && (
              <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt/Document (JPEG, PDF)</label>
                  <input type="file" onChange={handleNewTransactionFileChange} accept=".jpg,.jpeg,.png,.bmp,.pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent/20 file:text-brand-primary hover:file:bg-brand-accent/30" />
                  {uploadingFile && <span className="text-sm text-gray-500">Uploading...</span>}
                  {newTransaction.attachmentUrl && <span className="text-sm text-green-500 block">File Attached: {newTransaction.attachmentName}</span>}
              </div>
              )}

              <button type="submit" disabled={uploadingFile} className="w-full bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary disabled:bg-gray-400">Add Transaction</button>
            </form>
          </div>
          )}

          {/* Import Transactions */}
          {!isReadOnly && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Import Transactions</h3>
            <p className="text-sm text-gray-600 mb-4">Upload a CSV or Excel file to bulk import transactions.</p>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent/20 file:text-brand-primary hover:file:bg-brand-accent/30" />
          </div>
          )}

          {/* Application Customization */}
          <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Application Customization</h3>
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                      <input type="text" value={tempLogo} onChange={e => setTempLogo(e.target.value)} disabled={isReadOnly} className="mt-1 w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Application Subtitle</label>
                      <input type="text" value={tempSubtitle} onChange={e => setTempSubtitle(e.target.value)} disabled={isReadOnly} className="mt-1 w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                  </div>
                  {!isReadOnly && <button onClick={handleCustomizationSave} className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600">Save Customization</button>}
              </div>
          </div>
          
          {/* Payment Integrations */}
          <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Payment Integrations</h3>
              <div className="space-y-4">
                  {Object.keys(tempIntegrationSettings).map(key => {
                      const service = key as keyof IntegrationSettings;
                      return (
                          <div key={service} className="p-3 border rounded-md">
                              <h4 className="font-semibold capitalize">{service}</h4>
                              <div className="flex items-center mt-2">
                                  <input type="checkbox" id={`${service}-connected`} checked={tempIntegrationSettings[service].connected} onChange={e => handleIntegrationSettingsChange(service, 'connected', e.target.checked)} disabled={isReadOnly} className="h-4 w-4 text-brand-primary border-gray-300 rounded disabled:cursor-not-allowed"/>
                                  <label htmlFor={`${service}-connected`} className="ml-2 block text-sm text-gray-900">Connected</label>
                              </div>
                              {tempIntegrationSettings[service].connected && (
                                  <input type="text" placeholder="Identifier (e.g., $cashtag)" value={tempIntegrationSettings[service].identifier} onChange={e => handleIntegrationSettingsChange(service, 'identifier', e.target.value)} disabled={isReadOnly} className="mt-2 w-full border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                              )}
                          </div>
                      );
                  })}
                  {!isReadOnly && <button onClick={saveIntegrationSettings} className="w-full bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600">Save Integrations</button>}
              </div>
          </div>

          {/* Danger Zone */}
          {!isReadOnly && (
          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-danger">
            <h3 className="text-xl font-semibold mb-4 text-danger">Danger Zone</h3>
            <button onClick={handleClearTransactions} className="w-full bg-danger text-white py-2 px-4 rounded-md hover:bg-red-700">Delete All Transactions</button>
          </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-semibold mb-4">Edit Transaction</h3>
            <div className="space-y-4">
               <input type="date" value={editingTransaction.date} onChange={e => setEditingTransaction({...editingTransaction, date: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm" />
               <input type="text" value={editingTransaction.classmateName} onChange={e => setEditingTransaction({...editingTransaction, classmateName: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm" />
               <input type="number" step="0.01" value={editingTransaction.amount} onChange={e => setEditingTransaction({...editingTransaction, amount: parseFloat(e.target.value)})} className="w-full border-gray-300 rounded-md shadow-sm" />
               <textarea value={editingTransaction.description} onChange={e => setEditingTransaction({...editingTransaction, description: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm" rows={3}></textarea>
               <select value={editingTransaction.category} onChange={e => setEditingTransaction({...editingTransaction, category: e.target.value as PaymentCategory})} className="w-full border-gray-300 rounded-md shadow-sm">
                 {Object.values(PaymentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
               <select value={editingTransaction.paymentType} onChange={e => setEditingTransaction({...editingTransaction, paymentType: e.target.value as PaymentType})} className="w-full border-gray-300 rounded-md shadow-sm">
                 {Object.values(PaymentType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
               </select>
               <input type="text" placeholder="Transaction ID" value={editingTransaction.transactionId || ''} onChange={e => setEditingTransaction({...editingTransaction, transactionId: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm" />
               
               {editingTransaction.category === PaymentCategory.Expense && (
               <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt/Document (JPEG, PDF)</label>
                  {editingTransaction.attachmentUrl && (
                      <div className="mb-2 text-sm text-gray-600">
                          Current File: <a href={editingTransaction.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{editingTransaction.attachmentName || "View File"}</a>
                      </div>
                  )}
                  <input type="file" onChange={handleEditTransactionFileChange} accept=".jpg,.jpeg,.png,.bmp,.pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent/20 file:text-brand-primary hover:file:bg-brand-accent/30" />
                  {uploadingFile && <span className="text-sm text-gray-500">Uploading...</span>}
              </div>
              )}
            </div>
            <div className="flex justify-end mt-6 space-x-4">
              <button onClick={closeEditModal} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleUpdateTransaction} disabled={uploadingFile} className="bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary disabled:bg-gray-400">Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-semibold">Bulk Edit Transactions</h3>
            <p className="text-sm text-gray-600 my-2">Editing {selectedTransactions.size} transactions. Only fill in fields you want to change. Blank fields will be ignored.</p>
            <div className="space-y-4 mt-4">
              <select value={bulkEditData.category || ''} onChange={e => handleBulkEditChange('category', e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm">
                <option value="">-- No Change to Category --</option>
                {Object.values(PaymentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={bulkEditData.paymentType || ''} onChange={e => handleBulkEditChange('paymentType', e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm">
                <option value="">-- No Change to Payment Type --</option>
                {Object.values(PaymentType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
              <input type="text" placeholder="Change Classmate Name" defaultValue={bulkEditData.classmateName || ''} onBlur={e => handleBulkEditChange('classmateName', e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div className="flex justify-end mt-6 space-x-4">
              <button onClick={() => { setIsBulkEditModalOpen(false); setBulkEditData({}); }} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleApplyBulkEdit} className="bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary">Apply Changes</button>
            </div>
          </div>
        </div>
      )}
       {/* Reconciliation Modal */}
      {reconciliationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-semibold">Reconcile Duplicates</h3>
                <button onClick={() => setReconciliationModalOpen(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            {duplicateGroups.length > 0 ? (
            <>
            <div className="flex-grow overflow-y-auto pr-2">
                {duplicateGroups.map((group, index) => (
                    <div key={index} className="mb-6 p-4 border rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">
                                Duplicate Set {index + 1}: <span className="font-normal text-gray-600">{group[0].paymentType} / {group[0].transactionId} / {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(group[0].amount)}</span>
                            </h4>
                            <button onClick={() => selectForDeletion(group)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Keep Oldest, Select Rest</button>
                        </div>
                       
                        <table className="min-w-full text-sm">
                          <thead className="text-left bg-gray-100">
                            <tr>
                              <th className="p-2 w-10">Del</th>
                              <th className="p-2">Date</th>
                              <th className="p-2">Name</th>
                              <th className="p-2">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => (
                              <tr key={t.id} className="border-t">
                                <td className="p-2"><input type="checkbox" checked={transactionsToDelete.has(t.id)} onChange={() => toggleTransactionToDelete(t.id)} className="h-4 w-4"/></td>
                                <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="p-2">{t.classmateName}</td>
                                <td className="p-2 text-gray-600 truncate max-w-xs" title={t.description}>{t.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                ))}
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t space-x-4">
              <p className="text-sm text-gray-600 self-center">{transactionsToDelete.size} transaction(s) selected for deletion.</p>
              <button onClick={() => setReconciliationModalOpen(false)} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleReconciliationDelete} disabled={transactionsToDelete.size === 0} className="bg-danger text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400">Delete Selected</button>
            </div>
            </>
            ) : (
                <p className="text-center py-10 text-gray-500">No duplicate transactions found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
