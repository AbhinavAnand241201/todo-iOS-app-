
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateFinancialPlan, GenerateFinancialPlanInput, GenerateFinancialPlanOutput } from '@/ai/flows/generate-financial-plan';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, FileText, CheckCircle, BarChart2, TrendingUp, BadgeAlert, Lightbulb, Flag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // Added Badge import

const advisorSchema = z.object({
  spendingPatterns: z.string().min(50, "Please describe your spending patterns in at least 50 characters."),
  financialGoals: z.string().min(20, "Please describe your financial goals in at least 20 characters."),
});

type AdvisorFormData = z.infer<typeof advisorSchema>;

type SpendingAnalysisItem = GenerateFinancialPlanOutput["spendingAnalysis"][0];
type ActionStepItem = GenerateFinancialPlanOutput["actionSteps"][0];
type InvestmentStrategyItem = GenerateFinancialPlanOutput["investmentPlan"][0];
type ProgressMilestoneItem = GenerateFinancialPlanOutput["progressTracking"][0];


export default function AiAdvisorPage() {
  const [financialPlan, setFinancialPlan] = useState<GenerateFinancialPlanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<AdvisorFormData>({
    resolver: zodResolver(advisorSchema),
  });

  const onSubmit: SubmitHandler<AdvisorFormData> = async (data) => {
    setIsLoading(true);
    setFinancialPlan(null);
    try {
      const input: GenerateFinancialPlanInput = {
        spendingPatterns: data.spendingPatterns,
        financialGoals: data.financialGoals,
      };
      const plan = await generateFinancialPlan(input);
      setFinancialPlan(plan);
      toast({ title: "Financial Plan Generated!", description: "Your personalized financial plan is ready." });
    } catch (error) {
      console.error("Error generating financial plan:", error);
      toast({
        title: "Error",
        description: "Could not generate financial plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="AI Financial Advisor" description="Get personalized financial advice based on your habits and goals." />

      {!financialPlan ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" />Tell Us About Yourself</CardTitle>
            <CardDescription>The more details you provide, the better the advice.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="spendingPatterns">Your Spending Patterns</Label>
                <Textarea
                  id="spendingPatterns"
                  {...register('spendingPatterns')}
                  rows={5}
                  placeholder="Describe your typical monthly income, expenses, and how you usually spend your money (e.g., 'I earn $X monthly. My rent is $Y. I spend about $Z on groceries, $A on dining out...')"
                />
                {errors.spendingPatterns && <p className="text-sm text-destructive mt-1">{errors.spendingPatterns.message}</p>}
              </div>
              <div>
                <Label htmlFor="financialGoals">Your Financial Goals</Label>
                <Textarea
                  id="financialGoals"
                  {...register('financialGoals')}
                  rows={5}
                  placeholder="What are you saving for? What are your long-term financial ambitions? (e.g., 'I want to save for a down payment on a house in 5 years. I also want to build an emergency fund of $X...')"
                />
                {errors.financialGoals && <p className="text-sm text-destructive mt-1">{errors.financialGoals.message}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Financial Plan
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Financial Plan</CardTitle>
            <CardDescription>{financialPlan.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="spendingAnalysis" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
                <TabsTrigger value="spendingAnalysis" className="flex items-center gap-1"><FileText className="h-4 w-4" />Spending Analysis</TabsTrigger>
                <TabsTrigger value="actionSteps" className="flex items-center gap-1"><CheckCircle className="h-4 w-4" />Action Steps</TabsTrigger>
                <TabsTrigger value="investmentPlan" className="flex items-center gap-1"><TrendingUp className="h-4 w-4" />Investment Plan</TabsTrigger>
                <TabsTrigger value="progressTracking" className="flex items-center gap-1"><BarChart2 className="h-4 w-4" />Progress Tracking</TabsTrigger>
              </TabsList>
              <ScrollArea className="h-[400px] p-1">
                <TabsContent value="spendingAnalysis">
                  <Card className="bg-muted/30">
                    <CardHeader><CardTitle>Spending Analysis</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {financialPlan.spendingAnalysis && financialPlan.spendingAnalysis.length > 0 ? (
                        financialPlan.spendingAnalysis.map((item: SpendingAnalysisItem, index: number) => (
                          <div key={index} className="py-3 px-1 rounded-md border border-border/50 bg-background/50 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-semibold text-foreground">{item.categoryName}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(item.oldAmount)} &rarr; {formatCurrency(item.newAmount)}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{item.changeDescription}</p>
                            <div className="h-1 w-full bg-primary/20 rounded-full">
                               <div
                                className="h-1 rounded-full bg-primary"
                                style={{ width: `${Math.min(100, Math.max(0, (item.newAmount / (item.oldAmount || item.newAmount || 1)) * 50 + 25 ))}%` }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No spending analysis data available.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="actionSteps">
                  <Card className="bg-muted/30">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/>Action Steps</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                       {financialPlan.actionSteps && financialPlan.actionSteps.length > 0 ? (
                        financialPlan.actionSteps.map((item: ActionStepItem, index: number) => (
                          <Card key={index} className="p-3 bg-background/70 shadow">
                            <CardDescription className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{item.step}</span>
                            </CardDescription>
                            {item.priority && (
                                <Badge variant={
                                    item.priority.toLowerCase() === 'high' ? 'destructive' : 
                                    item.priority.toLowerCase() === 'medium' ? 'secondary' : 'outline'
                                } className="mt-1 text-xs">{item.priority} Priority</Badge>
                            )}
                            {item.details && <p className="text-xs text-muted-foreground mt-1 pl-6">{item.details}</p>}
                          </Card>
                        ))
                      ) : (
                        <p>No action steps provided.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="investmentPlan">
                  <Card className="bg-muted/30">
                    <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/>Investment Plan</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {financialPlan.investmentPlan && financialPlan.investmentPlan.length > 0 ? (
                        financialPlan.investmentPlan.map((item: InvestmentStrategyItem, index: number) => (
                           <Card key={index} className="p-3 bg-background/70 shadow">
                            <CardTitle className="text-md mb-1">{item.term}</CardTitle>
                            <CardDescription>{item.strategy}</CardDescription>
                            {item.rationale && <p className="text-xs text-muted-foreground mt-1">{item.rationale}</p>}
                          </Card>
                        ))
                      ) : (
                        <p>No investment plan provided.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="progressTracking">
                  <Card className="bg-muted/30">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Flag className="h-5 w-5 text-primary"/>Progress Tracking Milestones</CardTitle></CardHeader>
                     <CardContent className="space-y-3">
                      {financialPlan.progressTracking && financialPlan.progressTracking.length > 0 ? (
                        financialPlan.progressTracking.map((item: ProgressMilestoneItem, index: number) => (
                           <Card key={index} className="p-3 bg-background/70 shadow">
                            <p className="font-semibold text-foreground">{item.milestone}</p>
                            <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                                <span>Target: {item.target}</span>
                                <span>Timeframe: {item.timeframe}</span>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <p>No progress tracking milestones provided.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            <Button onClick={() => setFinancialPlan(null)} variant="outline" className="mt-6 w-full md:w-auto">
              Generate New Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
