"use client";

import React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, ScanLine, Info } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Budget, Transaction } from '@/lib/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getMonth, getYear, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Sample categories, ideally should align with budget categories
const paymentCategories = ["Food", "Transport", "Utilities", "Entertainment", "Health", "Shopping", "Other"];


export default function PaymentsPage() {
  const [budgets] = useLocalStorage<Budget[]>('fiscal-compass-budgets', []);
  const [transactions] = useLocalStorage<Transaction[]>('fiscal-compass-transactions', []);
  const { toast } = useToast();

  const { control, handleSubmit, register, reset, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit: SubmitHandler<PaymentFormData> = (data) => {
    const budgetForCategory = budgets.find(b => b.category === data.category && b.period === 'monthly'); // Assuming monthly for simulation simplicity

    if (!budgetForCategory) {
      toast({
        title: "No Budget Found",
        description: `There is no monthly budget set for the "${data.category}" category. Payment simulated without budget check.`,
        variant: "default" 
      });
      // Optionally, still record as a transaction if desired, or just simulate
      console.log("Simulated payment:", data);
      reset();
      return;
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const spentThisMonth = transactions
      .filter(t => 
        t.category === data.category && 
        t.type === 'expense' && 
        isWithinInterval(new Date(t.date), { start: currentMonthStart, end: currentMonthEnd })
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const remainingBudget = budgetForCategory.limit - spentThisMonth;

    if (data.amount <= remainingBudget) {
      toast({
        title: "Payment Successful (Simulation)",
        description: `Payment of $${data.amount} for "${data.category}" is within budget.`,
        variant: "default", // Shadcn toast uses 'default' not 'success'
      });
    } else {
      toast({
        title: "STRICT Warning: Over Budget! (Simulation)",
        description: `This payment of $${data.amount} for "${data.category}" will exceed your monthly budget by $${(data.amount - remainingBudget).toFixed(2)}.`,
        variant: "destructive",
      });
    }
    // Simulate recording this payment as a transaction if desired (not specified, but logical)
    // For now, just log and reset
    console.log("Simulated payment attempted:", data, "Remaining budget:", remainingBudget);
    reset();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payments Simulation" description="Simulate making payments and check against your budgets." />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ScanLine className="h-6 w-6 text-primary" />Simulate Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="Enter payment amount" />
                {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select payment category" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
              </div>
              <Button type="submit" className="w-full">
                Simulate Scan & Pay
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="h-6 w-6 text-muted-foreground" />Merchant QR</CardTitle>
            <CardDescription>Visual for mock scan.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-full min-h-[200px] bg-muted/30 rounded-md">
            <div className="text-center text-muted-foreground p-4 border-2 border-dashed border-border rounded-lg">
              <QrCode className="h-24 w-24 mx-auto mb-2 opacity-50" data-ai-hint="QR code" />
              <p>Merchant QR Code Placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="flex flex-row items-center gap-2">
            <Info className="h-5 w-5 text-blue-600"/>
            <CardTitle className="text-blue-800">About This Mock Feature</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <p>This page simulates a payment process to check against your set budgets. It does not involve real financial transactions or integrations with payment gateways.</p>
          <p className="mt-2">When you "Simulate Scan & Pay", the system checks if the entered amount for the selected category is within your monthly budget limit. You'll receive a success message or a warning if you're about to go over budget.</p>
        </CardContent>
      </Card>
    </div>
  );
}
