import type { Metadata } from 'next';
import { Space_Grotesk } from "next/font/google"
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css"
import AuthHeader from '@/components/auth-header'

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: 'My App',
  description: 'Next.js with Clerk and Supabase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={spaceGrotesk.className}>
          <AuthHeader />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}