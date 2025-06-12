"use client";

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { AlertTriangle, TrendingUp, DollarSign, ArrowRight, BookOpen, BarChart, PieChartIcon } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Transaction, Budget } from '@/lib/types';
import { calculatePercentage, formatCurrency, formatDate } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, Legend as RechartsLegend } from "recharts";
import { getMonth, getYear, subMonths, format as formatDateFns, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function DashboardPage() {
  const [transactions] = useLocalStorage<Transaction[]>('fiscal-compass-transactions', []);
  const [budgets] = useLocalStorage<Budget[]>('fiscal-compass-budgets', []);

  const currentMonthBudget = useMemo(() => {
    const now = new Date();
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return getMonth(transactionDate) === getMonth(now) && getYear(transactionDate) === getYear(now) && t.type === 'expense';
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
    const oneWeekAgo = subMonths(new Date(), 0); // effectively today, for this week's spending
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= oneWeekAgo)
      .sort((a,b) => b.amount - a.amount);

    if (recentExpenses.length === 0) return null;
    
    // Simple: highest spending category this week
    const expensesByCategory: Record<string, number> = {};
    recentExpenses.forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });
    const highestCategory = Object.entries(expensesByCategory).sort(([,a],[,b]) => b-a)[0];

    if (!highestCategory) return null;

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
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && isWithinInterval(transactionDate, { start: currentMonthStart, end: currentMonthEnd });
    });

    const data: Record<string, number> = {};
    monthlyExpenses.forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value, fill: CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)] }));
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
          const transactionDate = new Date(t.date);
          return t.type === 'expense' && isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      last6MonthsData.push({ name: monthName, totalSpending: monthlySpending });
    }
    return last6MonthsData;
  }, [transactions]);


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
              {currentMonthBudget.progress}% of budget used
            </p>
            <Progress value={currentMonthBudget.progress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Spending Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {recentSpendingAlert ? (
              <>
                <div className="text-xl font-bold text-destructive">High: {recentSpendingAlert.category}</div>
                <p className="text-xs text-muted-foreground">
                  You've spent {formatCurrency(recentSpendingAlert.amount)} on {recentSpendingAlert.category.toLowerCase()} this week.
                </p>
                <Link href="/spending" className="text-sm text-primary hover:underline flex items-center mt-1">
                  View Details <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No significant spending alerts recently.</p>
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
            <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-primary" />Spending by Category (Monthly)</CardTitle>
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
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}>
                    {spendingByCategoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsLegend wrapperStyle={{fontSize: '12px'}} />
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
            <Link href="/payments">Make a Payment</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
