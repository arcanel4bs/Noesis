import { motion } from "framer-motion"
import { Search, FileSearch, PenLine } from "lucide-react"

interface AgentAnimationProps {
  activeAgent: number
}

export const AgentAnimation = ({ activeAgent }: AgentAnimationProps) => {
  const agents = [
    { icon: Search, label: "Searching", color: "rgb(209 213 219)" },
    { icon: FileSearch, label: "Analyzing", color: "rgb(209 213 219)" },
    { icon: PenLine, label: "Writing", color: "rgb(209 213 219)" },
  ]

  return (
    <motion.div
      className="flex items-center justify-center gap-16 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {agents.map((Agent, index) => (
        <div key={index} className="flex items-center">
          <div className="relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: activeAgent === index ? 1 : 0.8,
                opacity: activeAgent === index ? 1 : 0.3,
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex flex-col items-center relative"
            >
              <motion.div
                className="relative"
                animate={{
                  rotate: activeAgent === index ? [0, 360] : 0,
                }}
                transition={{
                  duration: 3,
                  ease: "linear",
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                }}
              >
                <Agent.icon className="w-6 h-6" style={{ color: Agent.color }} />
                {activeAgent === index && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full pulse-ring"
                      style={{ border: `1px solid ${Agent.color}` }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `1px solid ${Agent.color}` }}
                    />
                  </>
                )}
              </motion.div>
              {activeAgent === index && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs text-gray-400 mt-2 absolute -bottom-6 whitespace-nowrap typewriter"
                >
                  {Agent.label}
                </motion.span>
              )}
            </motion.div>
          </div>
          {index < agents.length - 1 && (
            <div className="relative mx-2">
              <div className={`connecting-line ${activeAgent === index ? "connecting-line-active" : ""}`} />
              <div
                className={`connecting-line mt-1 ${activeAgent === index ? "connecting-line-active" : ""}`}
                style={{ animationDelay: "0.1s" }}
              />
            </div>
          )}
        </div>
      ))}
    </motion.div>
  )
}

