
import React, { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 id="help-modal-title" className="text-xl font-bold text-gray-900">Application Guide</h3>
            <p className="text-sm text-gray-500">Everything you need to know to get started.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-3xl font-light" aria-label="Close">&times;</button>
        </div>

        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'user' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            User Roles
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'admin' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Admin Setup
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          {activeTab === 'user' ? (
            <div className="space-y-6">
              <p className="text-gray-600 leading-relaxed">
                Welcome to the Alumni Bookkeeping App! This platform centralizes class finances and announcements.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-bold text-brand-primary mb-1">Administrator</h4>
                  <p className="text-xs text-gray-500 mb-2 italic">Full access to manage the ledger.</p>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Bulk import/edit transactions</li>
                    <li>Manage classmate directory and roles</li>
                    <li>Update application logo and subtitle</li>
                    <li>Delete the entire class ledger</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-bold text-brand-primary mb-1">Standard User</h4>
                  <p className="text-xs text-gray-500 mb-2 italic">Personal financial visibility.</p>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>View private transaction history</li>
                    <li>Access dashboard and announcements</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                <p className="text-sm text-amber-700 font-medium">
                  If users are unable to login or save data, ensure your Firebase project is configured as follows:
                </p>
              </div>

              <section className="space-y-3">
                <h4 className="font-bold text-gray-900">1. Authentication</h4>
                <p className="text-sm text-gray-600">Go to <strong>Auth > Sign-in method</strong> and enable <strong>Google</strong>. Add your deployment URL to <strong>Authorized Domains</strong>.</p>
              </section>

              <section className="space-y-3">
                <h4 className="font-bold text-gray-900">2. Database Rules</h4>
                <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Firestore Rules:</p>
                <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                </pre>
              </section>

              <section className="space-y-3">
                <h4 className="font-bold text-gray-900">3. Storage Rules</h4>
                <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Storage Rules:</p>
                <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs overflow-x-auto">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                </pre>
              </section>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t bg-gray-50 text-right">
          <button onClick={onClose} className="bg-brand-primary text-white py-3 px-8 rounded-xl font-bold hover:bg-brand-secondary transition-all shadow-md">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
