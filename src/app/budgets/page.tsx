"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Budget, Transaction } from '@/lib/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateId, formatCurrency, calculatePercentage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getMonth, getYear, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  limit: z.coerce.number().positive("Limit must be a positive number"),
  period: z.enum(['monthly', 'weekly', 'yearly'], { required_error: "Period is required" }),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

// Sample categories, could be shared or fetched
const budgetCategories = ["Food", "Transport", "Utilities", "Entertainment", "Health", "Shopping", "Savings", "Education", "Travel", "Other"];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('fiscal-compass-budgets', []);
  const [transactions] = useLocalStorage<Transaction[]>('fiscal-compass-transactions', []);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { toast } = useToast();

  const { control, handleSubmit, register, reset, setValue: setFormValue } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: '',
      limit: 0,
      period: 'monthly',
    }
  });

  const onSubmit: SubmitHandler<BudgetFormData> = (data) => {
    if (editingBudget) {
      setBudgets(prev => prev.map(b => b.id === editingBudget.id ? { ...editingBudget, ...data } : b));
      toast({ title: "Budget Updated", description: `${data.category} budget successfully updated.` });
      setEditingBudget(null);
    } else {
      const newBudget: Budget = {
        id: generateId(),
        ...data,
      };
      setBudgets(prev => [...prev, newBudget]);
      toast({ title: "Budget Added", description: `${data.category} budget successfully created.` });
    }
    reset({ category: '', limit: 0, period: 'monthly' });
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    toast({ title: "Budget Deleted", description: "The budget has been removed." });
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setFormValue('category', budget.category);
    setFormValue('limit', budget.limit);
    setFormValue('period', budget.period);
  };

  const calculateSpentAmount = (budget: Budget): number => {
    const now = new Date();
    let relevantTransactions = transactions.filter(t => t.category === budget.category && t.type === 'expense');

    if (budget.period === 'monthly') {
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      relevantTransactions = relevantTransactions.filter(t => isWithinInterval(new Date(t.date), { start: currentMonthStart, end: currentMonthEnd }));
    } else if (budget.period === 'weekly') {
      // Example: current week (Sunday to Saturday)
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      relevantTransactions = relevantTransactions.filter(t => isWithinInterval(new Date(t.date), {start: startOfMonth(weekStart), end: endOfMonth(weekEnd)}));

    } else if (budget.period === 'yearly') {
       relevantTransactions = relevantTransactions.filter(t => getYear(new Date(t.date)) === getYear(now));
    }
    return relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Budgets" description="Set spending limits for categories and track your progress." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlusCircle className="h-6 w-6 text-primary" />{editingBudget ? 'Edit Budget' : 'Create New Budget'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!editingBudget && budgetCategories.includes(editingBudget.category) /* Prevent changing category when editing for simplicity or allow it based on UX choice */}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {/* {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>} */}
              </div>
              <div>
                <Label htmlFor="limit">Limit ($)</Label>
                <Input id="limit" type="number" step="0.01" {...register('limit')} placeholder="e.g., 500" />
                {/* {errors.limit && <p className="text-sm text-destructive mt-1">{errors.limit.message}</p>} */}
              </div>
              <div>
                <Label htmlFor="period">Period</Label>
                <Controller
                  name="period"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="period">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {/* {errors.period && <p className="text-sm text-destructive mt-1">{errors.period.message}</p>} */}
              </div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" className="w-full md:w-auto">{editingBudget ? 'Update Budget' : 'Add Budget'}</Button>
                {editingBudget && (
                    <Button variant="outline" onClick={() => { setEditingBudget(null); reset(); }} className="w-full md:w-auto">Cancel Edit</Button>
                )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Budgets</CardTitle>
          <CardDescription>Data is stored in your browser and will be lost if you clear your browser data.</CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const spentAmount = calculateSpentAmount(budget);
                const progress = calculatePercentage(spentAmount, budget.limit);
                return (
                  <Card key={budget.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{budget.category} ({budget.period})</h3>
                        <p className="text-sm text-muted-foreground">
                          Spent: <span className={spentAmount > budget.limit ? 'text-destructive font-bold' : 'text-foreground'}>{formatCurrency(spentAmount)}</span> / Limit: {formatCurrency(budget.limit)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditBudget(budget)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBudget(budget.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={progress} className="mt-2 h-3" indicatorClassName={spentAmount > budget.limit ? 'bg-destructive' : 'bg-primary'} />
                    {spentAmount > budget.limit && (
                        <p className="text-xs text-destructive mt-1">You are over budget by {formatCurrency(spentAmount - budget.limit)}!</p>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No budgets created yet. Add one above to start tracking!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
