
'use server';

/**
 * @fileOverview Animates/styles a character from an uploaded image using AI, considering overall story context.
 * This flow generates a base character image suitable for a children's book, which can then be used
 * as a reference for page-specific illustrations.
 *
 * - animateCharacter - A function that handles the character animation/styling process.
 * - AnimateCharacterInput - The input type for the animateCharacter function.
 * - AnimateCharacterOutput - The return type for the animateCharacter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnimateCharacterInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  characterName: z.string().optional().describe('The name of the character, if provided.'),
  storyTheme: z.string().describe('The theme of the story (e.g., adventure, mystery, fantasy).'),
  moralLesson: z.string().describe('The moral lesson to be included in the story (e.g., honesty, kindness, courage).'),
  additionalDetails: z.string().optional().describe('Any additional details or preferences for the character style or story context.'),
});
export type AnimateCharacterInput = z.infer<typeof AnimateCharacterInputSchema>;

const AnimateCharacterOutputSchema = z.object({
  animatedCharacterDataUri: z
    .string()
    .describe(
      'The styled character image as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type AnimateCharacterOutput = z.infer<typeof AnimateCharacterOutputSchema>;

export async function animateCharacter(input: AnimateCharacterInput): Promise<AnimateCharacterOutput> {
  return animateCharacterFlow(input);
}

const animateCharacterFlow = ai.defineFlow(
  {
    name: 'animateCharacterFlow',
    inputSchema: AnimateCharacterInputSchema,
    outputSchema: AnimateCharacterOutputSchema,
  },
  async input => {
    let imagePromptText = `Generate a vibrant children's book style illustration of the character from the provided photo. ${input.characterName ? `The character's name is ${input.characterName}. ` : ''}This character will be the main figure in a story.`;
    imagePromptText += ` The story's theme is "${input.storyTheme}" and it aims to teach a moral about "${input.moralLesson}".`;
    if (input.additionalDetails) {
      imagePromptText += ` Consider these additional details for the character's general appearance or style: "${input.additionalDetails}".`;
    }
    imagePromptText += ` The image should clearly depict the character with a neutral or versatile pose/expression, ready to be placed in various scenes. Focus on a friendly, appealing style suitable for young children.`;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        {media: {url: input.photoDataUri}},
        {text: imagePromptText}
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Base character image generation failed or did not return a media URL.');
    }
    return {animatedCharacterDataUri: media.url};
  }
);
