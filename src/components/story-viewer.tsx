'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface StoryViewerProps {
  title: string;
  storyContent: string;
  animatedCharacterUri: string;
  characterDescription: string;
  onReset: () => void;
}

const WORDS_PER_PAGE = 100; // Adjust as needed for comfortable reading

export function StoryViewer({
  title,
  storyContent,
  animatedCharacterUri,
  characterDescription,
  onReset,
}: StoryViewerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [characterImageError, setCharacterImageError] = useState(false);

  const storyPages = useMemo(() => {
    if (!storyContent) return [''];
    // Split by paragraph first, then group paragraphs or split long paragraphs.
    const paragraphs = storyContent.split(/\n\s*\n/).filter(p => p.trim() !== '');
    const pages: string[] = [];
    let currentPageText = '';

    for (const paragraph of paragraphs) {
      const wordsInParagraph = paragraph.split(/\s+/).length;
      const wordsInCurrentPage = currentPageText.split(/\s+/).filter(w => w).length;

      if (currentPageText && (wordsInCurrentPage + wordsInParagraph > WORDS_PER_PAGE * 1.2)) { // Allow some overflow before forcing new page
        pages.push(currentPageText.trim());
        currentPageText = paragraph;
      } else {
        currentPageText += (currentPageText ? '\n\n' : '') + paragraph;
      }

      // If a single paragraph itself is very long
      while (currentPageText.split(/\s+/).length > WORDS_PER_PAGE * 1.5) {
        const words = currentPageText.split(/\s+/);
        const pageBreakPoint = Math.floor(words.length * (WORDS_PER_PAGE / (words.length +1))); // Heuristic break point
        pages.push(words.slice(0, pageBreakPoint).join(' '));
        currentPageText = words.slice(pageBreakPoint).join(' ');
      }
    }
    if (currentPageText.trim()) {
      pages.push(currentPageText.trim());
    }
    return pages.length > 0 ? pages : ['The story is waiting to be told...'];
  }, [storyContent]);

  const totalPages = storyPages.length;

  const goToNextPage = () => {
    setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const goToPreviousPage = () => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  };
  
  useEffect(() => {
    setCurrentPageIndex(0); // Reset to first page when story content changes
  }, [storyContent]);

  return (
    <Card className="w-full max-w-4xl shadow-xl my-8">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-headline text-primary">{title}</CardTitle>
        {characterDescription && <CardDescription className="text-md italic mt-1">{characterDescription}</CardDescription>}
      </CardHeader>
      <CardContent className="md:grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 flex flex-col items-center mb-6 md:mb-0">
          {characterImageError ? (
             <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center text-destructive-foreground p-4">
               <p className="text-center">Could not load character image.</p>
             </div>
          ) : animatedCharacterUri && animatedCharacterUri.startsWith("data:image") ? (
            <Image
              src={animatedCharacterUri}
              alt={characterDescription || "Animated character"}
              width={300}
              height={300}
              className="rounded-lg shadow-lg object-contain aspect-square subtle-animate"
              onError={() => setCharacterImageError(true)}
              data-ai-hint="character illustration"
            />
          ) : (
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground p-4" data-ai-hint="placeholder character">
              <p className="text-center">Character image not available.</p>
            </div>
          )}
        </div>
        <div className="md:col-span-2 bg-secondary/30 p-6 rounded-lg shadow-inner min-h-[300px] flex flex-col justify-between">
          <p className="text-lg leading-relaxed whitespace-pre-line font-body">
            {storyPages[currentPageIndex]}
          </p>
          <div className="mt-6 flex justify-between items-center">
            <Button onClick={goToPreviousPage} disabled={currentPageIndex === 0} variant="outline" aria-label="Previous Page">
              <ChevronLeft className="h-5 w-5" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPageIndex + 1} of {totalPages}
            </span>
            <Button onClick={goToNextPage} disabled={currentPageIndex === totalPages - 1} variant="outline" aria-label="Next Page">
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
