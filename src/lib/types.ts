export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string; // ISO 8601 format: YYYY-MM-DD
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly' | 'yearly'; // Added weekly/yearly for flexibility
  // 'spent' amount can be calculated dynamically
}

export interface Goal {
  id: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO 8601 format: YYYY-MM-DD
}

// For AI Advisor Output
export type FinancialPlan = {
  summary: string;
  spendingAnalysis: string; 
  actionSteps: string;
  investmentPlan: string;
  progressTracking: string;
};
