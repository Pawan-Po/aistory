
'use server';
import { animateCharacter, type AnimateCharacterInput } from '@/ai/flows/animate-character-from-image';
import { generateStoryFromPreferences, type GenerateStoryInput } from '@/ai/flows/generate-story-from-preferences';

export type CreateStoryPayload = {
  characterImageDataUri: string;
  storyTheme: string;
  moralLesson: string;
  additionalDetails?: string;
};

export type CreateStoryResponse = {
  success: boolean;
  data?: {
    title: string;
    story: string;
    characterDescription: string;
    animatedCharacterUri: string;
  };
  error?: string;
};

export async function createStoryAction(payload: CreateStoryPayload): Promise<CreateStoryResponse> {
  try {
    if (!payload.characterImageDataUri.startsWith('data:image')) {
      throw new Error('Invalid character image data URI format.');
    }
    
    const animationInput: AnimateCharacterInput = { 
      photoDataUri: payload.characterImageDataUri,
      storyTheme: payload.storyTheme,
      moralLesson: payload.moralLesson,
      additionalDetails: payload.additionalDetails,
    };
    const animationResult = await animateCharacter(animationInput);
    
    if (!animationResult || !animationResult.animatedCharacterDataUri) {
      throw new Error('Failed to animate character. The AI flow did not return an animated character URI.');
    }
     if (!animationResult.animatedCharacterDataUri.startsWith('data:image')) {
      throw new Error('Animated character URI is not a valid image data URI.');
    }


    const storyInput: GenerateStoryInput = {
      characterImage: payload.characterImageDataUri, // Story generation might still use the original for description
      storyTheme: payload.storyTheme,
      moralLesson: payload.moralLesson,
      additionalDetails: payload.additionalDetails || '',
    };
    const storyResult = await generateStoryFromPreferences(storyInput);

    if (!storyResult || !storyResult.title || !storyResult.story || !storyResult.characterDescription) {
      throw new Error('Failed to generate story. The AI flow did not return complete story data.');
    }

    return {
      success: true,
      data: {
        title: storyResult.title,
        story: storyResult.story,
        characterDescription: storyResult.characterDescription,
        animatedCharacterUri: animationResult.animatedCharacterDataUri,
      },
    };
  } catch (error) {
    console.error("Error in createStoryAction:", error);
    let errorMessage = 'An unknown error occurred while creating the story.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (typeof error === 'string') {
        errorMessage = error;
    }
    
    if (errorMessage.includes("upstream") || errorMessage.includes("Image generation failed")) {
        errorMessage = "There was an issue with the AI image generation service. Please try again later or with a different image/prompt.";
    }


    return {
      success: false,
      error: errorMessage,
    };
  }
}
