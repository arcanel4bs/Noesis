"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ResearchSession } from '@/app/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SearchForm from '@/components/SearchForm';
import SourcesButton from '@/components/SourcesButton';
import LeftSideBar from '@/components/leftSideBar';
import { AgentStatus } from "@/app/types/agents";
import { motion } from 'framer-motion';

export default function ResearchPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    researcher: "idle",
    writer: "idle"
  });
  const [intermediateUpdates, setIntermediateUpdates] = useState<string[]>([]);

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId]);

  const fetchSession = async (id: string) => {
    try {
      const response = await fetch(`/api/research-sessions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
        setUrls(data.urls || []);
        setQuery(""); // Reset query for follow-up questions
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  const handleFollowUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session || !query.trim()) return;

    setLoading(true);
    setIntermediateUpdates([]);
    
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          query: query,
          max_iterations: 3
        })
      });

      if (!response.body) return;
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
            
            // Handle different types of updates
            if (data.agent_status) {
              setAgentStatus(data.agent_status);
            }
            if (data.status) {
              setIntermediateUpdates(prev => [...prev, data.status]);
            }
            if (data.report) {
              setSession(prev => ({
                ...prev!,
                final_report: data.report
              }));
            }
            if (data.error) {
              console.error('Error:', data.error);
              // Show error to user
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      fetchSession(sessionId);
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen relative bg-[hsl(var(--background))] flex flex-col items-center">
      <div className="absolute left-0 top-0 h-full">
        <LeftSideBar />
      </div>
      <div className="max-w-3xl w-full px-4 py-8">
        <SourcesButton 
          discoveredUrls={session?.urls || []}
          showSources={showSources}
          setShowSources={setShowSources}
        />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-light mb-4">
            {session.query}
          </h1>
          {urls.length > 0 && (
            <div className="bg-[hsl(var(--card))] rounded-lg p-4 mb-6">
              <h2 className="text-lg font-medium mb-2">Sources</h2>
              <ul className="space-y-2">
                {urls.map((url, index) => (
                  <li key={index}>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
        
        <main className="mb-4">
          <div className="prose prose-invert max-w-none break-words mb-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {session.final_report || ''}
            </ReactMarkdown>
          </div>
          
          <SearchForm
            query={query}
            setQuery={setQuery}
            loading={loading}
            onSubmit={handleFollowUp}
            placeholder="Ask a follow-up question..."
            className="sticky bottom-0 bg-[hsl(var(--background))] pt-4"
          />
        </main>
      </div>
      {agentStatus.researcher === "working" && <div>Researcher is working...</div>}
      {agentStatus.writer === "working" && <div>Writer is working...</div>}
      {intermediateUpdates.map((update, index) => (
        <div key={index}>{update}</div>
      ))}
    </div>
  );
}