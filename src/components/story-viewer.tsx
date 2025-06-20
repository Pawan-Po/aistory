
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, RotateCcw, ImageOff, BookOpen, RefreshCw, Loader2, Palette, Send, Mail } from 'lucide-react';
import type { StoryPageData } from '@/types/story';
import { regeneratePageIllustrationAction, type RegeneratePageIllustrationPayload, processBookCheckoutAction, type ProcessBookCheckoutPayload } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  const [pageSpecificDetails, setPageSpecificDetails] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [imageState, setImageState] = useState<ImageLoadingState>('loading_page_image');
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  const totalPages = currentStoryPages.length;
  const currentPageData = currentStoryPages[currentPageIndex];

  useEffect(() => {
    setCurrentStoryPages(pages);
  }, [pages]);
  
  useEffect(() => {
    if (currentPageData) {
      setEditablePageText(currentPageData.text);
      setImageState('loading_page_image');
      setPageSpecificDetails(''); 
    }
  }, [currentPageIndex, currentStoryPages]);


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
      let combinedAdditionalDetails = additionalDetails || '';
      if (pageSpecificDetails.trim()) {
        combinedAdditionalDetails += `\nFor this specific scene, also consider these visual details: ${pageSpecificDetails.trim()}`;
      }

      const payload: RegeneratePageIllustrationPayload = {
        baseCharacterDataUri: originalCharacterUri,
        pageText: editablePageText, 
        sceneDescription: currentPageData.sceneDescription,
        storyTheme: storyTheme,
        moralLesson: moralLesson,
        additionalDetails: combinedAdditionalDetails.trim() || undefined,
      };
      const result = await regeneratePageIllustrationAction(payload);
      if (result.success && result.newImageUri) {
        const updatedPages = [...currentStoryPages];
        updatedPages[currentPageIndex] = {
          ...updatedPages[currentPageIndex],
          text: editablePageText, 
          imageUri: result.newImageUri,
        };
        setCurrentStoryPages(updatedPages);
        setImageState('loading_page_image'); 
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

  const handleConfirmCheckout = async () => {
    if (!checkoutEmail.trim() || !/^\S+@\S+\.\S+$/.test(checkoutEmail.trim())) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
      });
      return;
    }
    setIsFinalizing(true);
    try {
      const storyDataForCheckout: ProcessBookCheckoutPayload = {
        title,
        characterName,
        coverImageUri,
        pages: currentStoryPages.map(p => ({...p, text: currentPageIndex === currentStoryPages.indexOf(p) ? editablePageText : p.text })),
        originalCharacterUri,
        characterDescription,
        storyTheme,
        moralLesson,
        additionalDetails,
        email: checkoutEmail.trim(),
      };

      const result = await processBookCheckoutAction(storyDataForCheckout);
      if (result.success) {
        toast({
          title: 'Book Finalized!',
          description: 'Your book is being processed for simulated PDF generation and emailing.',
        });
        setIsCheckoutDialogOpen(false);
        router.push('/checkout');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Finalizing Book',
          description: result.error || 'Could not finalize the book.',
        });
      }
    } catch (e: any) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message || 'An unexpected error occurred during finalization.',
      });
    } finally {
      setIsFinalizing(false);
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
    imgSrcToTry = undefined; 
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
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Left Column: Image Display */}
          <div className="w-full md:w-1/2">
            {(imgSrcToTry && imgSrcToTry.startsWith("data:image")) ? (
              <div className="relative w-full aspect-[4/3] rounded-lg shadow-lg overflow-hidden subtle-animate">
                <Image
                  key={imgSrcToTry} 
                  src={imgSrcToTry}
                  alt={imageAltText}
                  layout="fill"
                  objectFit="contain" 
                  className="rounded-lg"
                  onError={handleImageError}
                  data-ai-hint={dataAiHint}
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground p-4" data-ai-hint="placeholder image error">
                <ImageOff className="h-16 w-16 text-destructive" />
                <p className="text-center mt-2">Illustration not available.</p>
              </div>
            )}
          </div>
          
          {/* Right Column: Text and Controls Block */}
          <div className="w-full md:w-1/2 bg-secondary/30 p-4 md:p-6 rounded-lg shadow-inner flex flex-col gap-4">
            <div>
              <Label htmlFor="pageText" className="text-lg font-semibold mb-1 block">Page Text</Label>
              <Textarea
                id="pageText"
                value={editablePageText}
                onChange={(e) => setEditablePageText(e.target.value)}
                className="w-full text-lg leading-relaxed font-body bg-background/70 border-primary/30 focus:border-primary min-h-[150px] mb-4"
                rows={6}
              />
            </div>
            <div>
              <Button onClick={handleRegenerateIllustration} disabled={isRegenerating || !currentPageData} className="w-full sm:w-auto mb-2">
                {isRegenerating ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-5 w-5" />
                )}
                Regenerate Illustration
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageSpecificDetails" className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-accent" />
                Refine This Scene's Illustration
              </Label>
              <Textarea
                id="pageSpecificDetails"
                value={pageSpecificDetails}
                onChange={(e) => setPageSpecificDetails(e.target.value)}
                placeholder="E.g., Character is wearing a red scarf, a friendly squirrel is in the background, the character looks happy..."
                className="w-full text-sm font-body bg-background/70 border-primary/30 focus:border-primary"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Add specific details for this page's illustration. These will be combined with general story details.
              </p>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="w-full flex justify-between items-center mt-6 pt-6 border-t">
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
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
        <Button onClick={onReset} variant="ghost" className="text-accent-foreground hover:text-accent hover:bg-accent/10">
          <RotateCcw className="mr-2 h-5 w-5" /> Create New Story
        </Button>
        
        <AlertDialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
              <Send className="mr-2 h-5 w-5" />
              Finalize Book & Checkout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-primary" />
                Receive Your Masterpiece!
              </AlertDialogTitle>
              <AlertDialogDescription>
                Enter your email address below. A (simulated) PDF copy of your book
                will be prepared and notionally sent to you.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="checkout-email" className="text-left mb-2 block font-semibold">Email Address</Label>
              <Input
                id="checkout-email"
                type="email"
                placeholder="you@example.com"
                value={checkoutEmail}
                onChange={(e) => setCheckoutEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isFinalizing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCheckout} disabled={isFinalizing}>
                {isFinalizing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-5 w-5" />
                )}
                Confirm & Send
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </CardFooter>
    </Card>
  );
}

