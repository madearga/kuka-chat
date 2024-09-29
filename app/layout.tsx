import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import { SignIn } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = {
  title: "kukachat",
  description: "all the models in your models",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
       <html lang="en">
        <body className={`${inter.className} flex flex-col min-h-screen`}>
          <header className="flex justify-between p-4">
            <h1>kukachat</h1>
            <UserButton afterSignOutUrl="/" />
          </header>
          <main className="flex-grow flex items-center justify-center">
            <SignedOut>
              <div className="w-full max-w-md">
              <SignIn routing="hash" />
              </div>
            </SignedOut>
            <SignedIn>
              {children}
            </SignedIn>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}