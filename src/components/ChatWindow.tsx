import { Message } from "@/app/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "framer-motion";

interface ChatWindowProps {
  messages: Message[];
}

export const ChatWindow = ({ messages }: ChatWindowProps) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 p-3 md:p-4">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`max-w-[90%] md:max-w-[80%] rounded-lg p-3 md:p-4 backdrop-blur-sm ${
                message.role === "user"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-lg"
                  : "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]"
              }`}
            >
              <div className="prose prose-sm md:prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
