
'use server';
import { animateCharacter, type AnimateCharacterInput } from '@/ai/flows/animate-character-from-image';
import { generateStoryFromPreferences, type GenerateStoryInput, type StoryPage } from '@/ai/flows/generate-story-from-preferences';
import { generatePageIllustration, type GeneratePageIllustrationInput } from '@/ai/flows/generate-page-illustration';
import { generateCoverImage, type GenerateCoverImageInput } from '@/ai/flows/generate-cover-image';
import type { StoryData, StoryPageData } from '@/types/story';


export type CreateStoryPayload = {
  characterImageDataUri: string; // This is the original user upload
  characterName: string;
  storyTheme: string;
  moralLesson: string;
  additionalDetails?: string;
};

export type CreateStoryResponse = {
  success: boolean;
  data?: StoryData;
  error?: string;
};

export async function createStoryAction(payload: CreateStoryPayload): Promise<CreateStoryResponse> {
  try {
    if (!payload.characterImageDataUri.startsWith('data:image')) {
      throw new Error('Invalid character image data URI format (original upload).');
    }
    
    // 1. Generate the base styled character image
    const characterAnimationInput: AnimateCharacterInput = { 
      photoDataUri: payload.characterImageDataUri,
      characterName: payload.characterName,
      storyTheme: payload.storyTheme,
      moralLesson: payload.moralLesson,
      additionalDetails: payload.additionalDetails,
    };
    const characterAnimationResult = await animateCharacter(characterAnimationInput);
    
    if (!characterAnimationResult || !characterAnimationResult.animatedCharacterDataUri) {
      throw new Error('Failed to create base character image. The AI flow did not return an image URI.');
    }
    if (!characterAnimationResult.animatedCharacterDataUri.startsWith('data:image')) {
      throw new Error('Base character image URI is not a valid image data URI.');
    }
    const baseCharacterImageUri = characterAnimationResult.animatedCharacterDataUri;

    // 2. Generate story (title, character description, pages with text & scene descriptions)
    const storyInput: GenerateStoryInput = {
      characterImage: baseCharacterImageUri, 
      characterName: payload.characterName,
      storyTheme: payload.storyTheme,
      moralLesson: payload.moralLesson,
      additionalDetails: payload.additionalDetails || '',
    };
    const storyResult = await generateStoryFromPreferences(storyInput);

    if (!storyResult || !storyResult.title || !storyResult.characterDescription || !storyResult.pages || storyResult.pages.length === 0) {
      throw new Error('Failed to generate story content. The AI flow did not return complete story data or pages.');
    }

    // 3. Generate Cover Image
    let coverImageUri = baseCharacterImageUri; // Default to base character if cover generation fails
    try {
      const coverImageInput: GenerateCoverImageInput = {
        baseCharacterDataUri: baseCharacterImageUri,
        storyTitle: storyResult.title,
        storyTheme: payload.storyTheme,
        characterName: payload.characterName,
        additionalDetails: payload.additionalDetails,
      };
      const coverImageGenResult = await generateCoverImage(coverImageInput);
      if (coverImageGenResult && coverImageGenResult.coverImageDataUri && coverImageGenResult.coverImageDataUri.startsWith('data:image')) {
        coverImageUri = coverImageGenResult.coverImageDataUri;
      } else {
        console.warn('Cover image generation failed or returned invalid data. Using base character image as cover fallback.');
      }
    } catch (coverError) {
       console.warn(`Error generating cover image: ${coverError instanceof Error ? coverError.message : String(coverError)}. Using base character image as cover fallback.`);
    }


    // 4. Generate illustration for each page
    const illustratedPages: StoryPageData[] = [];
    for (const page of storyResult.pages) {
      const pageIllustrationInput: GeneratePageIllustrationInput = {
        baseCharacterDataUri: baseCharacterImageUri,
        pageText: page.text,
        sceneDescription: page.sceneDescription,
        storyTheme: payload.storyTheme,
        moralLesson: payload.moralLesson,
        additionalDetails: payload.additionalDetails,
      };
      
      try {
        const illustrationResult = await generatePageIllustration(pageIllustrationInput);
        if (!illustrationResult || !illustrationResult.pageImageDataUri || !illustrationResult.pageImageDataUri.startsWith('data:image')) {
          console.warn(`Failed to generate image for page: "${page.sceneDescription.substring(0,30)}...". Using base character image as fallback.`);
          illustratedPages.push({
            text: page.text,
            sceneDescription: page.sceneDescription,
            imageUri: baseCharacterImageUri, 
          });
        } else {
          illustratedPages.push({
            text: page.text,
            sceneDescription: page.sceneDescription,
            imageUri: illustrationResult.pageImageDataUri,
          });
        }
      } catch (pageIllustrationError) {
        console.warn(`Error generating illustration for page "${page.sceneDescription.substring(0,30)}...": ${pageIllustrationError instanceof Error ? pageIllustrationError.message : String(pageIllustrationError)}. Using base character image as fallback.`);
        illustratedPages.push({
          text: page.text,
          sceneDescription: page.sceneDescription,
          imageUri: baseCharacterImageUri,
        });
      }
    }
    
    if (illustratedPages.length !== storyResult.pages.length) {
        // This case should ideally not be reached if fallbacks are in place for each page
        console.error('Mismatch in page count after illustration generation. This indicates a more serious issue.');
        throw new Error('Critical error: Mismatch in page count after illustration generation.');
    }

    return {
      success: true,
      data: {
        title: storyResult.title,
        characterDescription: storyResult.characterDescription,
        characterName: payload.characterName,
        originalCharacterUri: baseCharacterImageUri, 
        coverImageUri: coverImageUri,
        pages: illustratedPages,
      },
    };
  } catch (error) {
    console.error("Error in createStoryAction:", error);
    let errorMessage = 'An unknown error occurred while creating the story.';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    if (errorMessage.toLowerCase().includes("candidate_finish_reason_safety")) {
        errorMessage = "The AI model flagged the content for safety reasons. Please try modifying your prompts (theme, moral, details) or uploaded image.";
    } else if (errorMessage.includes("upstream") || errorMessage.includes("generation failed")) {
        errorMessage = "There was an issue with the AI image generation service. Please try again later or with a different image/prompt.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
