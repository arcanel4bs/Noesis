import { motion } from "framer-motion";

const exampleQueries = [
  "quantum technology and its future applications",
  "latest developments in space exploration",
  "advancements in brain-computer interfaces",
  "cutting-edge racing car technologies",
  "artificial intelligence in healthcare",
  "sustainable energy innovations"
];

const WelcomeCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="bg-[hsl(var(--card))] rounded-lg p-4 md:p-6 mb-4 md:mb-8 border border-[hsl(var(--border))]"
    >
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-2xl font-semibold mb-3 md:mb-4"
      >
        Welcome to Noesis: A Web Reasoning Agent
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm md:text-base text-[hsl(var(--foreground))] mb-3 md:mb-4"
      >
        Ask me anything about current developments, research, or technologies. Here are some examples:
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3"
      >
        {exampleQueries.map((query, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="bg-[hsl(var(--background))] p-2 md:p-3 rounded-md text-xs md:text-sm cursor-pointer hover:bg-[hsl(var(--border))] transition-colors"
          >
            {query}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default WelcomeCard;