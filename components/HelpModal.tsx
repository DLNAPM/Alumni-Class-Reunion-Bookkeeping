import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 id="help-modal-title" className="text-xl font-semibold text-brand-text">About This App</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold" aria-label="Close help modal">&times;</button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          <p className="text-gray-600">
            Welcome to the Alumni Bookkeeping App! This application helps our class manage finances, stay connected, and organize events. Your access and capabilities depend on your assigned role.
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-lg text-brand-primary">Administrator Role</h4>
              <p className="text-sm text-gray-500 mb-2">Full control over all application features.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>View and manage all financial data and transactions.</li>
                <li>Add, edit, delete, and import transactions in bulk.</li>
                <li>Manage classmate profiles, including assigning roles and contact information.</li>
                <li>Post and delete class announcements.</li>
                <li>Customize the application's appearance (logo, subtitle).</li>
                <li>Generate advanced financial reports and email summaries.</li>
                <li>Configure payment integration settings.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg text-brand-primary">Standard User Role</h4>
              <p className="text-sm text-gray-500 mb-2">A personalized, read-only view of your financial history.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>View the main dashboard and class announcements.</li>
                <li>Access a detailed history of your own transactions.</li>
                <li>Cannot make payments, edit data, or access administrative panels.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg text-brand-primary">Guest Role</h4>
              <p className="text-sm text-gray-500 mb-2">A public, introductory view of the application.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>View the main dashboard and public announcements.</li>
                <li>All financial data and personal information are hidden.</li>
                <li>Cannot interact with any features beyond viewing the dashboard.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="p-4 border-t text-right bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="bg-brand-primary text-white py-2 px-6 rounded-md hover:bg-brand-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
