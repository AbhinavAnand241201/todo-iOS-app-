
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

const ActionStepSchema = z.object({
  step: z.string().describe('A concise description of the action step.'),
  priority: z.string().optional().describe('The priority of the action step (e.g., High, Medium, Low).'),
  details: z.string().optional().describe('Optional further details or explanation for the action step.'),
});

const InvestmentStrategySchema = z.object({
  term: z.string().describe('The investment term, e.g., "Short-Term Goals" or "Long-Term Goals".'),
  strategy: z.string().describe('The specific investment strategy or advice for this term.'),
  rationale: z.string().optional().describe('Optional rationale behind the strategy.'),
});

const ProgressMilestoneSchema = z.object({
  milestone: z.string().describe('A specific, trackable milestone.'),
  target: z.string().describe('The target for this milestone (e.g., "$500 saved", "Debt reduced by 10%").'),
  timeframe: z.string().describe('The suggested timeframe to achieve this milestone (e.g., "Within 3 months", "By end of year").'),
});


const GenerateFinancialPlanOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the financial plan.'),
  spendingAnalysis: z.array(SpendingCategoryAnalysisSchema).describe('Detailed breakdown of proposed budget changes per category. Each item should include categoryName, oldAmount, newAmount, and changeDescription.'),
  actionSteps: z.array(ActionStepSchema).describe('A list of actionable financial advice items. Each item should include a "step", optional "priority", and optional "details".'),
  investmentPlan: z.array(InvestmentStrategySchema).describe('Investment strategies broken down by short-term and long-term goals. Each item should include "term", "strategy", and optional "rationale".'),
  progressTracking: z.array(ProgressMilestoneSchema).describe('Trackable milestones. Each item should include "milestone", "target", and "timeframe".'),
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

Your financial plan must include the following sections, formatted as JSON according to the output schema:

- summary (string): A high-level overview of the financial plan.
- spendingAnalysis (array of objects): Each object represents a spending category and MUST contain:
    - categoryName (string): e.g., "Rent & Essentials", "Groceries".
    - oldAmount (number): User's current estimated spending.
    - newAmount (number): Your suggested new spending.
    - changeDescription (string): Brief description of the change.
  Ensure you cover key areas like essentials, discretionary spending, and savings.

- actionSteps (array of objects): A list of actionable financial advice. Each object MUST contain:
    - step (string): Concise description of the action.
    - priority (string, optional): Priority (e.g., "High", "Medium", "Low").
    - details (string, optional): Further explanation.

- investmentPlan (array of objects): Investment strategies. Each object MUST contain:
    - term (string): e.g., "Short-Term Goals", "Long-Term Goals".
    - strategy (string): Specific strategy for this term.
    - rationale (string, optional): Reasoning for the strategy.

- progressTracking (array of objects): Trackable milestones. Each object MUST contain:
    - milestone (string): Specific trackable milestone.
    - target (string): Target for this milestone.
    - timeframe (string): Suggested timeframe.

Focus on providing actionable and clear advice. Ensure all outputs strictly adhere to the specified object structures for each array.
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
