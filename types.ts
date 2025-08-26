import React from 'react';

export enum PaymentCategory {
  Dues = 'Dues',
  ReunionDeposit = 'Reunion Deposit',
  Fundraiser = 'Fundraiser',
  ClassmateSupport = 'Classmate Support',
  Benevolence = 'Benevolence',
  SimpleDeposit = 'Simple-Deposit',
}

export enum PaymentType {
  CreditCard = 'Credit Card',
  ManualEntry = 'Manual Entry',
  ImportedCashApp = 'Imported - CashApp',
  ImportedPayPal = 'Imported - PayPal',
  ImportedZelle = 'Imported - Zelle',
  ImportedBank = 'Imported - Bank',
  ImportedExcel = 'Imported - Excel/CSV',
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  category: PaymentCategory;
  paymentType: PaymentType;
  amount: number;
  classmateName: string;
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

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
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
  deleteTransaction: (transactionId: number) => void;
  clearTransactions: () => void;
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  deleteAnnouncement: (announcementId: number) => void;
  classBalance: number;
  integrationSettings: IntegrationSettings;
  updateIntegrationSettings: (service: keyof IntegrationSettings, settings: IntegrationService) => void;
}