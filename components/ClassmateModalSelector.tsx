import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, User, ChevronDown, Check, X, Users } from 'lucide-react';
import { Classmate, Transaction } from '../types';
import { isClassmateTxMatch } from './ReceiptDashboardModal';

interface ClassmateModalSelectorProps {
  allClassmateNames: string[];
  selectedName: string;
  onSelectName: (name: string) => void;
  classmates?: Classmate[];
  transactions?: Transaction[];
}

export const ClassmateModalSelector: React.FC<ClassmateModalSelectorProps> = ({
  allClassmateNames,
  selectedName,
  onSelectName,
  classmates = [],
  transactions = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Calculate transaction count map for quick lookup
  const txCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allClassmateNames.forEach(name => {
      let count = 0;
      transactions.forEach(t => {
        if (isClassmateTxMatch(t.classmateName, name)) {
          count++;
        }
      });
      map[name] = count;
    });
    return map;
  }, [allClassmateNames, transactions]);

  // Find matching classmate details
  const classmateDetailsMap = useMemo(() => {
    const map: Record<string, Classmate | undefined> = {};
    allClassmateNames.forEach(name => {
      map[name] = classmates.find(c => isClassmateTxMatch(c.name, name));
    });
    return map;
  }, [allClassmateNames, classmates]);

  // Filtered classmate names based on search query
  const filteredNames = useMemo(() => {
    if (!searchQuery.trim()) return allClassmateNames;
    const q = searchQuery.toLowerCase().trim();
    return allClassmateNames.filter(name => {
      if (name.toLowerCase().includes(q)) return true;
      const details = classmateDetailsMap[name];
      if (details) {
        if (details.maidenName && details.maidenName.toLowerCase().includes(q)) return true;
        if (details.email && details.email.toLowerCase().includes(q)) return true;
        if (details.gradYear && details.gradYear.includes(q)) return true;
      }
      return false;
    });
  }, [allClassmateNames, searchQuery, classmateDetailsMap]);

  // Extract distinct first letters for alphabetical jump
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    allClassmateNames.forEach(name => {
      const firstChar = name.trim().charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstChar)) {
        set.add(firstChar);
      }
    });
    return Array.from(set).sort();
  }, [allClassmateNames]);

  // Reset highlighted index when filter results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredNames]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        // Scroll to currently selected item
        const selectedElem = document.getElementById(`modal-classmate-item-${encodeURIComponent(selectedName)}`);
        if (selectedElem && listContainerRef.current) {
          selectedElem.scrollIntoView({ block: 'center' });
        }
      }, 50);
    }
  }, [isOpen, selectedName]);

  // Click outside listener to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = useCallback((name: string) => {
    onSelectName(name);
    setIsOpen(false);
    setSearchQuery('');
  }, [onSelectName]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const next = Math.min(prev + 1, filteredNames.length - 1);
        const nextName = filteredNames[next];
        if (nextName) {
          const elem = document.getElementById(`modal-classmate-item-${encodeURIComponent(nextName)}`);
          elem?.scrollIntoView({ block: 'nearest' });
        }
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const next = Math.max(prev - 1, 0);
        const nextName = filteredNames[next];
        if (nextName) {
          const elem = document.getElementById(`modal-classmate-item-${encodeURIComponent(nextName)}`);
          elem?.scrollIntoView({ block: 'nearest' });
        }
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetName = filteredNames[highlightedIndex];
      if (targetName) {
        handleSelect(targetName);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Jump to specific alphabet letter
  const handleLetterJump = (letter: string) => {
    setSearchQuery('');
    const match = allClassmateNames.find(n => n.trim().toUpperCase().startsWith(letter));
    if (match) {
      const idx = allClassmateNames.indexOf(match);
      setHighlightedIndex(idx);
      const elem = document.getElementById(`modal-classmate-item-${encodeURIComponent(match)}`);
      if (elem && listContainerRef.current) {
        elem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      regex.test(part) ? (
        <span key={idx} className="bg-yellow-200 text-yellow-900 font-bold px-0.5 rounded-xs">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const selectedDetails = classmateDetailsMap[selectedName];
  const selectedTxCount = txCountMap[selectedName] || 0;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="receipt-modal-classmate-selector-btn"
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
          isOpen
            ? 'bg-white text-gray-900 border-white ring-2 ring-white/50 shadow-lg'
            : 'bg-white/15 text-white border-white/30 hover:bg-white/25 hover:border-white/50'
        }`}
        title="Search and select classmate"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 border border-white/30 shadow-2xs">
            {selectedName ? selectedName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
          </div>
          <span className="truncate max-w-[150px] sm:max-w-[200px] text-left">
            {selectedName || 'Select Classmate'}
          </span>
          {selectedTxCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
              isOpen ? 'bg-blue-100 text-blue-800' : 'bg-white/20 text-white'
            }`}>
              {selectedTxCount}
            </span>
          )}
        </div>

        <ChevronDown className={`w-3.5 h-3.5 opacity-75 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2.5 z-50 text-gray-900 flex flex-col max-h-[460px] animate-in fade-in zoom-in-95 duration-100"
          id="receipt-modal-classmate-dropdown"
        >
          {/* Header with Search Input */}
          <div className="px-3 pb-2.5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Select Classmate ({allClassmateNames.length})
              </span>
              <span className="text-[10px] text-gray-400">Type name or letter</span>
            </div>

            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type classmate name, maiden, or email..."
                className="w-full pl-8 pr-7 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Quick A-Z Alphabet Strip */}
          {availableLetters.length > 1 && (
            <div className="px-3 py-1.5 border-b border-gray-100 flex items-center gap-1 overflow-x-auto no-scrollbar bg-gray-50/60 text-[10px] font-bold">
              <span className="text-[9px] text-gray-400 uppercase tracking-tight mr-0.5 shrink-0">Jump:</span>
              {availableLetters.map(letter => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleLetterJump(letter)}
                  className="px-1.5 py-0.5 rounded hover:bg-blue-100 hover:text-blue-700 text-gray-600 transition shrink-0"
                >
                  {letter}
                </button>
              ))}
            </div>
          )}

          {/* Classmates Scrollable List */}
          <div 
            ref={listContainerRef}
            className="flex-1 overflow-y-auto divide-y divide-gray-50 px-1.5 py-1 max-h-[300px]"
          >
            {filteredNames.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <p className="text-xs text-gray-500 font-medium">No classmates matching "{searchQuery}"</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                >
                  Clear search filter
                </button>
              </div>
            ) : (
              filteredNames.map((name, index) => {
                const isSelected = name === selectedName;
                const isHighlighted = index === highlightedIndex;
                const details = classmateDetailsMap[name];
                const txCount = txCountMap[name] || 0;

                return (
                  <button
                    key={name}
                    id={`modal-classmate-item-${encodeURIComponent(name)}`}
                    type="button"
                    onClick={() => handleSelect(name)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50/90 text-blue-900 font-medium border border-blue-200'
                        : isHighlighted
                          ? 'bg-gray-100 text-gray-900'
                          : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs truncate ${isSelected ? 'font-bold text-blue-900' : 'text-gray-900'}`}>
                            {highlightMatch(name, searchQuery)}
                          </span>
                          {details?.gradYear && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              ('{details.gradYear.slice(-2)})
                            </span>
                          )}
                        </div>
                        {details?.email && (
                          <p className="text-[11px] text-gray-400 truncate">
                            {highlightMatch(details.email, searchQuery)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      {txCount > 0 ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-blue-200/70 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {txCount} {txCount === 1 ? 'record' : 'records'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300">
                          0 records
                        </span>
                      )}

                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3 pt-2 pb-0.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Showing {filteredNames.length} of {allClassmateNames.length}</span>
            <span className="text-[10px] text-gray-400">Use ↑↓ keys &amp; Enter to select</span>
          </div>
        </div>
      )}
    </div>
  );
};
