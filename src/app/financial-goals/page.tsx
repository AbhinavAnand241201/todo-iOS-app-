
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Pencil, Trash2, CalendarIcon, PlusCircle, Loader2 } from 'lucide-react';
import type { Goal } from '@/lib/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { formatDate, formatCurrency, calculatePercentage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getGoals, addGoal, updateGoal, deleteGoal } from '@/lib/firestoreService';
import { Timestamp } from 'firebase/firestore'; // Added import for Timestamp


const goalSchema = z.object({
  description: z.string().min(1, "Description is required"),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  currentAmount: z.coerce.number().min(0, "Current amount cannot be negative").default(0),
  deadline: z.date().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

export default function FinancialGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const { control, handleSubmit, register, reset, setValue: setFormValue, formState: { errors } } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      description: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: undefined,
    }
  });

  const fetchUserGoals = useCallback(async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const userGoals = await getGoals(currentUser.uid);
        setGoals(userGoals);
      } catch (error) {
        console.error("Error fetching goals:", error);
        toast({ title: "Error", description: "Could not fetch goals.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setGoals([]);
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchUserGoals();
  }, [fetchUserGoals]);

  const onSubmit: SubmitHandler<GoalFormData> = async (data) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    const goalData = {
      description: data.description,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      deadline: data.deadline ? format(data.deadline, 'yyyy-MM-dd') : undefined,
    };

    try {
      if (editingGoal) {
        await updateGoal(currentUser.uid, editingGoal.id, goalData);
        toast({ title: "Goal Updated", description: `Goal "${data.description}" successfully updated.`});
        setEditingGoal(null);
      } else {
        await addGoal(currentUser.uid, goalData);
        toast({ title: "Goal Added", description: `Goal "${data.description}" successfully created.`});
      }
      reset({ description: '', targetAmount: 0, currentAmount: 0, deadline: undefined });
      fetchUserGoals();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast({ title: "Error", description: "Could not save goal.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!currentUser) return;
    setIsProcessing(true);
    try {
      await deleteGoal(currentUser.uid, id);
      toast({ title: "Goal Deleted", description: "The financial goal has been removed." });
      fetchUserGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({ title: "Error", description: "Could not delete goal.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormValue('description', goal.description);
    setFormValue('targetAmount', goal.targetAmount);
    setFormValue('currentAmount', goal.currentAmount);
    if (goal.deadline && typeof goal.deadline === 'string') {
       // Add time to parseISO to avoid timezone issues with date-only strings
      setFormValue('deadline', parseISO(goal.deadline + 'T00:00:00'));
    } else {
       setFormValue('deadline', undefined);
    }
  };
  
  const displayDeadline = (deadline?: string | Timestamp | null | Date): string | undefined => {
    if (!deadline) return undefined;
    if (deadline instanceof Timestamp) return formatDate(deadline.toDate());
    if (deadline instanceof Date) return formatDate(deadline);
    return formatDate(deadline as string); // Assumes string is 'yyyy-MM-dd' or parsable
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Financial Goals" description="Define your financial aspirations and track your progress towards them." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-primary" />
            {editingGoal ? 'Edit Goal' : 'Create New Goal'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="e.g., Save for a new Laptop" disabled={isProcessing} />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="targetAmount">Target Amount ($)</Label>
                <Input id="targetAmount" type="number" step="0.01" {...register('targetAmount')} placeholder="e.g., 1200" disabled={isProcessing}/>
                {errors.targetAmount && <p className="text-sm text-destructive mt-1">{errors.targetAmount.message}</p>}
              </div>
              <div>
                <Label htmlFor="currentAmount">Current Amount ($)</Label>
                <Input id="currentAmount" type="number" step="0.01" {...register('currentAmount')} placeholder="e.g., 300" disabled={isProcessing}/>
                {errors.currentAmount && <p className="text-sm text-destructive mt-1">{errors.currentAmount.message}</p>}
              </div>
              <div>
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Controller
                  name="deadline"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                          disabled={isProcessing}
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
              </div>
            </div>
             <div className="flex gap-2">
                <Button type="submit" className="w-full md:w-auto" disabled={isLoading || isProcessing || !currentUser}>
                    {(isLoading || isProcessing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingGoal ? 'Update Goal' : 'Add Goal'}
                </Button>
                {editingGoal && (
                    <Button variant="outline" onClick={() => { setEditingGoal(null); reset(); }} className="w-full md:w-auto" disabled={isProcessing}>Cancel Edit</Button>
                )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Goals</CardTitle>
           <CardDescription>Your goals, securely stored and tracked.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !goals.length ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = calculatePercentage(goal.currentAmount, goal.targetAmount);
                const deadlineText = displayDeadline(goal.deadline);
                return (
                  <Card key={goal.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{goal.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          Progress: {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          {deadlineText && ` (Deadline: ${deadlineText})`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditGoal(goal)} disabled={isProcessing}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)} disabled={isProcessing}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={progress} className="mt-2 h-3" />
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No financial goals set yet. Create one above to get started!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
