
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import type { Budget, Transaction } from '@/lib/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatCurrency, calculatePercentage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getMonth, getYear, format, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { getBudgets, addBudget, updateBudget, deleteBudget, getTransactionsForPeriod } from '@/lib/firestoreService';
import type { Timestamp } from 'firebase/firestore';

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  limit: z.coerce.number().positive("Limit must be a positive number"),
  period: z.enum(['monthly', 'weekly', 'yearly'], { required_error: "Period is required" }),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const budgetCategories = ["Food", "Transport", "Utilities", "Entertainment", "Health", "Shopping", "Savings", "Education", "Travel", "Other"];

interface BudgetWithSpent extends Budget {
  spentAmount: number;
  progress: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetDetails, setBudgetDetails] = useState<BudgetWithSpent[]>([]);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // For form submissions
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const { control, handleSubmit, register, reset, setValue: setFormValue, formState: { errors } } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: '',
      limit: 0,
      period: 'monthly',
    }
  });

  const fetchUserBudgetsAndDetails = useCallback(async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const userBudgets = await getBudgets(currentUser.uid);
        setBudgets(userBudgets);

        const today = new Date();
        const detailsPromises = userBudgets.map(async (budget) => {
          let startDate: Date, endDate: Date;
          if (budget.period === 'monthly') {
            startDate = startOfMonth(today);
            endDate = endOfMonth(today);
          } else if (budget.period === 'weekly') {
            startDate = startOfWeek(today);
            endDate = endOfWeek(today);
          } else { // yearly
            startDate = new Date(getYear(today), 0, 1);
            endDate = new Date(getYear(today), 11, 31);
          }
          const relevantTransactions = await getTransactionsForPeriod(currentUser.uid, budget.category, startDate, endDate);
          const spentAmount = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
          return {
            ...budget,
            spentAmount,
            progress: calculatePercentage(spentAmount, budget.limit),
          };
        });
        const resolvedDetails = await Promise.all(detailsPromises);
        setBudgetDetails(resolvedDetails);

      } catch (error) {
        console.error("Error fetching budgets:", error);
        toast({ title: "Error", description: "Could not fetch budgets.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setBudgets([]);
      setBudgetDetails([]);
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchUserBudgetsAndDetails();
  }, [fetchUserBudgetsAndDetails]);


  const onSubmit: SubmitHandler<BudgetFormData> = async (data) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      if (editingBudget) {
        await updateBudget(currentUser.uid, editingBudget.id, data);
        toast({ title: "Budget Updated", description: `${data.category} budget successfully updated.` });
        setEditingBudget(null);
      } else {
        await addBudget(currentUser.uid, data);
        toast({ title: "Budget Added", description: `${data.category} budget successfully created.` });
      }
      reset({ category: '', limit: 0, period: 'monthly' });
      fetchUserBudgetsAndDetails();
    } catch (error) {
      console.error("Error saving budget:", error);
      toast({ title: "Error", description: "Could not save budget.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
     if (!currentUser) return;
     setIsProcessing(true);
    try {
      await deleteBudget(currentUser.uid, id);
      toast({ title: "Budget Deleted", description: "The budget has been removed." });
      fetchUserBudgetsAndDetails();
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast({ title: "Error", description: "Could not delete budget.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setFormValue('category', budget.category);
    setFormValue('limit', budget.limit);
    setFormValue('period', budget.period);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader title="Manage Budgets" description="Set spending limits for categories and track your progress." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-primary" />
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </CardTitle>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!editingBudget && budgetCategories.includes(editingBudget.category) || isProcessing}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <Label htmlFor="limit">Limit ($)</Label>
                <Input id="limit" type="number" step="0.01" {...register('limit')} placeholder="e.g., 500" disabled={isProcessing} />
                {errors.limit && <p className="text-sm text-destructive mt-1">{errors.limit.message}</p>}
              </div>
              <div>
                <Label htmlFor="period">Period</Label>
                <Controller
                  name="period"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isProcessing}>
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
                {errors.period && <p className="text-sm text-destructive mt-1">{errors.period.message}</p>}
              </div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" className="w-full md:w-auto" disabled={isLoading || isProcessing || !currentUser}>
                    {(isLoading || isProcessing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingBudget ? 'Update Budget' : 'Add Budget'}
                </Button>
                {editingBudget && (
                    <Button variant="outline" onClick={() => { setEditingBudget(null); reset({ category: '', limit: 0, period: 'monthly' }); }} className="w-full md:w-auto" disabled={isProcessing}>Cancel Edit</Button>
                )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Budgets</CardTitle>
          <CardDescription>Your budget data, securely stored.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !budgetDetails.length ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : budgetDetails.length > 0 ? (
            <div className="space-y-4">
              {budgetDetails.map((budget) => (
                  <Card key={budget.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{budget.category} ({budget.period})</h3>
                        <p className="text-sm text-muted-foreground">
                          Spent: <span className={budget.spentAmount > budget.limit ? 'text-destructive font-bold' : 'text-foreground'}>{formatCurrency(budget.spentAmount)}</span> / Limit: {formatCurrency(budget.limit)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditBudget(budget)} disabled={isProcessing}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBudget(budget.id)} disabled={isProcessing}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={budget.progress} className="mt-2 h-3" indicatorClassName={budget.spentAmount > budget.limit ? 'bg-destructive' : 'bg-primary'} />
                    {budget.spentAmount > budget.limit && (
                        <p className="text-xs text-destructive mt-1">You are over budget by {formatCurrency(budget.spentAmount - budget.limit)}!</p>
                    )}
                  </Card>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No budgets created yet. Add one above to start tracking!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
