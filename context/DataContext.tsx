
import React, { createContext, useContext } from 'react';
import type { DataContextType } from '../types';

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = DataContext.Provider;

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
