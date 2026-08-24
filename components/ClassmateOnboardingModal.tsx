import React, { useState, useEffect, useMemo } from 'react';
import { Classmate, Transaction } from '../types';
import { formatToLastFirst } from '../services/nameUtils';

interface ClassmateOnboardingModalProps {
  isOpen: boolean;
  mode: 'merge' | 'create' | 'complete';
  matchingClassmates: Classmate[];
  currentUserEmail: string;
  currentUserDisplayName: string;
  currentClassId: string;
  allTransactions: Transaction[];
  onComplete: (data: {
    targetClassmateId?: string;
    mergedSourceIds: string[];
    name: string;
    email: string;
    phone: string;
    address: string;
  }) => Promise<void>;
  onClose?: () => void;
}

export const ClassmateOnboardingModal: React.FC<ClassmateOnboardingModalProps> = ({
  isOpen,
  mode,
  matchingClassmates,
  currentUserEmail,
  currentUserDisplayName,
  currentClassId,
  allTransactions,
  onComplete,
  onClose,
}) => {
  // Determine default selected classmate IDs for merge mode
  const initialSelectedIds = useMemo(() => {
    return new Set(matchingClassmates.map(c => c.id));
  }, [matchingClassmates]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelectedIds);

  // Suggested display name in "Last, First" format
  const initialFormattedName = useMemo(() => {
    if (matchingClassmates.length > 0 && matchingClassmates[0].name) {
      return formatToLastFirst(matchingClassmates[0].name);
    }
    return formatToLastFirst(currentUserDisplayName || '');
  }, [matchingClassmates, currentUserDisplayName]);

  // Initial phone and address from any existing matching profiles
  const initialPhone = useMemo(() => {
    for (const c of matchingClassmates) {
      if (c.phone && c.phone.trim()) return c.phone.trim();
    }
    return '';
  }, [matchingClassmates]);

  const initialAddress = useMemo(() => {
    for (const c of matchingClassmates) {
      if (c.address && c.address.trim()) return c.address.trim();
    }
    return '';
  }, [matchingClassmates]);

  const [formData, setFormData] = useState({
    name: initialFormattedName,
    email: currentUserEmail || '',
    phone: initialPhone,
    address: initialAddress,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when props change
  useEffect(() => {
    setSelectedIds(new Set(matchingClassmates.map(c => c.id)));
    setFormData({
      name: initialFormattedName,
      email: currentUserEmail || '',
      phone: initialPhone,
      address: initialAddress,
    });
    setErrorMessage(null);
  }, [matchingClassmates, currentUserEmail, initialFormattedName, initialPhone, initialAddress]);

  if (!isOpen) return null;

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1 && mode === 'merge') {
          // Keep at least one selected
          return next;
        }
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFormatNameClick = () => {
    const formatted = formatToLastFirst(formData.name);
    setFormData(prev => ({ ...prev, name: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();

    // Mandatory fields validation
    if (!trimmedName) {
      setErrorMessage("Display Name is required (Format: Last, First).");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Email Address is required.");
      return;
    }

    if (!trimmedPhone) {
      setErrorMessage("Contact Number is required. Please provide your mobile or phone number.");
      return;
    }

    if (!trimmedAddress) {
      setErrorMessage("Home Address is required. Please provide your mailing/home address.");
      return;
    }

    // Auto-standardize name to "Last, First" format if user typed "First Last" without comma
    const standardizedName = formatToLastFirst(trimmedName);

    setIsSubmitting(true);
    try {
      if (mode === 'merge' && matchingClassmates.length > 0) {
        const selectedList = matchingClassmates.filter(c => selectedIds.has(c.id));
        if (selectedList.length === 0) {
          setErrorMessage("Please select at least one matching profile to merge.");
          setIsSubmitting(false);
          return;
        }

        const targetClassmate = selectedList[0];
        const mergedSourceIds = selectedList.slice(1).map(c => c.id);

        await onComplete({
          targetClassmateId: targetClassmate.id,
          mergedSourceIds,
          name: standardizedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          address: trimmedAddress,
        });
      } else if (mode === 'complete' && matchingClassmates.length > 0) {
        await onComplete({
          targetClassmateId: matchingClassmates[0].id,
          mergedSourceIds: [],
          name: standardizedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          address: trimmedAddress,
        });
      } else {
        // Create new classmate profile
        await onComplete({
          mergedSourceIds: [],
          name: standardizedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          address: trimmedAddress,
        });
      }
    } catch (err: any) {
      console.error("Error completing classmate onboarding:", err);
      setErrorMessage(err?.message || "An error occurred while saving your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-brand-primary text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl font-bold">
                {mode === 'merge' ? '🤝' : mode === 'complete' ? '📝' : '👤'}
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  {mode === 'merge'
                    ? 'Merge & Standardize Your Profile'
                    : mode === 'complete'
                    ? 'Complete Your Classmate Profile'
                    : 'New Classmate Profile Registration'}
                </h3>
                <p className="text-xs text-gray-200 mt-0.5">
                  Class Ledger: <span className="font-mono font-bold text-white">{currentClassId}</span>
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Informational Banner */}
          {mode === 'merge' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
              <div className="flex items-start gap-2">
                <span className="text-base">ℹ️</span>
                <div>
                  <p className="font-semibold text-sm text-blue-950">Matching Profiles Found in Ledger</p>
                  <p className="mt-1 leading-relaxed">
                    We detected <strong>{matchingClassmates.length}</strong> profile record(s) in this class ledger matching your login name (<strong>{currentUserDisplayName || currentUserEmail}</strong>).
                    Please select the record(s) that belong to you to merge into your unified <strong>"Last, First"</strong> profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <span className="text-base">👋</span>
                <div>
                  <p className="font-semibold text-sm text-amber-950">Welcome to Class Ledger {currentClassId}!</p>
                  <p className="mt-1 leading-relaxed">
                    No existing classmate record was found matching your login. Please set up your profile below with mandatory contact details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === 'complete' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900">
              <div className="flex items-start gap-2">
                <span className="text-base">✅</span>
                <div>
                  <p className="font-semibold text-sm text-emerald-950">Profile Linked Successfully</p>
                  <p className="mt-1 leading-relaxed">
                    Your login has been connected to your classmate record. Please confirm your contact number and home address below to complete your profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-sm rounded-r-lg">
              <p className="font-bold">Please check required fields:</p>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Merge Selection List */}
          {mode === 'merge' && matchingClassmates.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Matching Profiles to Merge:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50">
                {matchingClassmates.map(classmate => {
                  const isChecked = selectedIds.has(classmate.id);
                  const txCount = allTransactions.filter(
                    t => t.classmateName && t.classmateName.trim().toLowerCase() === classmate.name.trim().toLowerCase()
                  ).length;

                  return (
                    <label
                      key={classmate.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-white border-brand-primary shadow-xs'
                          : 'bg-white/60 border-gray-200 hover:bg-white text-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectId(classmate.id)}
                          className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary border-gray-300 cursor-pointer"
                        />
                        <div>
                          <div className="text-sm font-bold text-gray-900">{classmate.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            {classmate.email ? <span>✉️ {classmate.email}</span> : <span className="italic text-gray-400">No email attached</span>}
                            {classmate.phone && <span>• 📞 {classmate.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
                          {txCount} payment{txCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                All ledger transactions and records from selected profiles will be consolidated under your new profile.
              </p>
            </div>
          )}

          {/* Form Fields: Display Name, Email, Contact Number, Home Address */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="onboarding-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleFormatNameClick}
                  className="text-[11px] font-semibold text-brand-primary hover:text-brand-secondary hover:underline"
                  title="Auto-format to 'Last, First' standard"
                >
                  Convert to "Last, First"
                </button>
              </div>
              <input
                type="text"
                id="onboarding-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Smith, John"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary shadow-xs"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Preferred alumni format: <strong>Last Name, First Name</strong> (e.g., <em>Miller, David</em>).
              </p>
            </div>

            <div>
              <label htmlFor="onboarding-email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address (Login Account) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="onboarding-email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none cursor-not-allowed shadow-xs"
                readOnly
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Linked to your active Google login session for secure ledger access.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="onboarding-phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="onboarding-phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary shadow-xs"
                  required
                />
              </div>

              <div>
                <label htmlFor="onboarding-address" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Home Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="onboarding-address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  placeholder="123 Alumni Way, City, ST 12345"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary shadow-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-500 flex items-center gap-2">
            <span>🔒</span>
            <span>
              <strong>Privacy Assurance:</strong> Your contact and address information are kept private and accessible only to you and designated Ledger Administrators.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-gray-100">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>
                  {mode === 'merge' ? 'Merge & Save My Profile' : 'Save & Complete Profile'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassmateOnboardingModal;
