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
  id: number;
  date: string;
  description: string;
  category: PaymentCategory;
  paymentType: PaymentType;
  amount: number;
  classmateName: string;
  transactionId?: string;
}

export interface Announcement {
  id: number;
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
    name: string;
    role: UserRole;
    email?: string;
    address?: string;
    phone?: string;
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
  setLogo: React.Dispatch<React.SetStateAction<string>>;
  subtitle: string;
  setSubtitle: React.Dispatch<React.SetStateAction<string>>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (updatedTransaction: Transaction) => void;
  updateTransactions: (updatedTransactions: Transaction[]) => void;
  deleteTransaction: (transactionId: number) => void;
  deleteTransactions: (transactionIds: number[]) => void;
  clearTransactions: () => void;
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  deleteAnnouncement: (announcementId: number) => void;
  classBalance: number;
  integrationSettings: IntegrationSettings;
  updateIntegrationSettings: (service: keyof IntegrationSettings, settings: IntegrationService) => void;
  updateUserName: (newName: string) => void;
  classmates: Classmate[];
  updateClassmate: (name: string, updatedData: Partial<Classmate>) => void;
}