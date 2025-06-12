
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, CalendarIcon, PlusCircle, Loader2 } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getTransactions, addTransaction, deleteTransaction } from '@/lib/firestoreService';
import type { Transaction } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';

const transactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(['expense', 'income'], { required_error: "Type is required" }),
  category: z.string().min(1, "Category is required"),
  date: z.date({ required_error: "Date is required" }),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const expenseCategories = ["Food", "Transport", "Utilities", "Entertainment", "Health", "Shopping", "Education", "Travel", "Other"];
const incomeCategories = ["Salary", "Bonus", "Freelance", "Investment", "Gift", "Other"];

export default function SpendingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const { control, handleSubmit, register, reset, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'expense',
      category: '',
      date: new Date(),
    }
  });

  const transactionType = watch("type");
  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;
  
  // Reset category if type changes and selected category is not in the new list
  useEffect(() => {
    const currentCategory = watch('category');
    if (currentCategory && !categories.includes(currentCategory)) {
        setValue('category', '');
    }
  }, [transactionType, categories, watch, setValue]);


  const fetchUserTransactions = useCallback(async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const userTransactions = await getTransactions(currentUser.uid);
        // Convert Firestore Timestamps to strings for display
        const formattedTransactions = userTransactions.map(t => ({
          ...t,
          date: t.date instanceof Timestamp ? t.date.toDate().toISOString().split('T')[0] : t.date as string,
        }));
        setTransactions(formattedTransactions.sort((a,b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime()));
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast({ title: "Error", description: "Could not fetch transactions.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setTransactions([]); // Clear transactions if user logs out
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchUserTransactions();
  }, [fetchUserTransactions]);

  const onSubmit: SubmitHandler<TransactionFormData> = async (data) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add a transaction.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const transactionData = {
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: format(data.date, 'yyyy-MM-dd'), // Store date as string for Firestore service
      };
      await addTransaction(currentUser.uid, transactionData);
      toast({ title: "Transaction Added", description: `${data.description} successfully recorded.` });
      reset({ description: '', amount: 0, type: 'expense', category: '', date: new Date() });
      fetchUserTransactions(); // Refetch transactions
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ title: "Error", description: "Could not add transaction.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to delete a transaction.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await deleteTransaction(currentUser.uid, id);
      toast({ title: "Transaction Deleted", description: "The transaction has been removed." });
      fetchUserTransactions(); // Refetch transactions
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({ title: "Error", description: "Could not delete transaction.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const displayDate = (dateValue: string | Timestamp | Date): string => {
    if (dateValue instanceof Timestamp) {
      return formatDate(dateValue.toDate());
    }
    if (dateValue instanceof Date) {
      return formatDate(dateValue);
    }
    return formatDate(dateValue); // Assumes string is in 'yyyy-MM-dd' or parsable format
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Spending Tracker" description="Log your income and expenses to stay on top of your finances." />
      
      <Card id="add-transaction">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlusCircle className="h-6 w-6 text-primary" />Add New Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register('description')} placeholder="e.g., Lunch with friends" />
                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="e.g., 25.50" />
                {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => { field.onChange(value); setValue('category', ''); }} value={field.value}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                 <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category"/>
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                 {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={isLoading || !currentUser}>
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Add Transaction
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your financial activity, securely stored.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !transactions.length ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{displayDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(transaction.id)} disabled={isLoading}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No transactions yet. Add one above to get started!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
