// Implemented the animateCharacterFromImage flow to generate an animated character from an uploaded image.

'use server';

/**
 * @fileOverview Animates a character from an image using AI.
 *
 * - animateCharacter - A function that handles the character animation process.
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
});
export type AnimateCharacterInput = z.infer<typeof AnimateCharacterInputSchema>;

const AnimateCharacterOutputSchema = z.object({
  animatedCharacterDataUri: z
    .string()
    .describe(
      'The animated character as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type AnimateCharacterOutput = z.infer<typeof AnimateCharacterOutputSchema>;

export async function animateCharacter(input: AnimateCharacterInput): Promise<AnimateCharacterOutput> {
  return animateCharacterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'animateCharacterPrompt',
  input: {schema: AnimateCharacterInputSchema},
  output: {schema: AnimateCharacterOutputSchema},
  prompt: `You are an expert animator specializing in creating animated characters from images.

You will use the image to generate an animated version of the character.

Photo: {{media url=photoDataUri}}

Ensure that the output is a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.
`,
});

const animateCharacterFlow = ai.defineFlow(
  {
    name: 'animateCharacterFlow',
    inputSchema: AnimateCharacterInputSchema,
    outputSchema: AnimateCharacterOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-exp',

      prompt: [
        {media: {url: input.photoDataUri}},
        {text: 'generate an image of this character in a childrens book illustration style'}],

      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    return {animatedCharacterDataUri: media.url!};
  }
);
