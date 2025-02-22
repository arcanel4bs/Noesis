"use client";

import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
  } from '@clerk/nextjs'
  import { motion } from "framer-motion"
  
  export default function AuthHeader() {
    return (
      <motion.header
        className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] py-4 px-6 flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-xl tracking-[0.2em] font-light"
          initial={{ letterSpacing: "0.3em", opacity: 0 }}
          animate={{ letterSpacing: "0.2em", opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          NOESIS
        </motion.h1>
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