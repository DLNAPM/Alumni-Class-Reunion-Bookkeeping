import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { formatToLastFirst, isSuperUserEmail } from '../services/nameUtils';
import { formatLastLoginDateTime } from '../services/dateUtils';

const Profile: React.FC = () => {
  const { user, updateUserProfile } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  const handleFormatName = () => {
    const formatted = formatToLastFirst(formData.name);
    setFormData(prev => ({ ...prev, name: formatted }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMessage(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();

    // Mandatory fields validation
    if (!trimmedName) {
      setErrorMessage("Display Name is mandatory (Preferred format: Last, First).");
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage("Email Address is mandatory.");
      return;
    }
    if (!trimmedPhone) {
      setErrorMessage("Contact Number is mandatory. Please provide your phone number.");
      return;
    }
    if (!trimmedAddress) {
      setErrorMessage("Home Address is mandatory. Please provide your mailing address.");
      return;
    }

    const isSuper = isSuperUserEmail(user.email);
    const resolvedName = isSuper ? trimmedName : formatToLastFirst(trimmedName);

    if (!isSuper && resolvedName !== user.name && window.confirm(`You are changing your Display Name to "${resolvedName}". This will update your historical transactions to match your new name. Continue?`) === false) {
      return;
    }
    
    if (trimmedEmail !== user.email && window.confirm("WARNING: You are changing your Login Email. This should only be done if you intend to login with a different Google Account next time. If you change this to an email that does not match your Google Account, you will lose access to this profile. Continue?") === false) {
      return;
    }

    setStatus('saving');
    
    updateUserProfile({
      name: resolvedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      address: trimmedAddress,
    })
      .then(() => {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 4000);
      })
      .catch((err) => {
        console.error("Failed to update profile", err);
        setStatus('error');
        setErrorMessage(err?.message || "Failed to update profile.");
      });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const isMissingMandatoryInfo = !user.phone || !user.address;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isMissingMandatoryInfo && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Profile Information Incomplete</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Please provide your mandatory Contact Number and Home Address below to ensure class records are up to date.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-text">My Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage your personal alumni contact and address details.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Role: {user.role === 'Admin_ro' ? 'Read-Only Admin' : user.role}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
              Last Login: {formatLastLoginDateTime(user.lastLogin)}
            </span>
          </div>
        </div>

        {status === 'success' && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 mb-6 rounded-r-xl" role="alert">
            <p className="font-bold text-sm">Profile Updated!</p>
            <p className="text-xs mt-0.5">Your profile information has been saved successfully.</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl" role="alert">
            <p className="font-bold text-sm">Action Required:</p>
            <p className="text-xs mt-0.5">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Display Name <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleFormatName}
                className="text-[11px] font-semibold text-brand-primary hover:text-brand-secondary hover:underline"
                title="Format as Last, First"
              >
                Format as "Last, First"
              </button>
            </div>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Smith, John"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary shadow-xs"
              required
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Alumni standard format: <strong>Last Name, First Name</strong>.
            </p>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email Address (Login Account) <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary shadow-xs"
              required
            />
            <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <strong>Notice:</strong> This email links your profile to your Google Login. Only modify this if you are transferring access to a new Google account.
            </p>
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary shadow-xs"
              placeholder="(555) 123-4567"
              required
            />
          </div>

          {/* Home Address */}
          <div>
            <label htmlFor="address" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Home Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary shadow-xs"
              placeholder="123 Alumni Way, City, State ZIP"
              required
            />
          </div>

          {/* Privacy Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-500 flex items-start gap-2.5">
            <span className="text-base">🔒</span>
            <div>
              <p className="font-semibold text-gray-700">Privacy &amp; Access Policy</p>
              <p className="mt-0.5 leading-relaxed">
                Classmates are only able to view their own profile information. Personal contact numbers and addresses are strictly protected and visible only to verified Class Administrators.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 transition-all active:scale-[0.99]"
            >
              {status === 'saving' ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
