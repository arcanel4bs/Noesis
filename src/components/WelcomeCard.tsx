import { motion } from "framer-motion";
import { FiSearch, FiCpu, FiFileText } from 'react-icons/fi';
import { useState, useEffect } from 'react';

const stages = [
  {
    icon: FiSearch,
    title: "Comprehensive Web Search",
    description: "We start by casting a wide net, gathering information from diverse and reliable sources across the web. This ensures we have a broad foundation of data.",
  },
  {
    icon: FiCpu,
    title: "Intelligent Analysis",
    description: "Our AI then steps in to sift through the information, identifying key facts, connections, and insights that might be missed by a human researcher.",
  },
  {
    icon: FiFileText,
    title: "Clear, Concise Report",
    description: "Finally, we synthesize all the findings into a well-structured, easy-to-understand report, saving you time and effort.",
  }
];

const WelcomeCard = () => {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prevStage) => (prevStage + 1) % stages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6 bg-[hsl(var(--card))] rounded-xl shadow-xl"
    >
      <h1 className="text-2xl font-light mb-6">Welcome to NOESIS</h1>

      <p className="text-lg mb-8 text-gray-300">
        Your AI-powered research companion that transforms complex queries into comprehensive insights.
      </p>

      <div className="flex space-x-6">
        {/* Status Bar Container */}
        <div className="w-2 rounded-full bg-gray-700/50 relative">
          {/* Animated Progress Bar */}
          <motion.div
            className="h-full bg-[hsl(var(--primary))] rounded-full"
            style={{
              width: `${(activeStage + 1) * (100 / stages.length)}%`, // Calculate width based on activeStage
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </div>

        {/* Stage Descriptions */}
        <div className="flex-1">
          {stages.map((stage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: activeStage === index ? 1 : 0.6,
                x: 0,
                color: activeStage === index ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              }}
              transition={{
                duration: 0.5,
              }}
              className={`
                p-4 rounded-lg mb-4
                transition-all duration-300
              `}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <stage.icon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">
                    {stage.title}
                  </h3>
                  <p className="text-sm">
                    {stage.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-sm text-gray-400 text-center"
      >
        Enter your research query above to begin
      </motion.div>
    </motion.div>
  );
};

export default WelcomeCard;