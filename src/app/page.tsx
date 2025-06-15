'use client';

import { useState, useEffect } from 'react';
import { CharacterCreationForm, type StoryCreationFormValues } from '@/components/character-creation-form';
import { StoryViewer } from '@/components/story-viewer';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createStoryAction, type CreateStoryPayload } from '@/lib/actions';
import type { StoryData } from '@/types/story';
import { fileToDataUri } from '@/lib/utils';
import Image from 'next/image';

export default function HomePage() {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showApp, setShowApp] = useState(false);

  // Avoid hydration mismatches
  useEffect(() => {
    setShowApp(true);
  }, []);


  const handleStoryCreate = async (payload: CreateStoryPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createStoryAction(payload);
      if (result.success && result.data) {
        setStoryData(result.data);
        toast({
          title: 'Story Created!',
          description: 'Your magical story is ready to be explored.',
        });
      } else {
        const errorMessage = result.error || 'Failed to create story. Please try again.';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error Creating Story',
          description: errorMessage,
        });
      }
    } catch (e: any) {
      const errorMessage = e.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStoryData(null);
    setError(null);
  };

  if (!showApp) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 overflow-x-hidden">
      <header className="my-8 text-center">
        <div className="inline-block p-4 bg-primary/20 rounded-full mb-4">
           <Image src="https://placehold.co/80x80.png" alt="StoryTime Studio Logo" width={80} height={80} className="rounded-full" data-ai-hint="storybook logo"/>
        </div>
        <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary-foreground_darker drop-shadow-md">
          StoryTime Studio
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Craft personalized AI-powered children&apos;s books in minutes!
        </p>
      </header>

      <main className="w-full flex flex-col items-center">
        {isLoading && (
          <div className="fixed inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg text-primary animate-pulse">Weaving your magical tale...</p>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="max-w-2xl w-full mb-8">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Oh no! Something went wrong.</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!storyData && !isLoading && (
          <CharacterCreationForm onSubmit={handleStoryCreate} isLoading={isLoading} />
        )}

        {storyData && !isLoading && (
          <StoryViewer
            title={storyData.title}
            storyContent={storyData.story}
            animatedCharacterUri={storyData.animatedCharacterUri}
            characterDescription={storyData.characterDescription}
            onReset={handleReset}
          />
        )}
      </main>
      
      <footer className="py-8 mt-auto text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} StoryTime Studio. All rights reserved.</p>
        <p className="text-sm">Powered by Generative AI with love.</p>
      </footer>
    </div>
  );
}
