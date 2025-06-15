
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, RotateCcw, ImageOff, BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import type { StoryPageData } from '@/types/story';
import { regeneratePageIllustrationAction, type RegeneratePageIllustrationPayload } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface StoryViewerProps {
  title: string;
  characterDescription: string;
  characterName: string;
  originalCharacterUri: string;
  coverImageUri: string;
  pages: StoryPageData[];
  storyTheme: string;
  moralLesson: string;
  additionalDetails?: string;
  onReset: () => void;
}

type ImageLoadingState = 'loading_page_image' | 'loading_original_image' | 'failed';

export function StoryViewer({
  title,
  characterDescription,
  characterName,
  originalCharacterUri,
  coverImageUri,
  pages,
  storyTheme,
  moralLesson,
  additionalDetails,
  onReset,
}: StoryViewerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentStoryPages, setCurrentStoryPages] = useState<StoryPageData[]>(pages);
  const [editablePageText, setEditablePageText] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [imageState, setImageState] = useState<ImageLoadingState>('loading_page_image');
  const { toast } = useToast();

  const totalPages = currentStoryPages.length;
  const currentPageData = currentStoryPages[currentPageIndex];

  useEffect(() => {
    setCurrentStoryPages(pages);
  }, [pages]);
  
  useEffect(() => {
    if (currentPageData) {
      setEditablePageText(currentPageData.text);
      setImageState('loading_page_image');
    }
  }, [currentPageIndex, currentStoryPages, originalCharacterUri]);


  const goToNextPage = () => {
    setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const goToPreviousPage = () => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleRegenerateIllustration = async () => {
    if (!currentPageData) return;
    setIsRegenerating(true);
    try {
      const payload: RegeneratePageIllustrationPayload = {
        baseCharacterDataUri: originalCharacterUri,
        pageText: editablePageText,
        sceneDescription: currentPageData.sceneDescription,
        storyTheme: storyTheme,
        moralLesson: moralLesson,
        additionalDetails: additionalDetails,
      };
      const result = await regeneratePageIllustrationAction(payload);
      if (result.success && result.newImageUri) {
        const updatedPages = [...currentStoryPages];
        updatedPages[currentPageIndex] = {
          ...updatedPages[currentPageIndex],
          text: editablePageText, //Persist edited text
          imageUri: result.newImageUri,
        };
        setCurrentStoryPages(updatedPages);
        setImageState('loading_page_image'); // Reset image state to try loading the new image
        toast({
          title: 'Illustration Regenerated!',
          description: 'The new illustration for this page is ready.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Regenerating Illustration',
          description: result.error || 'Could not regenerate the illustration for this page.',
        });
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message || 'An unexpected error occurred during regeneration.',
      });
    } finally {
      setIsRegenerating(false);
    }
  };


  let imgSrcToTry: string | undefined;
  let imageAltText: string = "Story illustration";
  let dataAiHint: string = "story scene landscape";

  if (imageState === 'loading_page_image' && currentPageData?.imageUri) {
    imgSrcToTry = currentPageData.imageUri;
    imageAltText = currentPageData.sceneDescription || characterDescription || "Story page illustration";
  } else if (imageState === 'loading_page_image' || imageState === 'loading_original_image') {
    imgSrcToTry = originalCharacterUri;
    imageAltText = `Base character: ${characterDescription || title}`;
    dataAiHint = "character generic";
  } else {
    imgSrcToTry = undefined; // Will show placeholder
    imageAltText = "Image not available";
    dataAiHint = "placeholder image error";
  }

  const handleImageError = () => {
    if (imageState === 'loading_page_image' && currentPageData?.imageUri) {
      console.warn(`Failed to load page image for page ${currentPageIndex + 1}. Attempting to load original character image.`);
      setImageState('loading_original_image');
    } else if (imageState === 'loading_original_image' || (imageState === 'loading_page_image' && !currentPageData?.imageUri) ) {
      console.error(`Failed to load original character image. Displaying placeholder.`);
      setImageState('failed');
    }
  };

  return (
    <Card className="w-full max-w-4xl shadow-xl my-8">
      <CardHeader className="text-center">
        {coverImageUri && coverImageUri.startsWith("data:image") ? (
            <div className="mb-4 w-full aspect-[3/4] sm:aspect-video max-w-md mx-auto rounded-lg overflow-hidden shadow-lg relative subtle-animate">
              <Image
                src={coverImageUri}
                alt={`Cover for ${title}`}
                layout="fill"
                objectFit="cover"
                data-ai-hint="book cover landscape"
              />
            </div>
          ) : (
             <div className="mb-4 w-full aspect-[3/4] sm:aspect-video max-w-md mx-auto rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground p-4" data-ai-hint="placeholder book cover">
                <BookOpen className="h-16 w-16 text-destructive" />
                <p className="text-center mt-2">Cover image not available.</p>
            </div>
        )}
        <CardTitle className="text-4xl font-headline text-primary">{title}</CardTitle>
        {characterName && <CardDescription className="text-xl font-semibold mt-2 text-accent-foreground_darker">Featuring: {characterName}</CardDescription>}
        {characterDescription && <CardDescription className="text-md italic mt-1">{characterDescription}</CardDescription>}
      </CardHeader>
      <CardContent className="md:grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 flex flex-col items-center mb-6 md:mb-0">
          {(imgSrcToTry && imgSrcToTry.startsWith("data:image")) ? (
            <Image
              key={imgSrcToTry} 
              src={imgSrcToTry}
              alt={imageAltText}
              width={400} 
              height={300} 
              className="rounded-lg shadow-lg object-contain aspect-[4/3] subtle-animate w-full"
              onError={handleImageError}
              data-ai-hint={dataAiHint}
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground p-4" data-ai-hint="placeholder image error">
              <ImageOff className="h-16 w-16 text-destructive" />
            </div>
          )}
        </div>
        <div className="md:col-span-2 bg-secondary/30 p-6 rounded-lg shadow-inner min-h-[300px] flex flex-col justify-between">
          <div>
            <Textarea
              value={editablePageText}
              onChange={(e) => setEditablePageText(e.target.value)}
              className="w-full text-lg leading-relaxed font-body bg-background/70 border-primary/30 focus:border-primary min-h-[150px] mb-4"
              rows={6}
            />
            <Button onClick={handleRegenerateIllustration} disabled={isRegenerating || !currentPageData} className="w-full sm:w-auto">
              {isRegenerating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-5 w-5" />
              )}
              Regenerate Illustration
            </Button>
             <p className="text-xs text-muted-foreground mt-2">
                Note: Embedding text in images is experimental and may not always produce perfect results. Illustrations are landscape-oriented.
             </p>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <Button onClick={goToPreviousPage} disabled={currentPageIndex === 0} variant="outline" aria-label="Previous Page">
              <ChevronLeft className="h-5 w-5" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPageIndex + 1} of {totalPages}
            </span>
            <Button onClick={goToNextPage} disabled={currentPageIndex === totalPages - 1 || totalPages === 0} variant="outline" aria-label="Next Page">
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={onReset} variant="ghost" className="text-accent-foreground hover:text-accent hover:bg-accent/10">
          <RotateCcw className="mr-2 h-5 w-5" /> Create New Story
        </Button>
      </CardFooter>
    </Card>
  );
}

