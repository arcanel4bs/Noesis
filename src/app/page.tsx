"use client"

import { useState, useEffect } from "react"
import SearchForm from "@/components/SearchForm"
import SourcesButton from "@/components/SourcesButton"
import { AgentAnimation } from "@/components/agent-animation"
import { ChatWindow } from "@/components/ChatWindow"
import { Message } from "@/app/types/chat"
import LeftSideBar from "@/components/leftSideBar"
import WelcomeCard from "@/components/WelcomeCard"
import { AnimatePresence, motion } from "framer-motion"

const Page = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [activeAgent, setActiveAgent] = useState(0)
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([])

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
        setDiscoveredUrls((prev) => [...new Set([...prev, ...extractUrls(cleanReport)])])
      }
      // Update the discovered URLs if they are sent by the backend.
      if (data.visited_urls) {
        setDiscoveredUrls((prev: string[]) => [...new Set([...prev, ...data.visited_urls])])
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
    setDiscoveredUrls([])
    setLoading(true)
    setActiveAgent(0)

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          urls: [],
          max_iterations: 1,
          skipInitialDelay: true // New flag to skip initial delay
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
            
            if (data.sessionId) {
              window.location.href = `/research/${data.sessionId}`;
              return;
            }

            if (data.agent_status?.researcher === "working") {
              setActiveAgent(0);
            } else if (data.agent_status?.writer === "working") {
              setActiveAgent(1);
            } else if (data.report) {
              setActiveAgent(2);
            }

            if (data.visited_urls) {
              setDiscoveredUrls((prev: string[]) => [...new Set([...prev, ...data.visited_urls])])
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
      setActiveAgent(-1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen relative bg-[hsl(var(--background))] flex flex-col items-center"
    >
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
          <AnimatePresence>
            {messages.length === 0 && <WelcomeCard />}
          </AnimatePresence>
          <ChatWindow messages={messages} />
          <SearchForm
            query={query}
            setQuery={setQuery}
            loading={loading}
            onSubmit={handleSubmit}
            placeholder={messages.length > 0 ? "Ask a follow-up question..." : "What would you like to research?"}
            className="sticky bottom-0 bg-[hsl(var(--background))] pt-4"
          />
        </main>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <AgentAnimation activeAgent={activeAgent} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default Page