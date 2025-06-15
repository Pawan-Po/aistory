
'use server';
/**
 * @fileOverview Generates a story based on user preferences including character details, themes, and moral lessons.
 * The story is structured into pages, each with text and a scene description for illustration.
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
      "A photo of the main character (already styled for the book), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  characterName: z.string().describe("The name of the main character."),
  storyTheme: z.string().describe('The theme of the story (e.g., adventure, mystery, fantasy).'),
  moralLesson: z.string().describe('The moral lesson to be included in the story (e.g., honesty, kindness, courage).'),
  additionalDetails: z.string().describe('Any additional details or preferences for the story.'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const StoryPageSchema = z.object({
  text: z.string().describe('The text content for this page of the story.'),
  sceneDescription: z.string().describe('A brief visual description of the scene on this page, to be used for image generation. Focus on character action, expression, and key background elements.'),
});
export type StoryPage = z.infer<typeof StoryPageSchema>;

const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('The title of the generated story.'),
  characterDescription: z.string().describe('A description of the main character, based on the provided image and name.'),
  pages: z.array(StoryPageSchema).describe('An array of story pages, each with text and a scene description. Aim for 3-5 pages.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStoryFromPreferences(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFromPreferencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryFromPreferencesPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `You are a children's book author. Generate a unique and engaging story with about 3-5 pages based on the following preferences:

Theme: {{{storyTheme}}}
Moral Lesson: {{{moralLesson}}}
Additional Details: {{{additionalDetails}}}
Character Name: {{{characterName}}}

The main character, named {{{characterName}}}, is depicted in this image: {{media url=characterImage}}
Based on this character image and name, create a short, descriptive 'characterDescription'.

Then, write the story. For each page, provide:
1.  'text': The story text for that page (around 50-100 words).
2.  'sceneDescription': A concise visual description (1-2 sentences) of the scene for this page. This description should guide an illustrator and focus on the character's actions, expressions, and key background elements relevant to the text.

Output the title, characterDescription, and an array of pages (each page being an object with 'text' and 'sceneDescription') as a JSON object.
The story should have a clear beginning, middle, and end, suitable for young children. Ensure there are at least 3 pages.
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
    if (!output || !output.pages || output.pages.length === 0) {
      throw new Error('Story generation failed to produce pages.');
    }
    return output;
  }
);
