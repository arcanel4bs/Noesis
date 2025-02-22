import type { Metadata } from 'next';
import { Space_Grotesk } from "next/font/google"
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css"
import AuthHeader from '@/components/auth-header'
import { FloatingParticles } from '@/components/floating-particles'

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: 'Noesis | AI Research Assistant',
  description: 'Noesis is an advanced AI research assistant that helps you explore and understand complex topics through web reasoning and analysis.',
  keywords: 'AI research, web reasoning, artificial intelligence, knowledge assistant, research tool',
  authors: [{ name: 'ArcaneL4bs' }],
  openGraph: {
    title: 'Noesis | AI Research Assistant',
    description: 'Advanced AI research assistant powered by web reasoning',
    url: 'https://noesis.arcanel4bs.com',
    siteName: 'Noesis',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noesis | AI Research Assistant',
    description: 'Advanced AI research assistant powered by web reasoning',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="canonical" href="https://noesis.arcanel4bs.com" />
          <meta name="theme-color" content="#000000" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </head>
        <body className={spaceGrotesk.className}>
          <AuthHeader />
          <FloatingParticles />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}