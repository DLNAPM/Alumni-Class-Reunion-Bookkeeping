import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Classmate, Transaction } from '../types';

interface ClassmateInputProps {
  value: string;
  onChange: (value: string) => void;
  classmates: Classmate[];
  transactions: Transaction[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
  id?: string;
}

export const ClassmateInput: React.FC<ClassmateInputProps> = ({
  value,
  onChange,
  classmates,
  transactions,
  placeholder = 'Type or select classmate name...',
  required = false,
  className = '',
  label = 'Classmate Name',
  id = 'classmate-input'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal filter text with prop value
  useEffect(() => {
    setFilterText(value);
  }, [value]);

  // Derive sorted unique classmate names from classmates array and existing transactions
  const classmateNames = useMemo(() => {
    const namesSet = new Set<string>();
    classmates.forEach(c => {
      if (c.name && c.name.trim()) namesSet.add(c.name.trim());
    });
    transactions.forEach(t => {
      if (t.classmateName && t.classmateName.trim() && t.classmateName.trim() !== 'N/A') {
        namesSet.add(t.classmateName.trim());
      }
    });
    return Array.from(namesSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [classmates, transactions]);

  // Filter list based on input
  const filteredNames = useMemo(() => {
    if (!filterText || !filterText.trim()) return classmateNames;
    const search = filterText.toLowerCase().trim();
    return classmateNames.filter(name => name.toLowerCase().includes(search));
  }, [classmateNames, filterText]);

  const isExactMatch = useMemo(() => {
    if (!value || !value.trim()) return false;
    const search = value.trim().toLowerCase();
    return classmateNames.some(name => name.toLowerCase() === search);
  }, [classmateNames, value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilterText(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelectName = (name: string) => {
    setFilterText(name);
    onChange(name);
    setIsOpen(false);
  };

  const handleSelectDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected) {
      handleSelectName(selected);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {value.trim() && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isExactMatch 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {isExactMatch ? '✓ Existing Classmate' : '+ New Classmate Name'}
            </span>
          )}
        </div>
      )}

      {/* Dropdown Pick Selector + Text Input Combobox */}
      <div className="flex gap-2">
        <select
          id={`${id}-dropdown`}
          value={isExactMatch ? value : ''}
          onChange={handleSelectDropdownChange}
          className="block w-1/3 text-xs border-gray-300 rounded-md shadow-sm bg-gray-50 focus:ring-brand-primary focus:border-brand-primary truncate"
          title="Quick pick from existing classmates"
        >
          <option value="">-- Dropdown List --</option>
          {classmateNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {/* Text Input with Auto-find & Suggestions Combobox */}
        <div className="relative flex-1">
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              id={id}
              value={filterText}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              required={required}
              autoComplete="off"
              className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm"
            />
            
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
              {filterText && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterText('');
                    onChange('');
                    setIsOpen(true);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Clear name"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-400 hover:text-gray-600 p-1 focus:outline-none"
                title="Toggle classmate list"
              >
                <svg className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Auto Find Popup List */}
          {isOpen && (
            <div className="absolute z-30 mt-1 w-full bg-white shadow-xl max-h-60 rounded-md py-1 text-sm border border-gray-200 overflow-auto focus:outline-none">
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b bg-gray-50 flex justify-between items-center">
                <span>Classmate Suggestions ({filteredNames.length})</span>
                <span className="text-[10px] text-gray-500 font-normal">Type or click to pick</span>
              </div>
              
              {filteredNames.length > 0 ? (
                filteredNames.map((name) => {
                  const isSelected = name.toLowerCase() === value.trim().toLowerCase();
                  return (
                    <div
                      key={name}
                      onClick={() => handleSelectName(name)}
                      className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors ${
                        isSelected ? 'bg-brand-primary/15 font-semibold text-brand-primary' : 'text-gray-900'
                      }`}
                    >
                      <span className="block truncate">{name}</span>
                      {isSelected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-primary">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-3 px-3 text-sm text-gray-500 italic">
                  No classmate matching &quot;{filterText}&quot;.
                  <div className="mt-1 font-semibold text-brand-primary not-italic">
                    Press Enter or Tab to use &quot;{filterText}&quot; as a new classmate name.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="text-[11px] text-gray-500">
        Select a classmate from the drop-down list or start typing to auto-find / enter a new classmate name.
      </p>
    </div>
  );
};

export default ClassmateInput;
