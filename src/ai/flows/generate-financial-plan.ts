'use server';

/**
 * @fileOverview AI agent that generates a personalized financial plan based on user input.
 *
 * - generateFinancialPlan - A function that generates a financial plan.
 * - GenerateFinancialPlanInput - The input type for the generateFinancialPlan function.
 * - GenerateFinancialPlanOutput - The return type for the generateFinancialPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFinancialPlanInputSchema = z.object({
  spendingPatterns: z
    .string()
    .describe('Description of the user spending patterns in natural language.'),
  financialGoals: z
    .string()
    .describe('Description of the user financial goals in natural language.'),
});

export type GenerateFinancialPlanInput = z.infer<
  typeof GenerateFinancialPlanInputSchema
>;

const GenerateFinancialPlanOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the financial plan.'),
  spendingAnalysis: z
    .string()
    .describe('Proposed budget changes and category analysis.'),
  actionSteps: z.string().describe('A checklist of financial advice with priorities.'),
  investmentPlan: z
    .string()
    .describe('Investment strategies broken down by short-term and long-term goals.'),
  progressTracking: z
    .string()
    .describe('Trackable milestones with targets and timeframes.'),
});

export type GenerateFinancialPlanOutput = z.infer<
  typeof GenerateFinancialPlanOutputSchema
>;

export async function generateFinancialPlan(
  input: GenerateFinancialPlanInput
): Promise<GenerateFinancialPlanOutput> {
  return generateFinancialPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFinancialPlanPrompt',
  input: {schema: GenerateFinancialPlanInputSchema},
  output: {schema: GenerateFinancialPlanOutputSchema},
  prompt: `You are an AI Financial Advisor. Based on the user's spending patterns and financial goals,
you will generate a personalized financial plan.

Spending Patterns: {{{spendingPatterns}}}
Financial Goals: {{{financialGoals}}}

Your financial plan must include the following sections:

- Summary: A high-level overview of the financial plan.
- Spending Analysis: Proposed budget changes and category analysis.
- Action Steps: A checklist of financial advice with priorities.
- Investment Plan: Investment strategies broken down by short-term and long-term goals.
- Progress Tracking: Trackable milestones with targets and timeframes.`,
});

const generateFinancialPlanFlow = ai.defineFlow(
  {
    name: 'generateFinancialPlanFlow',
    inputSchema: GenerateFinancialPlanInputSchema,
    outputSchema: GenerateFinancialPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
