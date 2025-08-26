import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory, Transaction, Announcement, IntegrationSettings, PaymentType } from '../types';

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
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const Admin: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, clearTransactions, announcements, addAnnouncement, deleteAnnouncement, setLogo, subtitle, setSubtitle, integrationSettings } = useData();
  
  const [manualTx, setManualTx] = useState({ classmateName: '', amount: '', category: PaymentCategory.Dues, description: '' });
  const [announcement, setAnnouncement] = useState({ title: '', content: '' });
  const [announcementImage, setAnnouncementImage] = useState<File | null>(null);
  const [announcementImagePreview, setAnnouncementImagePreview] = useState<string | null>(null);
  const announcementImageInputRef = useRef<HTMLInputElement>(null);

  const [fbPost, setFbPost] = useState({ title: '', url: '' });
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      });
      alert('Transaction added successfully!');
      setManualTx({ classmateName: '', amount: '', category: PaymentCategory.Dues, description: '' });
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
       if (type === 'logo') {
         const reader = new FileReader();
         reader.onloadend = () => {
           setLogo(reader.result as string);
           setUploadStatus(prev => ({...prev, logo: `Logo '${file.name}' uploaded!`}));
         };
         reader.readAsDataURL(file);
      } else {
        setUploadStatus(prev => ({...prev, [type]: `Simulating upload for '${file.name}'...`}));
        setTimeout(() => {
          setUploadStatus(prev => ({...prev, [type]: `Successfully processed '${file.name}'!`}));
        }, 2000);
      }
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
              <button type="submit" className="w-full bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary">Add Transaction</button>
            </form>
          </AdminCard>
        </div>
      </div>

      <div className="mt-8">
        <AdminCard title="Manage All Transactions">
          <input type="text" placeholder="Search by name or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm mb-4"/>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Classmate</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
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
                    <td className="px-4 py-2 whitespace-nowrap">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}</td>
                    <td className="px-4 py-2 whitespace-nowrap space-x-2">
                      <button onClick={() => setEditingTransaction(tx)} className="text-brand-secondary hover:text-brand-primary font-medium">Edit</button>
                      <button onClick={() => handleDeleteTx(tx.id)} className="text-danger hover:text-red-700 font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
                 {filteredTransactions.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-500">No matching transactions found.</td></tr>
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
    </div>
  );
};

export default Admin;