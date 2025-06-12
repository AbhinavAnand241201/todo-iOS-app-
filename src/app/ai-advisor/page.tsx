"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateFinancialPlan, GenerateFinancialPlanInput, GenerateFinancialPlanOutput } from '@/ai/flows/generate-financial-plan';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, FileText, CheckCircle, BarChart2, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const advisorSchema = z.object({
  spendingPatterns: z.string().min(50, "Please describe your spending patterns in at least 50 characters."),
  financialGoals: z.string().min(20, "Please describe your financial goals in at least 20 characters."),
});

type AdvisorFormData = z.infer<typeof advisorSchema>;

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

  const renderTextWithLineBreaks = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
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
                    <CardContent className="prose prose-sm max-w-none">
                      {renderTextWithLineBreaks(financialPlan.spendingAnalysis)}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="actionSteps">
                  <Card className="bg-muted/30">
                    <CardHeader><CardTitle>Action Steps</CardTitle></CardHeader>
                    <CardContent className="prose prose-sm max-w-none">
                       {renderTextWithLineBreaks(financialPlan.actionSteps)}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="investmentPlan">
                  <Card className="bg-muted/30">
                    <CardHeader><CardTitle>Investment Plan</CardTitle></CardHeader>
                    <CardContent className="prose prose-sm max-w-none">
                       {renderTextWithLineBreaks(financialPlan.investmentPlan)}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="progressTracking">
                  <Card className="bg-muted/30">
                    <CardHeader><CardTitle>Progress Tracking</CardTitle></CardHeader>
                    <CardContent className="prose prose-sm max-w-none">
                      {renderTextWithLineBreaks(financialPlan.progressTracking)}
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
