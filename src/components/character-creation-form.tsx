'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, type ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { UploadCloud, BookHeart, Edit3, Sparkles, Wand2 } from 'lucide-react';
import type { CreateStoryPayload } from '@/lib/actions';
import { fileToDataUri } from '@/lib/utils';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


const storyCreationSchema = z.object({
  characterImageFile: z
    .instanceof(File, { message: 'Please upload an image for the character.' })
    .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, `Max file size is ${MAX_FILE_SIZE_MB}MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png, .gif and .webp formats are accepted.'
    ),
  storyTheme: z.string().min(3, 'Story theme must be at least 3 characters.').max(50, 'Story theme must be 50 characters or less.'),
  moralLesson: z.string().min(3, 'Moral lesson must be at least 3 characters.').max(100, 'Moral lesson must be 100 characters or less.'),
  additionalDetails: z.string().max(500, 'Additional details must be 500 characters or less.').optional(),
});

export type StoryCreationFormValues = z.infer<typeof storyCreationSchema>;

interface CharacterCreationFormProps {
  onSubmit: (data: CreateStoryPayload) => Promise<void>;
  isLoading: boolean;
}

export function CharacterCreationForm({ onSubmit, isLoading }: CharacterCreationFormProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<StoryCreationFormValues>({
    resolver: zodResolver(storyCreationSchema),
    defaultValues: {
      storyTheme: '',
      moralLesson: '',
      additionalDetails: '',
    },
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('characterImageFile', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
      // @ts-ignore - setValue can accept undefined to clear, but TS expects File
      form.setValue('characterImageFile', undefined, { shouldValidate: true });
    }
  };
  
  useEffect(() => {
    // Clear preview if form is reset or characterImageFile is programmatically cleared
    const subscription = form.watch((value, { name }) => {
      if (name === 'characterImageFile' && !value.characterImageFile) {
        setPreviewImage(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  async function processSubmit(values: StoryCreationFormValues) {
    if (!values.characterImageFile) return;
    const characterImageDataUri = await fileToDataUri(values.characterImageFile);
    await onSubmit({
      characterImageDataUri,
      storyTheme: values.storyTheme,
      moralLesson: values.moralLesson,
      additionalDetails: values.additionalDetails,
    });
  }

  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center flex items-center justify-center gap-2">
          <Wand2 className="h-8 w-8 text-primary" /> Create Your Magical Story
        </CardTitle>
        <CardDescription className="text-center">
          Upload a character image and let our AI craft a unique tale for you!
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(processSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="characterImageFile"
              render={({ fieldState }) => (
                <FormItem>
                  <FormLabel className="text-lg flex items-center gap-2"><UploadCloud className="text-accent" /> Upload Character Image</FormLabel>
                  <FormControl>
                    <Input type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleImageChange} className="file:text-primary file:font-semibold"/>
                  </FormControl>
                  {previewImage && (
                    <div className="mt-4 relative w-48 h-48 mx-auto rounded-lg overflow-hidden shadow-md">
                       <Image src={previewImage} alt="Character preview" layout="fill" objectFit="cover" />
                    </div>
                  )}
                  {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                  <FormDescription>Your character will come to life from this image.</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storyTheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg flex items-center gap-2"><BookHeart className="text-accent" /> Story Theme</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., A daring space adventure" {...field} />
                  </FormControl>
                  <FormDescription>What kind of story do you envision?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moralLesson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg flex items-center gap-2"><Edit3 className="text-accent" /> Moral of the Story</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The importance of sharing" {...field} />
                  </FormControl>
                  <FormDescription>What lesson should the story teach?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg flex items-center gap-2"><Sparkles className="text-accent" /> Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Include a friendly robot sidekick and a mysterious glowing cave."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Any other wishes for your story? (Max 500 characters)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
              {isLoading ? 'Crafting Your Story...' : 'Generate Story'}
              {!isLoading && <Wand2 className="ml-2 h-5 w-5" />}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
