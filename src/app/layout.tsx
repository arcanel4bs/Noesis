import { Space_Grotesk } from "next/font/google"
import "./globals.css"
import type React from "react" // Import React

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Noesis | Research Agent Assistant</title>
      </head>
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  )
}