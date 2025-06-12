
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

const SpendingCategoryAnalysisSchema = z.object({
  categoryName: z.string().describe('The name of the spending category (e.g., Rent & Essentials, Groceries).'),
  oldAmount: z.number().describe('The user\'s current or previous estimated spending amount for this category.'),
  newAmount: z.number().describe('The AI\'s suggested new spending amount or allocation for this category.'),
  changeDescription: z.string().describe('A brief human-readable description of the change (e.g., "Decrease by 10%", "Allocate $50 more", "No change suggested").'),
});

const GenerateFinancialPlanOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the financial plan.'),
  spendingAnalysis: z.array(SpendingCategoryAnalysisSchema).describe('Detailed breakdown of proposed budget changes per category. Each item should include categoryName, oldAmount, newAmount, and changeDescription.'),
  actionSteps: z.string().describe('A checklist of financial advice with priorities, formatted as a multi-line string.'),
  investmentPlan: z
    .string()
    .describe('Investment strategies broken down by short-term and long-term goals, formatted as a multi-line string.'),
  progressTracking: z
    .string()
    .describe('Trackable milestones with targets and timeframes, formatted as a multi-line string.'),
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

- Summary: A high-level overview of the financial plan (string).
- Spending Analysis: This section MUST be an array of objects. Each object represents a spending category and MUST contain the following fields:
    - categoryName (string): The name of the spending category (e.g., "Rent & Essentials", "Groceries", "EMI", "Fashion & Discretionary", "Car Savings", "Remaining/Other Savings").
    - oldAmount (number): The user's current estimated spending or allocation for this category.
    - newAmount (number): Your suggested new spending or allocation for this category.
    - changeDescription (string): A brief, human-readable description of the change (e.g., "Decrease by 10%", "Increase by $50 to $250", "No change", "New allocation: $500").
  Ensure you cover key areas like essentials, discretionary spending, and savings.
- Action Steps: A checklist of financial advice with priorities (string, use markdown for lists if appropriate).
- Investment Plan: Investment strategies broken down by short-term and long-term goals (string).
- Progress Tracking: Trackable milestones with targets and timeframes (string).

Focus on providing actionable and clear advice. For the Spending Analysis, ensure the amounts are numbers and the descriptions are concise.
`,
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

