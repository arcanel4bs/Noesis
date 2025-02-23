import { Message } from "@/app/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatWindowProps {
  messages: Message[];
}

export const ChatWindow = ({ messages }: ChatWindowProps) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 p-3 md:p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[90%] md:max-w-[80%] rounded-lg p-3 md:p-4 ${
              message.role === "user"
                ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))]"
                : "bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
            }`}
          >
            <div className="prose prose-sm md:prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
