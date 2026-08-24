import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Classmate } from '../types';

interface EditModalProps {
    classmate: Classmate;
    onSave: (id: string, updatedData: Partial<Omit<Classmate, 'id'>>) => void;
    onClose: () => void;
}

const EditClassmateModal: React.FC<EditModalProps> = ({ classmate, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<Classmate, 'id'>>(classmate);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(classmate.id, formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-brand-text">Edit Classmate</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" value={formData.name} disabled className="mt-1 w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address (for login)</label>
                        <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Contact Number</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Home Address</label>
                        <textarea id="address" name="address" value={formData.address || ''} onChange={handleChange} rows={3} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-secondary focus:border-brand-secondary"></textarea>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm rounded-md">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm rounded-md">
                            <option value="Admin">Admin</option>
                            <option value="Standard">Standard</option>
                            <option value="Admin_ro">Read-Only Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end mt-6 space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MergeClassmatesModal: React.FC<{
    selectedClassmates: Classmate[];
    onMerge: (targetId: string, sourceIds: string[]) => void;
    onClose: () => void;
}> = ({ selectedClassmates, onMerge, onClose }) => {
    const [targetId, setTargetId] = useState<string>(selectedClassmates[0]?.id || '');

    const handleMerge = () => {
        if (!targetId) {
            alert("Please select a primary profile to merge into.");
            return;
        }
        const sourceIds = selectedClassmates.map(c => c.id).filter(id => id !== targetId);
        onMerge(targetId, sourceIds);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-semibold text-brand-text mb-4">Merge Classmate Profiles</h3>
                <p className="text-sm text-gray-600 mb-6">Select the primary profile to keep. All transactions from the other selected profiles will be reassigned to this primary profile, and the other profiles will be deleted. This action cannot be undone.</p>
                <div className="space-y-3">
                    {selectedClassmates.map(c => (
                        <label key={c.id} className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                name="targetClassmate"
                                value={c.id}
                                checked={targetId === c.id}
                                onChange={() => setTargetId(c.id)}
                                className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
                            />
                            <span className="ml-3 font-medium text-gray-800">{c.name}</span>
                        </label>
                    ))}
                </div>
                 <div className="flex justify-end mt-8 space-x-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={handleMerge} className="bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary">Merge Profiles</button>
                </div>
            </div>
        </div>
    );
};


const Classmates: React.FC = () => {
    const { user, classmates, updateClassmate, mergeClassmates, deleteClassmates, updateClassmatesStatus, reconcileDuplicateClassmates, openReceiptDashboard } = useData();
    const isAdmin = user?.role === 'Admin' || user?.isAdmin || user?.role === 'Admin_ro';
    const isReadOnly = user?.role === 'Admin_ro';

    if (!isAdmin) {
        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    🔒
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Classmate Directory Restricted</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    To protect classmate privacy, contact numbers and home addresses are visible only to verified Class Administrators.
                    You can view and update your own contact and address details under <strong>My Profile</strong>.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left text-xs text-gray-600 space-y-1">
                    <p><strong>Your Name:</strong> {user?.name}</p>
                    <p><strong>Your Email:</strong> {user?.email}</p>
                    <p><strong>Your Contact Number:</strong> {user?.phone || 'Not set'}</p>
                    <p><strong>Your Home Address:</strong> {user?.address || 'Not set'}</p>
                </div>
            </div>
        );
    }
    
    const [editingClassmate, setEditingClassmate] = useState<Classmate | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    
    // Search state for Mobile Number, Email Address, Home Address, or Name
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState<'all' | 'name' | 'phone' | 'email' | 'address'>('all');

    const selectAllRef = useRef<HTMLInputElement>(null);
    
    const filteredClassmates = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const sorted = [...classmates].sort((a, b) => a.name.localeCompare(b.name));
        if (!q) return sorted;

        const cleanDigits = (str?: string) => (str || '').replace(/\D/g, '');
        const cleanQuery = q.replace(/\D/g, '');

        return sorted.filter(c => {
            const nameMatch = c.name.toLowerCase().includes(q);
            const emailMatch = (c.email || '').toLowerCase().includes(q);
            const addressMatch = (c.address || '').toLowerCase().includes(q);
            
            const rawPhone = (c.phone || '').toLowerCase();
            const phoneMatch = rawPhone.includes(q) || (cleanQuery.length >= 3 && cleanDigits(c.phone).includes(cleanQuery));

            if (searchField === 'name') return nameMatch;
            if (searchField === 'phone') return phoneMatch;
            if (searchField === 'email') return emailMatch;
            if (searchField === 'address') return addressMatch;

            return nameMatch || emailMatch || phoneMatch || addressMatch;
        });
    }, [classmates, searchQuery, searchField]);

    useEffect(() => {
        if (selectAllRef.current) {
          const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredClassmates.length;
          selectAllRef.current.indeterminate = isIndeterminate;
        }
    }, [selectedIds, filteredClassmates.length]);


    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredClassmates.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleStatusUpdate = (status: 'Active' | 'Inactive') => {
        updateClassmatesStatus(Array.from(selectedIds), status);
        setSelectedIds(new Set());
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected classmate profile(s)? This action cannot be undone.`)) {
            const error = await deleteClassmates(Array.from(selectedIds));
            if (error) {
                alert(error);
            } else {
                setSelectedIds(new Set());
            }
        }
    };

    const handleMerge = () => {
        if (selectedIds.size < 2) {
            alert("Please select at least two classmates to merge.");
            return;
        }
        setIsMergeModalOpen(true);
    };

    const handleReconcile = () => {
      if (window.confirm(`Are you sure you want to automatically find and merge all duplicate classmate profiles? This action will merge profiles with the exact same name and cannot be undone.`)) {
        reconcileDuplicateClassmates();
        setSelectedIds(new Set());
      }
    }

    const allSelected = filteredClassmates.length > 0 && selectedIds.size === filteredClassmates.length;

    return (
        <>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text">
                            Manage Classmate Profiles {isReadOnly && <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">(Read-Only)</span>}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Search, filter, edit, and organize classmate profiles.</p>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg self-start md:self-auto">
                        Total Classmates: <strong className="text-gray-900">{classmates.length}</strong>
                    </div>
                </div>

                {/* Search Bar Component */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by Name, Mobile Number, Email, or Home Address..."
                                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all shadow-xs"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    title="Clear search"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <label htmlFor="search-field" className="text-xs font-semibold text-gray-600 whitespace-nowrap">Filter By:</label>
                            <select
                                id="search-field"
                                value={searchField}
                                onChange={(e) => setSearchField(e.target.value as any)}
                                className="bg-white border border-gray-300 text-gray-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium shadow-xs cursor-pointer"
                            >
                                <option value="all">🔍 All Fields</option>
                                <option value="name">👤 Name</option>
                                <option value="phone">📱 Mobile Number</option>
                                <option value="email">✉️ Email Address</option>
                                <option value="address">🏠 Home Address</option>
                            </select>
                        </div>
                    </div>

                    {searchQuery.trim() && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-gray-600">
                                <span>
                                    Showing <strong>{filteredClassmates.length}</strong> of <strong>{classmates.length}</strong> classmate profile(s) matching <strong>"{searchQuery}"</strong>
                                    {searchField !== 'all' && (
                                        <span> in <em>{searchField === 'phone' ? 'Mobile Number' : searchField === 'email' ? 'Email Address' : searchField === 'address' ? 'Home Address' : 'Name'}</em></span>
                                    )}
                                </span>
                            </div>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-brand-secondary hover:text-brand-primary font-bold hover:underline"
                            >
                                Clear Search Filter
                            </button>
                        </div>
                    )}
                </div>
                
                {!isReadOnly && selectedIds.size > 0 && (
                  <div className="bg-brand-secondary text-white p-3 rounded-lg shadow-md mb-4 flex items-center justify-between sticky top-0 z-10">
                    <span className="font-semibold">{selectedIds.size} classmate(s) selected</span>
                    <div className="flex flex-wrap gap-2 items-center">
                      {allSelected && (
                        <button onClick={handleReconcile} className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded-md text-sm font-medium">Reconcile All</button>
                      )}
                      <button onClick={() => handleStatusUpdate('Active')} className="bg-success hover:bg-green-600 px-3 py-1 rounded-md text-sm font-medium">Activate</button>
                      <button onClick={() => handleStatusUpdate('Inactive')} className="bg-warning hover:bg-yellow-600 px-3 py-1 rounded-md text-sm font-medium text-white">De-activate</button>
                      <button onClick={handleMerge} disabled={selectedIds.size < 2} className="bg-brand-accent hover:bg-blue-400 px-3 py-1 rounded-md text-sm font-medium text-white disabled:bg-gray-400 disabled:cursor-not-allowed">Merge Selected</button>
                      <button onClick={handleDelete} className="bg-danger hover:bg-red-700 px-3 py-1 rounded-md text-sm font-medium">Delete Selected</button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {!isReadOnly && (
                                <th scope="col" className="p-4">
                                  <input
                                      ref={selectAllRef}
                                      type="checkbox"
                                      className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                      onChange={handleSelectAll}
                                      checked={allSelected}
                                  />
                                </th>
                                )}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classmate Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email (Login)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Number</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home Address</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredClassmates.map(classmate => (
                                <tr key={classmate.id} className={selectedIds.has(classmate.id) ? 'bg-brand-accent/20' : ''}>
                                    {!isReadOnly && (
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                            checked={selectedIds.has(classmate.id)}
                                            onChange={() => handleSelectOne(classmate.id)}
                                        />
                                    </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{classmate.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classmate.email || 'Not set'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {classmate.phone ? (
                                            <a href={`tel:${classmate.phone}`} className="hover:text-brand-primary hover:underline">
                                                {classmate.phone}
                                            </a>
                                        ) : (
                                            <span className="text-gray-300 italic">Not set</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={classmate.address || ''}>
                                        {classmate.address || <span className="text-gray-300 italic">Not set</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classmate.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {classmate.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            classmate.role === 'Admin' ? 'bg-green-100 text-green-800' : 
                                            classmate.role === 'Admin_ro' ? 'bg-purple-100 text-purple-800' : 
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {classmate.role === 'Admin_ro' ? 'Read-Only Admin' : classmate.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button
                                            onClick={() => openReceiptDashboard?.(classmate.name)}
                                            className="text-brand-primary hover:text-brand-secondary font-semibold text-xs inline-flex items-center gap-1"
                                            title="View Classmate Receipt Statement"
                                        >
                                            📄 Receipt
                                        </button>
                                        {!isReadOnly && (
                                            <button onClick={() => setEditingClassmate(classmate)} className="text-brand-secondary hover:text-brand-primary font-semibold text-xs">Edit</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredClassmates.length === 0 && (
                                <tr>
                                    <td colSpan={isReadOnly ? 6 : 8} className="text-center py-10 text-gray-500">
                                        {searchQuery.trim() ? (
                                            <div>
                                                <p className="text-gray-700 font-semibold mb-1">No classmates found matching "{searchQuery}"</p>
                                                <p className="text-xs text-gray-400">Try searching by a different name, phone number, email, or home address.</p>
                                                <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="mt-3 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-secondary transition-colors"
                                                >
                                                    Clear Search Filter
                                                </button>
                                            </div>
                                        ) : (
                                            "No classmates found. Transactions may be empty."
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {editingClassmate && (
                <EditClassmateModal
                    classmate={editingClassmate}
                    onSave={updateClassmate}
                    onClose={() => setEditingClassmate(null)}
                />
            )}
            {isMergeModalOpen && (
                <MergeClassmatesModal 
                    selectedClassmates={classmates.filter(c => selectedIds.has(c.id))}
                    onMerge={(targetId, sourceIds) => {
                        mergeClassmates(targetId, sourceIds);
                        setSelectedIds(new Set());
                    }}
                    onClose={() => setIsMergeModalOpen(false)}
                />
            )}
        </>
    );
};

export default Classmates;