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
    
    const animationInput: AnimateCharacterInput = { photoDataUri: payload.characterImageDataUri };
    const animationResult = await animateCharacter(animationInput);
    
    if (!animationResult || !animationResult.animatedCharacterDataUri) {
      throw new Error('Failed to animate character. The AI flow did not return an animated character URI.');
    }
     if (!animationResult.animatedCharacterDataUri.startsWith('data:image')) {
      throw new Error('Animated character URI is not a valid image data URI.');
    }


    const storyInput: GenerateStoryInput = {
      characterImage: payload.characterImageDataUri,
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
    // It's good practice to log the actual error on the server
    // but return a more generic message to the client for security/simplicity.
    let errorMessage = 'An unknown error occurred while creating the story.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (typeof error === 'string') {
        errorMessage = error;
    }
    
    // Specific check for known Genkit/AI flow issues (example)
    if (errorMessage.includes("upstream")) {
        errorMessage = "There was an issue with the AI service. Please try again later.";
    }


    return {
      success: false,
      error: errorMessage,
    };
  }
}
