"use client"

import { useState, useEffect } from "react"
import LeftSideBar from "@/components/leftSideBar"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import SearchForm from "@/components/SearchForm"
import SourcesButton from "@/components/SourcesButton"

const Page = () => {
  const [query, setQuery] = useState("")
  const [report, setReport] = useState("")
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const extractUrls = (markdown: string) => {
    const urls: string[] = []
    // Extract markdown links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
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
    return [...new Set(urls)]
  }

  useEffect(() => {
    // Set up Server-Sent Events to receive updates.
    const eventSource = new EventSource("/api/research")
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // Update the report when final refined report is sent.
      if (data.report) {
        const cleanReport = data.report.replace(
          /Research started\. Report will be updated\.Research session started and saved\./g,
          ""
        )
        setReport((prev) => prev + cleanReport)

        const extractedUrls = extractUrls(cleanReport)
        if (extractedUrls.length > 0) {
          setDiscoveredUrls((prev) => [...new Set([...prev, ...extractedUrls])])
        }
      }
      // Update the discovered URLs if they are sent by the backend.
      if (data.visited_urls) {
        setDiscoveredUrls((prev) => [...new Set([...prev, ...data.visited_urls])])
      }
      if (data.error) {
        alert(data.error)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setReport("")
    setDiscoveredUrls([])
    setLoading(true)
    setHasInteracted(true)

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          urls: [],
          max_iterations: 1
        })
      });

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n").filter(line => line.trim() !== "");
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace(/^data: /, ''));
            
            // Handle session creation success
            if (data.sessionId) {
              window.location.href = `/research/${data.sessionId}`;
              return;
            }

            // Handle different types of updates
            if (data.report) {
              setReport(data.report);
            }
            if (data.visited_urls) {
              setDiscoveredUrls(prev => [...new Set([...prev, ...data.visited_urls])]);
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
            throw err;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to start research session: " + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative bg-[hsl(var(--background))] flex flex-col items-center">
      <div className="absolute left-0 top-0 h-full">
        <LeftSideBar />
      </div>
      <div className="max-w-3xl w-full px-4 py-8">
        <SourcesButton 
          showSources={showSources}
          setShowSources={setShowSources}
          discoveredUrls={discoveredUrls}
        />
        
        <main className="mb-4">
          {!hasInteracted ? (
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <motion.h2
                className="text-4xl font-light tracking-tight mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                What would you like to research?
              </motion.h2>
              <SearchForm
                query={query}
                setQuery={setQuery}
                loading={loading}
                onSubmit={handleSubmit}
                className="w-full max-w-2xl relative"
              />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto mb-4 scroll-smooth space-y-4">
                <div className="prose prose-invert max-w-none break-words">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                </div>
              </div>
              <SearchForm
                query={query}
                setQuery={setQuery}
                loading={loading}
                onSubmit={handleSubmit}
                placeholder="Ask a follow-up question..."
                className="sticky bottom-0 bg-[hsl(var(--background))] pt-4 relative"
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Page