
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import * as React from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useUser } from '@/firebase/client';
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";
import { Input } from "./ui/input";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  subject: z.string().min(1, { message: "Subject cannot be empty." }),
  message: z.string().min(1, {
    message: "Message cannot be empty.",
  }).max(500, {
    message: "Message must not be longer than 500 characters.",
  }),
});

export function ContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();



  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Cannot submit message. User or database is not available.",
      });
      return;
    }

    setIsSubmitting(true);

    const messageId = uuidv4();
    const messageRef = doc(firestore, `contact_messages_rows/${messageId}`);
    const messageData = {
      id: messageId,
      name: values.name,
      email: values.email,
      subject: values.subject,
      message: values.message,
      created_at: serverTimestamp(),
      read: false,
    };

    setDoc(messageRef, messageData)
      .then(() => {
        toast({
          title: "Success!",
          description: "Your message has been sent successfully!",
        });
        form.reset();
      })
      .catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
          path: messageRef.path,
          operation: 'create',
          requestResourceData: messageData,
        });

        errorEmitter.emit('permission-error', permissionError);
      }).finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Send a Message</CardTitle>
        <CardDescription>
          Fill out the form below and we'll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isSubmitting || isUserLoading || !user} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} disabled={isSubmitting || isUserLoading || !user} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Regarding..." {...field} disabled={isSubmitting || isUserLoading || !user} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your message here..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      disabled={isSubmitting || isUserLoading || !user}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isUserLoading || !user}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Message
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
