
'use server';
/**
 * @fileOverview Generates an illustration for a specific story page.
 *
 * - generatePageIllustration - A function that generates an image for a story page.
 * - GeneratePageIllustrationInput - The input type for the generatePageIllustration function.
 * - GeneratePageIllustrationOutput - The return type for the generatePageIllustration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePageIllustrationInputSchema = z.object({
  baseCharacterDataUri: z
    .string()
    .describe(
      "The base styled character image, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  pageText: z.string().describe('The text content of the story page, for context.'),
  sceneDescription: z.string().describe('A visual description of the scene for this page, including character actions and setting.'),
  storyTheme: z.string().describe('The overall theme of the story.'),
  moralLesson: z.string().describe('The overall moral lesson of the story.'),
  additionalDetails: z.string().optional().describe('Any other relevant details for the illustration style or content.'),
});
export type GeneratePageIllustrationInput = z.infer<typeof GeneratePageIllustrationInputSchema>;

const GeneratePageIllustrationOutputSchema = z.object({
  pageImageDataUri: z
    .string()
    .describe(
      'The generated illustration for the page as a data URI. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type GeneratePageIllustrationOutput = z.infer<typeof GeneratePageIllustrationOutputSchema>;

export async function generatePageIllustration(input: GeneratePageIllustrationInput): Promise<GeneratePageIllustrationOutput> {
  return generatePageIllustrationFlow(input);
}

const generatePageIllustrationFlow = ai.defineFlow(
  {
    name: 'generatePageIllustrationFlow',
    inputSchema: GeneratePageIllustrationInputSchema,
    outputSchema: GeneratePageIllustrationOutputSchema,
  },
  async (input) => {
    let imagePromptText = `Generate a children's book illustration for a story page. The character from the provided base image should be depicted in this scene.`;
    imagePromptText += `\n\nScene Description: "${input.sceneDescription}"`;
    imagePromptText += `\n\nThe overall story theme is "${input.storyTheme}" and the moral is "${input.moralLesson}".`;
    if (input.additionalDetails) {
        imagePromptText += `\nConsider these additional details: "${input.additionalDetails}".`;
    }
    imagePromptText += `\n\nPage text for context (do NOT include this text in the image itself): "${input.pageText}"`;
    imagePromptText += `\n\nEnsure the illustration style is vibrant, engaging, and consistent with the base character image, suitable for a children's book. The character should be clearly recognizable.`;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        { media: { url: input.baseCharacterDataUri } },
        { text: imagePromptText },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [ // Added safety settings to be less restrictive for common children's story themes
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    if (!media || !media.url) {
      throw new Error(`Page illustration generation failed for scene: "${input.sceneDescription.substring(0, 50)}..."`);
    }
    return { pageImageDataUri: media.url };
  }
);
