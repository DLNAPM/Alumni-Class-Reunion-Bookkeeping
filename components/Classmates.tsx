import React from 'react';
import { useData } from '../context/DataContext';
import { UserRole } from '../types';

const Classmates: React.FC = () => {
    const { classmates, updateClassmateRole } = useData();

    const handleRoleChange = (name: string, role: UserRole) => {
        updateClassmateRole(name, role);
    };
    
    // Sort classmates alphabetically
    const sortedClassmates = React.useMemo(() => 
        [...classmates].sort((a, b) => a.name.localeCompare(b.name)), 
        [classmates]
    );

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-brand-text mb-6">Manage Classmate Roles</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classmate Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Role</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedClassmates.map(classmate => (
                            <tr key={classmate.name}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{classmate.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <select
                                        value={classmate.role}
                                        onChange={(e) => handleRoleChange(classmate.name, e.target.value as UserRole)}
                                        className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm rounded-md"
                                        aria-label={`Role for ${classmate.name}`}
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Standard">Standard</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                         {sortedClassmates.length === 0 && (
                            <tr>
                                <td colSpan={2} className="text-center py-10 text-gray-500">No classmates found. Transactions may be empty.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Classmates;
