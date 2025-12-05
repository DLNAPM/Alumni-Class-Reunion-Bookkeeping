
import React from 'react';

export enum PaymentCategory {
  Dues = 'Dues',
  ReunionDeposit = 'Reunion Deposit',
  Fundraiser = 'Fundraiser',
  ClassmateSupport = 'Classmate Support',
  Benevolence = 'Benevolence',
  Bereavement = 'Bereavement',
  SimpleDeposit = 'Simple-Deposit',
  Picnic = 'Picnic',
  Expense = 'Expense',
  BankMaintFee = 'Bank Maint Fee',
}

export enum PaymentType {
  Suntrust = 'Suntrust',
  Truist = 'Truist',
  PayPal = 'PayPal',
  CashApp = 'CashApp',
  Zelle = 'Zelle',
  Cash = 'CASH',
  BankCard = 'Bank Card',
  Other = 'Other',
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: PaymentCategory;
  paymentType: PaymentType;
  amount: number;
  classmateName: string;
  transactionId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type?: 'text' | 'facebook';
  url?: string;
  imageUrl?: string;
}

export type UserRole = 'Admin' | 'Standard';

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  role: UserRole;
}

export interface Classmate {
    id: string;
    name: string;
    role: UserRole;
    email?: string;
    address?: string;
    phone?: string;
    status: 'Active' | 'Inactive';
}

export interface IntegrationService {
  connected: boolean;
  identifier: string;
}

export interface IntegrationSettings {
  cashApp: IntegrationService;
  payPal: IntegrationService;
  zelle: IntegrationService;
  bank: IntegrationService;
}

export interface DataContextType {
  user: User | null;
  logo: string;
  setLogo: (logoUpdater: string | ((prevLogo: string) => string)) => Promise<void>;
  subtitle: string;
  setSubtitle: (subtitleUpdater: string | ((prevSubtitle: string) => string)) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (updatedTransaction: Transaction) => Promise<void>;
  updateTransactions: (updatedTransactions: Transaction[]) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  deleteTransactions: (transactionIds: string[]) => Promise<void>;
  clearTransactions: () => Promise<void>;
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => Promise<void>;
  deleteAnnouncement: (announcementId: string) => Promise<void>;
  classBalance: number;
  integrationSettings: IntegrationSettings;
  updateIntegrationSettings: (service: keyof IntegrationSettings, settings: IntegrationService) => Promise<void>;
  updateUserName: (newName: string) => Promise<void>;
  classmates: Classmate[];
  updateClassmate: (id: string, updatedData: Partial<Omit<Classmate, 'id'>>) => Promise<void>;
  mergeClassmates: (targetClassmateId: string, sourceClassmateIds: string[]) => Promise<void>;
  deleteClassmates: (classmateIds: string[]) => Promise<string | null>; // Returns error message or null
  updateClassmatesStatus: (classmateIds: string[], status: 'Active' | 'Inactive') => Promise<void>;
  reconcileDuplicateClassmates: () => Promise<void>;
}
