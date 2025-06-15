
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, RotateCcw, ImageOff } from 'lucide-react';
import type { StoryPageData } from '@/types/story';

interface StoryViewerProps {
  title: string;
  characterDescription: string;
  originalCharacterUri: string; // Base character image
  pages: StoryPageData[];
  onReset: () => void;
}

type ImageLoadingState = 'loading_page_image' | 'loading_original_image' | 'failed';

export function StoryViewer({
  title,
  characterDescription,
  originalCharacterUri,
  pages,
  onReset,
}: StoryViewerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [imageState, setImageState] = useState<ImageLoadingState>('loading_page_image');

  const totalPages = pages.length;
  const currentPageData = pages[currentPageIndex];

  useEffect(() => {
    setImageState('loading_page_image'); // Reset image loading state when page index or story data changes
  }, [currentPageIndex, pages, originalCharacterUri]);

  const goToNextPage = () => {
    setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const goToPreviousPage = () => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  };

  let imgSrcToTry: string | undefined;
  let imageAltText: string = "Story illustration";
  let dataAiHint: string = "story scene";

  if (imageState === 'loading_page_image' && currentPageData?.imageUri) {
    imgSrcToTry = currentPageData.imageUri;
    imageAltText = currentPageData.sceneDescription || characterDescription || "Story page illustration";
    dataAiHint = "story scene";
  } else if (imageState === 'loading_page_image' || imageState === 'loading_original_image') {
    // This condition covers:
    // 1. Initial load for a page without its own imageUri (imageState is 'loading_page_image').
    // 2. Fallback after page-specific image failed (imageState is 'loading_original_image').
    imgSrcToTry = originalCharacterUri;
    imageAltText = `Base character: ${characterDescription || title}`;
    dataAiHint = "character generic";
  } else { // imageState === 'failed'
    imgSrcToTry = undefined; // Force placeholder
    imageAltText = "Image not available";
    dataAiHint = "placeholder image error";
  }

  const handleImageError = () => {
    if (imageState === 'loading_page_image' && currentPageData?.imageUri) {
      console.warn(`Failed to load page image for page ${currentPageIndex + 1}. Attempting to load original character image.`);
      setImageState('loading_original_image');
    } else if (imageState === 'loading_original_image' || (imageState === 'loading_page_image' && !currentPageData?.imageUri) ) {
      console.error(`Failed to load original character image (URI: ${originalCharacterUri ? originalCharacterUri.substring(0, 70) + "..." : "undefined"}). Displaying placeholder.`);
      setImageState('failed');
    }
  };
  
  return (
    <Card className="w-full max-w-4xl shadow-xl my-8">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-headline text-primary">{title}</CardTitle>
        {characterDescription && <CardDescription className="text-md italic mt-1">{characterDescription}</CardDescription>}
      </CardHeader>
      <CardContent className="md:grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 flex flex-col items-center mb-6 md:mb-0">
          {imgSrcToTry && imgSrcToTry.startsWith("data:image") ? (
            <Image
              key={imgSrcToTry} 
              src={imgSrcToTry}
              alt={imageAltText}
              width={300}
              height={300}
              className="rounded-lg shadow-lg object-contain aspect-square subtle-animate"
              onError={handleImageError}
              data-ai-hint={dataAiHint}
            />
          ) : (
            <div className="w-full aspect-square bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground p-4" data-ai-hint="placeholder image">
              <ImageOff className="h-16 w-16 text-destructive" />
              <p className="text-center mt-2">Image not available for this page.</p>
            </div>
          )}
        </div>
        <div className="md:col-span-2 bg-secondary/30 p-6 rounded-lg shadow-inner min-h-[300px] flex flex-col justify-between">
          <div className="text-lg leading-relaxed whitespace-pre-line font-body flex-grow overflow-y-auto max-h-[400px]">
            {currentPageData?.text || "This page is waiting for its story..."}
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
