
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
    const { classmates, updateClassmate, mergeClassmates, deleteClassmates, updateClassmatesStatus, reconcileDuplicateClassmates } = useData();
    const [editingClassmate, setEditingClassmate] = useState<Classmate | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    
    const selectAllRef = useRef<HTMLInputElement>(null);
    
    const sortedClassmates = useMemo(() => 
        [...classmates].sort((a, b) => a.name.localeCompare(b.name)), 
        [classmates]
    );

    useEffect(() => {
        if (selectAllRef.current) {
          const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sortedClassmates.length;
          selectAllRef.current.indeterminate = isIndeterminate;
        }
    }, [selectedIds, sortedClassmates.length]);


    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(sortedClassmates.map(c => c.id)));
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

    const allSelected = sortedClassmates.length > 0 && selectedIds.size === sortedClassmates.length;

    return (
        <>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-brand-text mb-6">Manage Classmate Profiles</h2>
                
                {selectedIds.size > 0 && (
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
                                <th scope="col" className="p-4">
                                  <input
                                      ref={selectAllRef}
                                      type="checkbox"
                                      className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                      onChange={handleSelectAll}
                                      checked={allSelected}
                                  />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classmate Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email (Login)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedClassmates.map(classmate => (
                                <tr key={classmate.id} className={selectedIds.has(classmate.id) ? 'bg-brand-accent/20' : ''}>
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                            checked={selectedIds.has(classmate.id)}
                                            onChange={() => handleSelectOne(classmate.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{classmate.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classmate.email || 'Not set'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classmate.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {classmate.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classmate.role === 'Admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {classmate.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setEditingClassmate(classmate)} className="text-brand-secondary hover:text-brand-primary">Edit</button>
                                    </td>
                                </tr>
                            ))}
                            {sortedClassmates.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">No classmates found. Transactions may be empty.</td>
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
