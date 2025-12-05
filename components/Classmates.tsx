import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { UserRole, Classmate } from '../types';

interface EditModalProps {
    classmate: Classmate;
    onSave: (name: string, updatedData: Classmate) => void;
    onClose: () => void;
}

const EditClassmateModal: React.FC<EditModalProps> = ({ classmate, onSave, onClose }) => {
    const [formData, setFormData] = useState(classmate);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(classmate.name, formData);
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


const Classmates: React.FC = () => {
    const { classmates, updateClassmate } = useData();
    const [editingClassmate, setEditingClassmate] = useState<Classmate | null>(null);
    
    const sortedClassmates = useMemo(() => 
        [...classmates].sort((a, b) => a.name.localeCompare(b.name)), 
        [classmates]
    );

    return (
        <>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-brand-text mb-6">Manage Classmate Profiles</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classmate Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email (Login)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedClassmates.map(classmate => (
                                <tr key={classmate.name}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{classmate.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classmate.email || 'Not set'}</td>
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
                                    <td colSpan={4} className="text-center py-10 text-gray-500">No classmates found. Transactions may be empty.</td>
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
        </>
    );
};

export default Classmates;