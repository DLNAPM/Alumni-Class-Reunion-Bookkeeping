import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const Profile: React.FC = () => {
  const { user, updateUserName } = useData();
  const [name, setName] = useState(user?.name || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && name !== user?.name) {
      setStatus('saving');
      // Simulate API call
      setTimeout(() => {
        if(updateUserName) {
            updateUserName(name);
        }
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      }, 1000);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-brand-text mb-6">My Profile</h2>

        {status === 'success' && (
          <div className="bg-success/10 border-l-4 border-success text-success p-4 mb-6" role="alert">
            <p className="font-bold">Profile Updated!</p>
            <p>Your display name has been changed successfully.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Display Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-100 focus:outline-none sm:text-sm rounded-md cursor-not-allowed"
            />
             <p className="mt-2 text-xs text-gray-500">Email address cannot be changed.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === 'saving' || name === user.name}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {status === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
