// Implemented the animateCharacterFromImage flow to generate an animated character from an uploaded image.

'use server';

/**
 * @fileOverview Animates a character from an image using AI, considering story context.
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
  storyTheme: z.string().describe('The theme of the story (e.g., adventure, mystery, fantasy).'),
  moralLesson: z.string().describe('The moral lesson to be included in the story (e.g., honesty, kindness, courage).'),
  additionalDetails: z.string().optional().describe('Any additional details or preferences for the story context or setting.'),
});
export type AnimateCharacterInput = z.infer<typeof AnimateCharacterInputSchema>;

const AnimateCharacterOutputSchema = z.object({
  animatedCharacterDataUri: z
    .string()
    .describe(
      'The animated character image as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type AnimateCharacterOutput = z.infer<typeof AnimateCharacterOutputSchema>;

export async function animateCharacter(input: AnimateCharacterInput): Promise<AnimateCharacterOutput> {
  return animateCharacterFlow(input);
}

const promptDefinition = ai.definePrompt({
  name: 'animateCharacterPrompt',
  input: {schema: AnimateCharacterInputSchema},
  output: {schema: AnimateCharacterOutputSchema},
  prompt: `You are an expert animator specializing in creating character images from photos, tailored to a story's context.

You will use the provided photo and story details to generate an image of the character that fits the narrative.

Photo: {{media url=photoDataUri}}
Story Theme: {{{storyTheme}}}
Moral Lesson: {{{moralLesson}}}
{{#if additionalDetails}}
Additional Context/Setting: {{{additionalDetails}}}
{{/if}}

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
    let imagePromptText = `Generate an image of this character in a vibrant children's book illustration style. The character should be depicted in a scene that reflects the story.`;
    if (input.storyTheme) {
      imagePromptText += ` The story's theme is "${input.storyTheme}".`;
    }
    if (input.moralLesson) {
      imagePromptText += ` It aims to teach a moral about "${input.moralLesson}".`;
    }
    if (input.additionalDetails) {
      imagePromptText += ` Consider these details for the setting, plot, or character's action: "${input.additionalDetails}".`;
    } else {
      imagePromptText += ` The character can be in a general setting suitable for a children's story.`;
    }
    imagePromptText += ` The image should clearly show the character and be suitable for a children's book cover or illustration.`;


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
      throw new Error('Image generation failed or did not return a media URL.');
    }
    return {animatedCharacterDataUri: media.url};
  }
);
