
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import type { Transaction, Budget, Goal } from './types';

// ==== TRANSACTIONS ====

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!userId) throw new Error("User ID is required to fetch transactions.");
  const transactionsCol = collection(db, `users/${userId}/transactions`);
  const q = query(transactionsCol, orderBy('date', 'desc'));
  const transactionSnapshot = await getDocs(q);
  return transactionSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
};

export const addTransaction = async (userId: string, transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> => {
  if (!userId) throw new Error("User ID is required to add a transaction.");
  // Convert date string to Firestore Timestamp
  const dataWithTimestamp = {
    ...transactionData,
    date: Timestamp.fromDate(new Date(transactionData.date)),
    createdAt: serverTimestamp(),
  };
  const transactionRef = await addDoc(collection(db, `users/${userId}/transactions`), dataWithTimestamp);
  return transactionRef.id;
};

export const deleteTransaction = async (userId: string, transactionId: string): Promise<void> => {
  if (!userId) throw new Error("User ID is required to delete a transaction.");
  if (!transactionId) throw new Error("Transaction ID is required to delete a transaction.");
  await deleteDoc(doc(db, `users/${userId}/transactions`, transactionId));
};

// ==== BUDGETS ====

export const getBudgets = async (userId: string): Promise<Budget[]> => {
  if (!userId) throw new Error("User ID is required to fetch budgets.");
  const budgetsCol = collection(db, `users/${userId}/budgets`);
  const budgetSnapshot = await getDocs(budgetsCol);
  return budgetSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Budget));
};

export const addBudget = async (userId: string, budgetData: Omit<Budget, 'id'>): Promise<string> => {
  if (!userId) throw new Error("User ID is required to add a budget.");
  const budgetRef = await addDoc(collection(db, `users/${userId}/budgets`), {
    ...budgetData,
    createdAt: serverTimestamp(),
  });
  return budgetRef.id;
};

export const updateBudget = async (userId: string, budgetId: string, budgetData: Partial<Omit<Budget, 'id'>>): Promise<void> => {
  if (!userId) throw new Error("User ID is required to update a budget.");
  if (!budgetId) throw new Error("Budget ID is required to update a budget.");
  const budgetRef = doc(db, `users/${userId}/budgets`, budgetId);
  await updateDoc(budgetRef, {
    ...budgetData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteBudget = async (userId: string, budgetId: string): Promise<void> => {
  if (!userId) throw new Error("User ID is required to delete a budget.");
  if (!budgetId) throw new Error("Budget ID is required to delete a budget.");
  await deleteDoc(doc(db, `users/${userId}/budgets`, budgetId));
};

// ==== GOALS ====

export const getGoals = async (userId: string): Promise<Goal[]> => {
  if (!userId) throw new Error("User ID is required to fetch goals.");
  const goalsCol = collection(db, `users/${userId}/goals`);
  const goalSnapshot = await getDocs(goalsCol);
  return goalSnapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      ...data,
      id: docSnapshot.id,
      // Convert Firestore Timestamp to string if deadline exists
      deadline: data.deadline ? (data.deadline as Timestamp).toDate().toISOString().split('T')[0] : undefined,
    } as Goal;
  });
};

export const addGoal = async (userId: string, goalData: Omit<Goal, 'id'>): Promise<string> => {
  if (!userId) throw new Error("User ID is required to add a goal.");
  const dataWithTimestamp = {
    ...goalData,
    // Convert deadline string to Firestore Timestamp if it exists
    deadline: goalData.deadline ? Timestamp.fromDate(new Date(goalData.deadline)) : undefined,
    createdAt: serverTimestamp(),
  };
  const goalRef = await addDoc(collection(db, `users/${userId}/goals`), dataWithTimestamp);
  return goalRef.id;
};

export const updateGoal = async (userId: string, goalId: string, goalData: Partial<Omit<Goal, 'id'>>): Promise<void> => {
  if (!userId) throw new Error("User ID is required to update a goal.");
  if (!goalId) throw new Error("Goal ID is required to update a goal.");
  const goalRef = doc(db, `users/${userId}/goals`, goalId);

  const dataToUpdate: any = { ...goalData, updatedAt: serverTimestamp() };
  if (goalData.deadline) {
    dataToUpdate.deadline = Timestamp.fromDate(new Date(goalData.deadline));
  } else if (goalData.hasOwnProperty('deadline') && goalData.deadline === undefined) {
    dataToUpdate.deadline = null; // Or use deleteField() if you want to remove it
  }

  await updateDoc(goalRef, dataToUpdate);
};

export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  if (!userId) throw new Error("User ID is required to delete a goal.");
  if (!goalId) throw new Error("Goal ID is required to delete a goal.");
  await deleteDoc(doc(db, `users/${userId}/goals`, goalId));
};

// Helper to get transactions for a specific period for budget calculation
export const getTransactionsForPeriod = async (
  userId: string,
  category: string,
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> => {
  if (!userId) return [];
  const transactionsCol = collection(db, `users/${userId}/transactions`);
  const q = query(
    transactionsCol,
    where('category', '==', category),
    where('type', '==', 'expense'),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );
  const transactionSnapshot = await getDocs(q);
  return transactionSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
};


// Helper to get transactions for spending trend and category breakdown
export const getTransactionsForDashboard = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  type?: 'expense' | 'income'
): Promise<Transaction[]> => {
  if (!userId) return [];
  const transactionsCol = collection(db, `users/${userId}/transactions`);
  
  let q;
  if (type) {
    q = query(
      transactionsCol,
      where('type', '==', type),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
  } else {
     q = query(
      transactionsCol,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
  }

  const transactionSnapshot = await getDocs(q);
  // Convert Firestore Timestamps in date field back to string for consistency
  return transactionSnapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      ...data,
      id: docSnapshot.id,
      date: (data.date as Timestamp).toDate().toISOString().split('T')[0],
    } as Transaction;
  });
};
