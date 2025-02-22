"use client";

import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs'
import { motion } from "framer-motion"
import Link from 'next/link'

export default function AuthHeader() {
  return (
    <motion.header
      className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] py-4 px-6 flex justify-between items-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <motion.h1
          className="text-xl tracking-[0.2em] font-light"
          initial={{ letterSpacing: "0.3em", opacity: 0 }}
          animate={{ letterSpacing: "0.2em", opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          NOESIS
        </motion.h1>
        <motion.span 
          className="text-sm text-gray-500 opacity-40 font-extralight tracking-wider"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.4, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          |
        </motion.span>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.4, x: 0 }}
          whileHover={{ opacity: 1, scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Link 
            href="https://arcanel4bs.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-200 hover:text-gray-300 font-extralight tracking-wider transition-colors"
          >
            by ArcaneL4bs
          </Link>
        </motion.div>
      </div>
      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded-md hover:bg-[hsl(var(--accent))] transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] text-white transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </motion.header>
  )
}