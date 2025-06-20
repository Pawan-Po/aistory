
'use server';
/**
 * @fileOverview Generates an illustration for a specific story page.
 * The illustration should be purely visual, based on the scene description.
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
  pageText: z.string().describe('The text content of the story page. This text is for context and should NOT be rendered in the illustration.'),
  sceneDescription: z.string().describe('A visual description of the scene for this page, including character actions and setting. This guides the visual elements of the illustration.'),
  storyTheme: z.string().describe('The overall theme of the story.'),
  moralLesson: z.string().describe('The overall moral lesson of the story.'),
  additionalDetails: z.string().optional().describe('Any other relevant details for the illustration style or content. This may include general story notes and/or specific visual details for the current scene.'),
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
    let imagePromptText = `Create a vibrant and engaging children's book page illustration. The illustration MUST be landscape-oriented and should NOT contain any text.
    The main character, based on the provided image, should be central to the scene.
    It is CRUCIAL that the character's appearance (features, hair, clothing, colors, style) remains HIGHLY CONSISTENT with the provided base character image. The character must be clearly recognizable as the same individual from the base image in this new scene.

    The illustration must visually represent the following scene: "${input.sceneDescription}"

    The overall story theme is "${input.storyTheme}" and the moral is "${input.moralLesson}".
    The text for this page is: "${input.pageText}". This text is for context ONLY and should NOT be included or rendered in the image itself. The image should be purely visual.`;

    if (input.additionalDetails) {
        imagePromptText += `\nConsider these additional details for the illustration style, character appearance, or content: "${input.additionalDetails}". If specific visual details for the current scene (e.g. character wearing specific clothes, specific expression) are mentioned within these additional details, please prioritize them for this particular illustration.`;
    }
    imagePromptText += `\n\nEnsure the illustration style is consistent with a children's book. Output the image in landscape orientation. Do NOT include any text in the generated image.`;

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
      throw new Error(`Page illustration generation failed for scene: "${input.sceneDescription.substring(0, 50)}..." or returned an invalid data URI. Scene description: "${input.sceneDescription.substring(0,30)}..."`);
    }
    return { pageImageDataUri: media.url };
  }
);

