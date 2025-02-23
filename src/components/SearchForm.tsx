import { motion } from "framer-motion";

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  placeholder?: string;
  className?: string;
}

const SearchForm = ({ 
  query, 
  setQuery, 
  loading, 
  onSubmit, 
  placeholder = "Enter your research query...",
  className = ""
}: SearchFormProps) => {
  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder-gray-500 rounded-lg pl-4 md:pl-10 pr-16 py-2 md:py-3 text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] border border-[hsl(var(--border))]"
        />
        <div className="absolute right-2 flex gap-1 md:gap-2">
          <button
            type="button"
            onClick={() => setQuery("")}
            disabled={loading || !query}
            className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
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
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </motion.svg>
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchForm;