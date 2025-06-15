
'use server';
/**
 * @fileOverview Generates an illustration for a specific story page, attempting to embed the page text.
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
  pageText: z.string().describe('The text content of the story page. This text should be artistically integrated into the illustration.'),
  sceneDescription: z.string().describe('A visual description of the scene for this page, including character actions and setting. This guides the visual elements independent of the text to be embedded.'),
  storyTheme: z.string().describe('The overall theme of the story.'),
  moralLesson: z.string().describe('The overall moral lesson of the story.'),
  additionalDetails: z.string().optional().describe('Any other relevant details for the illustration style or content.'),
});
export type GeneratePageIllustrationInput = z.infer<typeof GeneratePageIllustrationInputSchema>;

const GeneratePageIllustrationOutputSchema = z.object({
  pageImageDataUri: z
    .string()
    .describe(
      'The generated illustration for the page as a data URI, attempting to include the page text. Expected format: data:<mimetype>;base64,<encoded_data>.'
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
    let imagePromptText = `Create a vibrant and engaging children's book page illustration.
    The main character, based on the provided image, should be central to the scene.
    The illustration must artistically and legibly incorporate the following text as part of the visual design, as if it's a page from a storybook: "${input.pageText}"

    Scene Description (visual elements for the illustration): "${input.sceneDescription}"

    The overall story theme is "${input.storyTheme}" and the moral is "${input.moralLesson}".`;
    if (input.additionalDetails) {
        imagePromptText += `\nConsider these additional details for the illustration style or content: "${input.additionalDetails}".`;
    }
    imagePromptText += `\n\nEnsure the illustration style is consistent with the base character image, suitable for a children's book. The character should be clearly recognizable. The text should be an integral part of the image.`;

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
      throw new Error(`Page illustration generation failed for scene: "${input.sceneDescription.substring(0, 50)}..." or returned an invalid data URI. Attempting to embed text: "${input.pageText.substring(0,30)}..."`);
    }
    return { pageImageDataUri: media.url };
  }
);

