
import React, { useState, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory, Transaction, Announcement } from '../types';

// Generic card component for the admin panel sections
const AdminCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-xl font-semibold mb-4 text-brand-text border-b pb-2">{title}</h3>
    {children}
  </div>
);

const Admin: React.FC = () => {
  const { addTransaction, addAnnouncement, setLogo, subtitle, setSubtitle } = useData();

  // State for manual transaction form
  const [manualTx, setManualTx] = useState({ classmateName: '', amount: '', category: PaymentCategory.Dues, description: '' });

  // State for new announcement form
  const [announcement, setAnnouncement] = useState({ title: '', content: '' });

  // State for file uploads and imports
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});

  const handleManualTxChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setManualTx(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAnnouncementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAnnouncement(prev => ({ ...prev, [name]: value }));
  };

  const handleManualTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTx.classmateName && manualTx.amount) {
      const newTransaction: Omit<Transaction, 'id'> = {
          date: new Date().toISOString().split('T')[0],
          description: manualTx.description || `${manualTx.category} (Manual)`,
          category: manualTx.category,
          amount: parseFloat(manualTx.amount),
          classmateName: manualTx.classmateName,
      };
      addTransaction(newTransaction);
      alert('Transaction added successfully!');
      setManualTx({ classmateName: '', amount: '', category: PaymentCategory.Dues, description: '' });
    }
  };

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(announcement.title && announcement.content) {
          const newAnnouncement: Omit<Announcement, 'id'> = {
              title: announcement.title,
              content: announcement.content,
              date: new Date().toISOString().split('T')[0],
          };
          addAnnouncement(newAnnouncement);
          alert('Announcement posted successfully!');
          setAnnouncement({ title: '', content: '' });
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

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-brand-text">Administrator Panel</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-8">
          <AdminCard title="Update Class Logo">
            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent/20 file:text-brand-primary hover:file:bg-brand-accent/30"/>
            {uploadStatus.logo && <p className="text-sm text-success mt-2">{uploadStatus.logo}</p>}
          </AdminCard>

          <AdminCard title="Update App Subtitle">
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g., A.E. Beach High C/o 89 Bulldogs"
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
            <p className="text-xs text-gray-500 mt-2">This subtitle appears on the login screen and header.</p>
          </AdminCard>
          
          <AdminCard title="Post an Announcement">
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <input type="text" name="title" placeholder="Announcement Title" value={announcement.title} onChange={handleAnnouncementChange} required className="w-full border-gray-300 rounded-md shadow-sm"/>
                <textarea name="content" placeholder="Announcement Content" value={announcement.content} onChange={handleAnnouncementChange} required className="w-full border-gray-300 rounded-md shadow-sm" rows={4}></textarea>
                <button type="submit" className="w-full bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary">Post Announcement</button>
            </form>
          </AdminCard>
          
          <AdminCard title="Import Transactions">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Upload Excel/CSV File</label>
                    <input type="file" accept=".csv, .xlsx, .xls" onChange={(e) => handleFileUpload(e, 'excel')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent/20 file:text-brand-primary hover:file:bg-brand-accent/30"/>
                    {uploadStatus.excel && <p className="text-sm text-success mt-2">{uploadStatus.excel}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleImport('CashApp')} className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 text-sm">Import from CashApp</button>
                    <button onClick={() => handleImport('PayPal')} className="bg-blue-800 text-white py-2 px-4 rounded-md hover:bg-blue-900 text-sm">Import from PayPal</button>
                    <button onClick={() => handleImport('Zelle')} className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 text-sm">Import from Zelle</button>
                    <button onClick={() => handleImport('Bank')} className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 text-sm">Import from Bank</button>
                </div>
                 {Object.keys(uploadStatus).filter(k => k !== 'logo' && k !== 'excel').map(key => 
                    uploadStatus[key] && <p key={key} className="text-sm text-success mt-2">{uploadStatus[key]}</p>
                )}
            </div>
          </AdminCard>
        </div>

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
  );
};

export default Admin;
