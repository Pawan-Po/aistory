// src/ai/flows/generate-story-from-preferences.ts
'use server';
/**
 * @fileOverview Generates a story based on user preferences including character details, themes, and moral lessons.
 *
 * - generateStoryFromPreferences - A function that generates a story based on preferences.
 * - GenerateStoryInput - The input type for the generateStoryFromPreferences function.
 * - GenerateStoryOutput - The return type for the generateStoryFromPreferences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStoryInputSchema = z.object({
  characterImage: z
    .string()
    .describe(
      "A photo of the main character, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  storyTheme: z.string().describe('The theme of the story (e.g., adventure, mystery, fantasy).'),
  moralLesson: z.string().describe('The moral lesson to be included in the story (e.g., honesty, kindness, courage).'),
  additionalDetails: z.string().describe('Any additional details or preferences for the story.'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('The title of the generated story.'),
  story: z.string().describe('The generated story content.'),
  characterDescription: z.string().describe('A description of the animated character.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStoryFromPreferences(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFromPreferencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryFromPreferencesPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `You are a children's book author. Generate a unique and engaging story based on the following preferences:

Theme: {{{storyTheme}}}
Moral Lesson: {{{moralLesson}}}
Additional Details: {{{additionalDetails}}}

Create a description of the character based on this image: {{media url=characterImage}}


Output the title, story and characterDescription as a JSON object. Make the story at least 500 words.
`,
});

const generateStoryFromPreferencesFlow = ai.defineFlow(
  {
    name: 'generateStoryFromPreferencesFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
