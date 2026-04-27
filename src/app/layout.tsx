import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';

import { RegistrationProvider } from '@/context/registration-context';
import { customFont } from './fonts'; // Uncomment after adding your font files
import { ErrorSuppressor } from '@/components/error-suppressor';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Message Panel',
  description: 'A simple panel to submit a message.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className={`${customFont.variable} font-sans antialiased`} suppressHydrationWarning>
        <ErrorSuppressor />
        <RegistrationProvider>
          <LanguageProvider>
            <ThemeProvider>
              <FirebaseClientProvider>
                {children}
              </FirebaseClientProvider>
              <Toaster />
            </ThemeProvider>
          </LanguageProvider>
        </RegistrationProvider>
      </body>
    </html>
  );
}
