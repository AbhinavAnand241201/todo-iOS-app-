"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Pencil, Trash2, CalendarIcon, PlusCircle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Goal } from '@/lib/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { generateId, formatDate, formatCurrency, calculatePercentage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const goalSchema = z.object({
  description: z.string().min(1, "Description is required"),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  currentAmount: z.coerce.number().min(0, "Current amount cannot be negative").optional(),
  deadline: z.date().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

export default function FinancialGoalsPage() {
  const [goals, setGoals] = useLocalStorage<Goal[]>('fiscal-compass-goals', []);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { toast } = useToast();

  const { control, handleSubmit, register, reset, setValue: setFormValue } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      description: '',
      targetAmount: 0,
      currentAmount: 0,
    }
  });

  const onSubmit: SubmitHandler<GoalFormData> = (data) => {
    const goalData = {
      description: data.description,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      deadline: data.deadline ? format(data.deadline, 'yyyy-MM-dd') : undefined,
    };

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...editingGoal, ...goalData } : g));
      toast({ title: "Goal Updated", description: `Goal "${data.description}" successfully updated.`});
      setEditingGoal(null);
    } else {
      const newGoal: Goal = {
        id: generateId(),
        ...goalData,
      };
      setGoals(prev => [...prev, newGoal]);
      toast({ title: "Goal Added", description: `Goal "${data.description}" successfully created.`});
    }
    reset({ description: '', targetAmount: 0, currentAmount: 0, deadline: undefined });
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    toast({ title: "Goal Deleted", description: "The financial goal has been removed." });
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormValue('description', goal.description);
    setFormValue('targetAmount', goal.targetAmount);
    setFormValue('currentAmount', goal.currentAmount);
    if (goal.deadline) {
      setFormValue('deadline', new Date(goal.deadline));
    } else {
       setFormValue('deadline', undefined);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Goals" description="Define your financial aspirations and track your progress towards them." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlusCircle className="h-6 w-6 text-primary" />{editingGoal ? 'Edit Goal' : 'Create New Goal'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="e.g., Save for a new Laptop" />
              {/* {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>} */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="targetAmount">Target Amount ($)</Label>
                <Input id="targetAmount" type="number" step="0.01" {...register('targetAmount')} placeholder="e.g., 1200" />
                {/* {errors.targetAmount && <p className="text-sm text-destructive mt-1">{errors.targetAmount.message}</p>} */}
              </div>
              <div>
                <Label htmlFor="currentAmount">Current Amount ($) (Optional)</Label>
                <Input id="currentAmount" type="number" step="0.01" {...register('currentAmount')} placeholder="e.g., 300" />
                {/* {errors.currentAmount && <p className="text-sm text-destructive mt-1">{errors.currentAmount.message}</p>} */}
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
                <Button type="submit" className="w-full md:w-auto">{editingGoal ? 'Update Goal' : 'Add Goal'}</Button>
                {editingGoal && (
                    <Button variant="outline" onClick={() => { setEditingGoal(null); reset(); }} className="w-full md:w-auto">Cancel Edit</Button>
                )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Goals</CardTitle>
           <CardDescription>Data is stored in your browser and will be lost if you clear your browser data.</CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = calculatePercentage(goal.currentAmount, goal.targetAmount);
                return (
                  <Card key={goal.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{goal.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          Progress: {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          {goal.deadline && ` (Deadline: ${formatDate(goal.deadline)})`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditGoal(goal)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
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
