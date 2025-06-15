
'use server';
/**
 * @fileOverview Generates a cover image for a children's story.
 *
 * - generateCoverImage - A function that generates a cover image.
 * - GenerateCoverImageInput - The input type for the generateCoverImage function.
 * - GenerateCoverImageOutput - The return type for the generateCoverImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCoverImageInputSchema = z.object({
  baseCharacterDataUri: z
    .string()
    .describe(
      "The base styled character image, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  storyTitle: z.string().describe('The title of the story.'),
  storyTheme: z.string().describe('The overall theme of the story.'),
  characterName: z.string().describe('The name of the main character.'),
  additionalDetails: z.string().optional().describe('Any other relevant details for the cover style or content.'),
});
export type GenerateCoverImageInput = z.infer<typeof GenerateCoverImageInputSchema>;

const GenerateCoverImageOutputSchema = z.object({
  coverImageDataUri: z
    .string()
    .describe(
      'The generated cover image for the story as a data URI. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type GenerateCoverImageOutput = z.infer<typeof GenerateCoverImageOutputSchema>;

export async function generateCoverImage(input: GenerateCoverImageInput): Promise<GenerateCoverImageOutput> {
  return generateCoverImageFlow(input);
}

const generateCoverImageFlow = ai.defineFlow(
  {
    name: 'generateCoverImageFlow',
    inputSchema: GenerateCoverImageInputSchema,
    outputSchema: GenerateCoverImageOutputSchema,
  },
  async (input) => {
    let imagePromptText = `Generate a captivating children's book cover.
    The main character, ${input.characterName}, is provided in the base image.
    The story title is "${input.storyTitle}".
    The story theme is "${input.storyTheme}".`;
    if (input.additionalDetails) {
        imagePromptText += `\nConsider these additional details for the cover: "${input.additionalDetails}".`;
    }
    imagePromptText += `\n\nThe cover should be vibrant, engaging, and clearly display the character. The title text itself should NOT be part of the image, but the overall design should leave space for a title to be overlaid. Focus on a visually appealing composition suitable for a book cover targeting young children. Ensure the style matches a children's book illustration.`;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        { media: { url: input.baseCharacterDataUri } },
        { text: imagePromptText },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [ 
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    if (!media || !media.url || !media.url.startsWith('data:image')) {
      throw new Error(`Cover image generation failed for title: "${input.storyTitle}" or returned an invalid data URI.`);
    }
    return { coverImageDataUri: media.url };
  }
);
