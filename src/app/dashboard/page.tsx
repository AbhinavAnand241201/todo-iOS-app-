
"use client";

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { AlertTriangle, TrendingUp, DollarSign, ArrowRight, BookOpen, BarChart, PieChartIcon, Loader2 } from 'lucide-react';
import type { Transaction, Budget } from '@/lib/types';
import { calculatePercentage, formatCurrency } from '@/lib/utils'; // formatDate removed as it's not directly used here
import { ChartContainer } from "@/components/ui/chart"; // ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent removed as not directly used here
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, Legend as RechartsLegend } from "recharts";
import { subMonths, format as formatDateFns, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { getTransactionsForDashboard, getBudgets } from '@/lib/firestoreService';
import type { Timestamp } from 'firebase/firestore';


const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchData = useCallback(async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const now = new Date();
        // Fetch transactions for the last 6 months for trend + current month for category breakdown
        const sixMonthsAgo = startOfMonth(subMonths(now, 5)); 
        const endOfCurrentMonth = endOfMonth(now);

        const [userTransactions, userBudgets] = await Promise.all([
          getTransactionsForDashboard(currentUser.uid, sixMonthsAgo, endOfCurrentMonth),
          getBudgets(currentUser.uid)
        ]);
        
        setTransactions(userTransactions);
        setBudgets(userBudgets);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Optionally show a toast
      } finally {
        setIsLoading(false);
      }
    } else {
      setTransactions([]);
      setBudgets([]);
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentMonthBudget = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.date as string); // date is string from Firestore service
      return isWithinInterval(transactionDate, { start: currentMonthStart, end: currentMonthEnd }) && t.type === 'expense';
    });
    
    const monthlyBudgets = budgets.filter(b => b.period === 'monthly');
    const totalBudgetLimit = monthlyBudgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      spent: totalSpent,
      limit: totalBudgetLimit,
      progress: totalBudgetLimit > 0 ? calculatePercentage(totalSpent, totalBudgetLimit) : 0,
    };
  }, [transactions, budgets]);

  const recentSpendingAlert = useMemo(() => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });   // Sunday

    const recentExpenses = transactions
      .filter(t => {
        const transactionDate = parseISO(t.date as string);
        return t.type === 'expense' && isWithinInterval(transactionDate, { start: currentWeekStart, end: currentWeekEnd });
      })
      .sort((a,b) => b.amount - a.amount);

    if (recentExpenses.length === 0) return null;
    
    const expensesByCategory: Record<string, number> = {};
    recentExpenses.forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(expensesByCategory).sort(([,a],[,b]) => b-a);
    
    if (sortedCategories.length === 0) return null;
    
    const highestCategory = sortedCategories[0];

    return {
      category: highestCategory[0],
      amount: highestCategory[1],
    };
  }, [transactions]);

  const spendingByCategoryChartData = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const monthlyExpenses = transactions.filter(t => {
      const transactionDate = parseISO(t.date as string);
      return t.type === 'expense' && isWithinInterval(transactionDate, { start: currentMonthStart, end: currentMonthEnd });
    });

    const data: Record<string, number> = {};
    monthlyExpenses.forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value], index) => ({ name, value, fill: CHART_COLORS[index % CHART_COLORS.length] }));
  }, [transactions]);
  
  const spendingTrendChartData = useMemo(() => {
    const last6MonthsData: { name: string; totalSpending: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const targetMonthDate = subMonths(now, i);
      const monthName = formatDateFns(targetMonthDate, 'MMM');
      const monthStart = startOfMonth(targetMonthDate);
      const monthEnd = endOfMonth(targetMonthDate);

      const monthlySpending = transactions
        .filter(t => {
          const transactionDate = parseISO(t.date as string);
          return t.type === 'expense' && isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      last6MonthsData.push({ name: monthName, totalSpending: monthlySpending });
    }
    return last6MonthsData;
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your financial overview and quick actions." />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthBudget.spent)} / {formatCurrency(currentMonthBudget.limit)}</div>
            <p className="text-xs text-muted-foreground">
              {currentMonthBudget.limit > 0 ? `${currentMonthBudget.progress.toFixed(0)}% of budget used` : 'No monthly budget set'}
            </p>
            <Progress value={currentMonthBudget.progress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week's Top Expense</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {recentSpendingAlert ? (
              <>
                <div className="text-xl font-bold text-destructive">{recentSpendingAlert.category}</div>
                <p className="text-xs text-muted-foreground">
                  You've spent {formatCurrency(recentSpendingAlert.amount)} on {recentSpendingAlert.category.toLowerCase()} this week.
                </p>
                <Link href="/spending" className="text-sm text-primary hover:underline flex items-center mt-1">
                  View Details <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No significant spending alerts for this week.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Financial Tip</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <p className="text-sm">Consider automating your savings to reach your goals faster.</p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/ai-advisor">Get Personalized Advice <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-primary" />Spending by Category (This Month)</CardTitle>
            <CardDescription>Breakdown of your expenses for the current month.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {spendingByCategoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Pie data={spendingByCategoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                      return (
                        <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}>
                    {spendingByCategoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsLegend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground pt-10">No spending data for this month.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary" />Spending Trend (Last 6 Months)</CardTitle>
            <CardDescription>Total spending over the past six months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             {spendingTrendChartData.some(d => d.totalSpending > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={spendingTrendChartData}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value, 'USD').replace('US','').replace('.00','')}`} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="totalSpending" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground pt-10">Not enough spending data for trend.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/spending#add-transaction">Track New Expense</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href="/budgets">Manage Budgets</Link>
          </Button>
           <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href="/financial-goals">Set Financial Goals</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
