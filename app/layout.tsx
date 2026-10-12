import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import './globals.css';
import Header from '@/components/build-in/header';
import QueryProvider from '@/lib/providers/query';
import { defaultMetadata } from '@/lib/metadata';
import { readConfig } from '@/lib/config';
import GlobalProvider from '@/lib/providers/global';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MotionConfig } from 'motion/react';
import { connection } from 'next/server';

export const metadata = defaultMetadata;

export default async function RootLayout({
  children,
  harness,
}: Readonly<{
  children: React.ReactNode;
  harness?: React.ReactNode;
}>) {
  await connection();
  const config = await readConfig();
  const initialTheme = config.theme;

  return (
    <html
      lang="zh-CN"
      className={initialTheme === 'system' ? undefined : initialTheme}
      style={{
        colorScheme: initialTheme === 'system' ? undefined : initialTheme,
      }}
      suppressHydrationWarning
    >
      <body className={`antialiased min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme={initialTheme}
          enableSystem
          disableTransitionOnChange
        >
          <MotionConfig reducedMotion="user">
            <TooltipProvider delayDuration={300}>
              <GlobalProvider>
                <Header />
                <QueryProvider>
                  <main id="main-content" className="min-w-0">
                    {children}
                  </main>
                  {harness}
                </QueryProvider>
              </GlobalProvider>
              <Toaster position="top-center" duration={3000} />
            </TooltipProvider>
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
