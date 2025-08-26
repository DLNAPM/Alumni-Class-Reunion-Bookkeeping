
import React from 'react';

export enum PaymentCategory {
  Dues = 'Dues',
  Vacation = 'Class Vacation',
  Funeral = 'Funeral Services',
  Donation = 'Donations',
  Support = 'Classmate Support',
  Reunion = 'Reunion Fees',
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  category: PaymentCategory;
  amount: number;
  classmateName: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface DataContextType {
  user: User | null;
  logo: string;
  setLogo: React.Dispatch<React.SetStateAction<string>>;
  subtitle: string;
  setSubtitle: React.Dispatch<React.SetStateAction<string>>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  classBalance: number;
}
