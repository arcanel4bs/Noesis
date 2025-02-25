import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiCpu, FiFileText } from 'react-icons/fi';
import { AgentStatus } from "@/app/types/agents";

interface ProcessVisualizerProps {
  agentStatus: AgentStatus;
  className?: string;
}

const stages = [
  {
    id: 'researcher',
    icon: FiSearch,
    title: 'Web Research',
    description: 'Searching and analyzing web content'
  },
  {
    id: 'synthesizer',
    icon: FiCpu,
    title: 'Knowledge Synthesis',
    description: 'Processing and connecting information'
  },
  {
    id: 'writer',
    icon: FiFileText,
    title: 'Report Generation',
    description: 'Creating comprehensive research report'
  }
];

export const ProcessVisualizer = ({ agentStatus, className }: ProcessVisualizerProps) => {
  return (
    <div className={`fixed right-4 top-24 w-64 space-y-4 ${className}`}>
      <AnimatePresence>
        {stages.map((stage, index) => {
          const isActive = agentStatus[stage.id as keyof AgentStatus] === 'working';
          const isDone = agentStatus[stage.id as keyof AgentStatus] === 'idle';
          
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ 
                opacity: isActive || isDone ? 1 : 0.5,
                x: 0,
                scale: isActive ? 1.05 : 1
              }}
              exit={{ opacity: 0, x: -50 }}
              className={`
                bg-[hsl(var(--card))] rounded-lg p-4
                border border-[hsl(var(--border))]
                ${isActive ? 'shadow-lg border-blue-500' : ''}
                transition-all duration-300
              `}
            >
              <div className="flex items-center gap-3">
                <stage.icon 
                  className={`w-6 h-6 ${isActive ? 'text-blue-500' : ''}`}
                />
                <div>
                  <h3 className="font-medium">{stage.title}</h3>
                  <p className="text-sm opacity-70">{stage.description}</p>
                </div>
              </div>
              
              {isActive && (
                <motion.div 
                  className="h-1 bg-blue-500 mt-3 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};