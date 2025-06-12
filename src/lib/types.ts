
import type { Timestamp } from 'firebase/firestore';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string | Timestamp; // Stored as Timestamp in Firestore, string in forms/display
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Budget {
  id:string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly' | 'yearly';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Goal {
  id: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | Timestamp | null; // Stored as Timestamp in Firestore, string in forms
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// For AI Advisor Output
export type FinancialPlan = {
  summary: string;
  spendingAnalysis: string; 
  actionSteps: string;
  investmentPlan: string;
  progressTracking: string;
};
