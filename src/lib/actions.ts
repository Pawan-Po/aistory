
'use server';
import { animateCharacter, type AnimateCharacterInput } from '@/ai/flows/animate-character-from-image';
import { generateStoryFromPreferences, type GenerateStoryInput, type StoryPage } from '@/ai/flows/generate-story-from-preferences';
import { generatePageIllustration, type GeneratePageIllustrationInput } from '@/ai/flows/generate-page-illustration';
import { generateCoverImage, type GenerateCoverImageInput } from '@/ai/flows/generate-cover-image';
import type { StoryData, StoryPageData } from '@/types/story';


export type CreateStoryPayload = {
  characterImageDataUri: string; 
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

    let coverImageUri = baseCharacterImageUri; 
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
        storyTheme: payload.storyTheme,
        moralLesson: payload.moralLesson,
        additionalDetails: payload.additionalDetails,
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

export type RegeneratePageIllustrationPayload = GeneratePageIllustrationInput;
export type RegeneratePageIllustrationResponse = {
  success: boolean;
  newImageUri?: string;
  error?: string;
};

export async function regeneratePageIllustrationAction(payload: RegeneratePageIllustrationPayload): Promise<RegeneratePageIllustrationResponse> {
  try {
    if (!payload.baseCharacterDataUri.startsWith('data:image')) {
      throw new Error('Invalid base character image data URI for regeneration.');
    }

    const illustrationResult = await generatePageIllustration(payload);

    if (!illustrationResult || !illustrationResult.pageImageDataUri || !illustrationResult.pageImageDataUri.startsWith('data:image')) {
      throw new Error('Failed to regenerate page illustration or returned invalid data URI.');
    }

    return {
      success: true,
      newImageUri: illustrationResult.pageImageDataUri,
    };
  } catch (error) {
    console.error("Error in regeneratePageIllustrationAction:", error);
    let errorMessage = 'An unknown error occurred while regenerating the illustration.';
     if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    if (errorMessage.toLowerCase().includes("candidate_finish_reason_safety")) {
        errorMessage = "The AI model flagged the content for safety reasons. Please try modifying your text or prompts.";
    } else if (errorMessage.includes("upstream") || errorMessage.includes("generation failed")) {
        errorMessage = "There was an issue with the AI image generation service. Please try again later or with different text.";
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export type ProcessBookCheckoutPayload = Pick<StoryData, 'title' | 'characterName' | 'coverImageUri' | 'pages' | 'originalCharacterUri' | 'characterDescription' | 'storyTheme' | 'moralLesson' | 'additionalDetails'> & {
  email: string; // User-provided email
};

export type ProcessBookCheckoutResponse = {
  success: boolean;
  error?: string;
};

export async function processBookCheckoutAction(payload: ProcessBookCheckoutPayload): Promise<ProcessBookCheckoutResponse> {
  const fixedRecipientEmail = 'krpawan16.po@gmail.com';
  console.log(`SIMULATION: processBookCheckoutAction called for book: "${payload.title}" by ${payload.characterName}. User-provided email for record: ${payload.email}. Fixed recipient for simulated PDF: ${fixedRecipientEmail}`);
  try {
    // Simulate PDF Generation
    console.log(`SIMULATION: Starting PDF generation for "${payload.title}" (Character: ${payload.characterName}).`);
    console.log(`SIMULATION: Cover image URI: ${payload.coverImageUri.substring(0, 50)}...`);
    payload.pages.forEach((page, index) => {
      console.log(`SIMULATION: Processing Page ${index + 1} for PDF: Text - "${page.text.substring(0, 30)}...", Image - ${page.imageUri.substring(0, 50)}...`);
    });
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    console.log(`SIMULATION: PDF for "${payload.title}" (Character: ${payload.characterName}) notionally generated.`);

    // Simulate Email Sending
    console.log(`SIMULATION: Preparing to send email with PDF of "${payload.title}" (Character: ${payload.characterName}) to ${fixedRecipientEmail}.`);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`SIMULATION: Email for book "${payload.title}" featuring ${payload.characterName} notionally sent to ${fixedRecipientEmail}.`);

    return { success: true };
  } catch (error) {
    console.error("Error in processBookCheckoutAction (simulation):", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during checkout simulation.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

