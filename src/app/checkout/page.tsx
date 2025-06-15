
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, BookHeart, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4">
      <header className="my-8 text-center">
         <div className="inline-block p-4 bg-primary/20 rounded-full mb-4">
           <Image src="https://placehold.co/80x80.png" alt="StoryTime Studio Logo" width={80} height={80} className="rounded-full" data-ai-hint="storybook logo"/>
        </div>
        <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary-foreground_darker drop-shadow-md">
          StoryTime Studio
        </h1>
      </header>

      <main className="w-full flex flex-col items-center">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="items-center text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-headline">Book Processing!</CardTitle>
            <CardDescription className="text-lg">
              Thank you for creating your story!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              Your wonderful book is now being finalized. A PDF copy will be (notionally) prepared and
              (simulated as) sent to the email address you provided shortly.
            </p>
            
            <Alert variant="default" className="text-left bg-blue-50 border-blue-200">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertTitle className="font-semibold text-blue-700">Important Note</AlertTitle>
              <AlertDescription className="text-blue-600">
                This is a prototype application. No actual PDF is generated, and no email is sent. 
                The process described is a simulation for demonstration purposes only.
              </AlertDescription>
            </Alert>

            <Link href="/" passHref>
              <Button size="lg" className="mt-6 w-full sm:w-auto">
                <BookHeart className="mr-2 h-5 w-5" />
                Create Another Magical Story
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
       <footer className="py-8 mt-auto text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} StoryTime Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}

