
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

export function StoryViewer({
  title,
  characterDescription,
  originalCharacterUri,
  pages,
  onReset,
}: StoryViewerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentImageError, setCurrentImageError] = useState(false);

  const totalPages = pages.length;
  const currentPageData = pages[currentPageIndex];

  useEffect(() => {
    setCurrentPageIndex(0); // Reset to first page when pages data changes
    setCurrentImageError(false); // Reset error state too
  }, [pages]);

  useEffect(() => {
    setCurrentImageError(false); // Reset error when page index changes
  }, [currentPageIndex]);


  const goToNextPage = () => {
    setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const goToPreviousPage = () => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  };
  
  const displayImageUri = currentImageError ? originalCharacterUri : (currentPageData?.imageUri || originalCharacterUri);
  const displayImageAlt = currentImageError ? "Error loading page image, showing base character" : (currentPageData?.sceneDescription || characterDescription || "Story illustration");

  return (
    <Card className="w-full max-w-4xl shadow-xl my-8">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-headline text-primary">{title}</CardTitle>
        {characterDescription && <CardDescription className="text-md italic mt-1">{characterDescription}</CardDescription>}
      </CardHeader>
      <CardContent className="md:grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 flex flex-col items-center mb-6 md:mb-0">
          {displayImageUri && displayImageUri.startsWith("data:image") ? (
            <Image
              key={displayImageUri} // Add key to force re-render on URI change, helps with error state
              src={displayImageUri}
              alt={displayImageAlt}
              width={300}
              height={300}
              className="rounded-lg shadow-lg object-contain aspect-square subtle-animate"
              onError={() => {
                // Only set error if it's the page-specific image that failed
                if (currentPageData?.imageUri && displayImageUri === currentPageData.imageUri) {
                  console.warn(`Error loading image for page ${currentPageIndex + 1}, falling back to original character image.`);
                  setCurrentImageError(true);
                } else if (!currentPageData?.imageUri && displayImageUri === originalCharacterUri) {
                  // This means the originalCharacterUri itself failed, which is less likely but possible
                  console.error("Error loading original character image.");
                  setCurrentImageError(true); // Or handle this more drastically
                }
              }}
              data-ai-hint={currentImageError ? "character generic" : "story scene"}
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
