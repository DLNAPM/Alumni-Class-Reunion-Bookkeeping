import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const Profile: React.FC = () => {
  const { user, updateUserProfile } = useData();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const isReadOnly = user?.role === 'Admin_ro';

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        address: user.address || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setStatus('saving');
    
    // Simulate API call / wait for async op
    updateUserProfile(formData)
        .then(() => {
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        })
        .catch((err) => {
            console.error("Failed to update profile", err);
            setStatus('idle');
            alert("Failed to update profile.");
        });
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
            <p>Your profile information has been saved successfully.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Display Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isReadOnly}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            />
            {isReadOnly && <p className="mt-1 text-xs text-gray-500">Read-Only Admins cannot change their display name.</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address (Login)</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-100 focus:outline-none sm:text-sm rounded-md cursor-not-allowed"
            />
             <p className="mt-2 text-xs text-gray-500">Email address serves as your login ID and cannot be changed here.</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isReadOnly}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Home Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isReadOnly}
              rows={3}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="123 Alumni Way..."
            />
          </div>

          <div className="pt-2">
            {!isReadOnly && (
            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {status === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;