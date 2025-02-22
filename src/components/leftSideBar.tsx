// History of research sessions
import React, { useState, useEffect } from 'react';
import { FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  query: string;
  created_at: string;
}

const LeftSideBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch conversations from your backend API.
    // Adjust the endpoint as necessary.
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/research-sessions');
        if (res.ok) {
          const data = await res.json();
          // Sort conversations by newest (top) to older (bottom)
          const sorted = data.sort(
            (a: Conversation, b: Conversation) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setConversations(sorted);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  const handleNewConversation = () => {
    // Navigate to the page where a new conversation is started.
    // This could reset the current session form.
    router.push('/');
  };

  const handleConversationClick = (id: string) => {
    router.push(`/research/${id}`);
  };

  return (
    <div
      className={`bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] h-full transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      } flex flex-col`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
        {isOpen && <h2 className="text-lg font-semibold">Conversations</h2>}
        <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
          {isOpen ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />}
        </button>
      </div>
      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-2 w-full p-4 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--primary-hover))] transition-colors"
          >
            <FiPlus size={18} />
            <span>New Conversation</span>
          </button>
          <ul>
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => handleConversationClick(conv.id)}
                  className="w-full text-left p-4 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--primary-hover))] transition-colors"
                >
                  <div className="text-sm font-medium line-clamp-1">{conv.query}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(conv.created_at).toLocaleString()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LeftSideBar;

