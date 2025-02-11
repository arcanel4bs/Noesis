"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink } from "lucide-react"
import { AgentAnimation } from "@/components/agent-animation"
import { FloatingParticles } from "@/components/floating-particles"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type React from "react"

const App = () => {
  const [query, setQuery] = useState("")
  const [report, setReport] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([])
  const [activeAgent, setActiveAgent] = useState<number>(0)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setActiveAgent((prev) => (prev + 1) % 3)
      }, 3000)
      return () => clearInterval(interval)
    } else {
      setActiveAgent(0)
    }
  }, [loading])

  useEffect(() => {
    if (reportRef.current) {
      reportRef.current.scrollTop = reportRef.current.scrollHeight
    }
  }, [reportRef.current]) // Updated dependency

  // Function to extract URLs from markdown content
  const extractUrls = (markdown: string) => {
    const urls: string[] = []

    // Extract markdown links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]$$([^)]+)$$/g
    let match
    while ((match = markdownLinkRegex.exec(markdown)) !== null) {
      if (match[2] && match[2].startsWith("http")) {
        urls.push(match[2])
      }
    }

    // Extract raw URLs
    const rawUrlRegex = /(?:^|\s)(https?:\/\/[^\s)]+)/g
    while ((match = rawUrlRegex.exec(markdown)) !== null) {
      if (match[1]) {
        urls.push(match[1])
      }
    }

    return [...new Set(urls)] // Remove duplicates
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setReport("")
    setLoading(true)
    setHasInteracted(true)
    setDiscoveredUrls([]) // Reset URLs for new query

    try {
      const response = await fetch("/api/start-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, urls: [], max_iterations: 1 }),
      })

      if (!response.body) {
        setReport("No stream available")
        setLoading(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let done = false
      let reportContent = ""

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const events = chunk.split("\n\n").filter((event) => event.trim() !== "")
          events.forEach((event) => {
            if (event.startsWith("data: ")) {
              const dataStr = event.slice(6).trim()
              try {
                const data = JSON.parse(dataStr)
                if (data.report) {
                  // Remove the initial status messages if present
                  const cleanReport = data.report.replace(
                    /Research started\. Report will be updated\.Research session started and saved\./g,
                    "",
                  )
                  reportContent += cleanReport
                  setReport(reportContent)

                  // Extract URLs from the markdown content and update immediately
                  const extractedUrls = extractUrls(cleanReport)
                  if (extractedUrls.length > 0) {
                    setDiscoveredUrls((prev) => [...new Set([...prev, ...extractedUrls])])
                  }
                }
                if (data.visited_urls) {
                  setDiscoveredUrls((prev) => [...new Set([...prev, ...data.visited_urls])])
                }
              } catch (err) {
                console.error("Error parsing SSE data:", err)
              }
            }
          })
        }
      }
    } catch (error: any) {
      console.error("Error:", error)
      setReport((prev) => prev + "\n\nError: " + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative overflow-hidden">
      <FloatingParticles />
      <div className="flex-1 flex flex-col min-w-0">
        <motion.header
          className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] py-4 px-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            className="text-2xl tracking-[0.2em] text-center font-light"
            initial={{ letterSpacing: "0.3em", opacity: 0 }}
            animate={{ letterSpacing: "0.2em", opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            NOESIS
          </motion.h1>
        </motion.header>

        <main className="flex-1 flex flex-col p-6 overflow-hidden relative">
          {!hasInteracted ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.h2
                className="text-4xl font-light tracking-tight mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                What would you like to research?
              </motion.h2>
              <form onSubmit={handleSubmit} className="w-full max-w-2xl">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Enter your research query..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder-gray-500 rounded-lg pl-4 pr-20 py-3 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] border border-[hsl(var(--border))]"
                  />
                  <div className="absolute right-2 flex gap-2">
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                      onClick={() => setQuery("")}
                      disabled={loading || !query}
                    >
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </motion.svg>
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !query}
                      className="p-2 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transform rotate-90"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                      </motion.svg>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div ref={reportRef} className="flex-1 overflow-y-auto mb-4 scroll-smooth">
                <AnimatePresence>
                  <motion.div
                    key="report"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-lg mb-4 transition-all duration-200"
                  >
                    <div className="prose prose-invert prose-headings:font-light prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 prose-strong:text-white prose-strong:font-semibold max-w-none break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Remove unused node parameters
                          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                          pre: (props) => (
                            <pre {...props} className="bg-[hsl(var(--background))] p-4 rounded-lg overflow-auto" />
                          ),
                          code: ({ inline, ...props }: { inline?: boolean } & React.ComponentProps<"code">) =>
                            inline ? (
                              <code {...props} className="bg-[hsl(var(--background))] px-1.5 py-0.5 rounded text-sm" />
                            ) : (
                              <code {...props} />
                            ),
                          ul: (props) => <ul {...props} className="list-disc space-y-2 my-4" />,
                          ol: (props) => <ol {...props} className="list-decimal space-y-2 my-4" />,
                          li: (props) => <li {...props} className="ml-4" />,
                          p: (props) => <p {...props} className="my-4" />,
                          blockquote: (props) => (
                            <blockquote
                              {...props}
                              className="border-l-4 border-[hsl(var(--border))] pl-4 italic my-4"
                            />
                          ),
                        }}
                      >
                        {report}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                </AnimatePresence>
                {loading && <AgentAnimation activeAgent={activeAgent} />}
              </div>
              <form onSubmit={handleSubmit} className="sticky bottom-0 bg-[hsl(var(--background))] pt-4">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Ask a follow-up question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder-gray-500 rounded-lg pl-4 pr-20 py-3 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] border border-[hsl(var(--border))]"
                  />
                  <div className="absolute right-2 flex gap-2">
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                      onClick={() => setQuery("")}
                      disabled={loading || !query}
                    >
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </motion.svg>
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !query}
                      className="p-2 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transform rotate-90"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                      </motion.svg>
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </main>
      </div>

      {hasInteracted && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "320px", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="hidden md:block border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-y-auto w-[320px] shrink-0"
        >
          <div className="p-6">
            <h2 className="text-lg font-light tracking-wider mb-4">Discovered Sources</h2>
            <div className="space-y-2">
              {discoveredUrls.map((url, index) => (
                <motion.a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[hsl(var(--background))] text-gray-400 hover:text-gray-200 transition-colors group"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 shrink-0" />
                  <span className="text-sm truncate">{url}</span>
                </motion.a>
              ))}
            </div>
          </div>
        </motion.aside>
      )}
    </div>
  )
}

export default App

