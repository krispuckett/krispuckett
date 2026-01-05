'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useOrchestrator } from '@/lib/aoe-store'
import { getAgentIcon } from './AoEIcons'
import type { Task, Agent } from '@/lib/aoe-types'

// ============================================================================
// Production Queue - Bottom Right (AoE2 Style)
// ============================================================================

export default function ProductionQueue() {
  const { state, dispatch } = useOrchestrator()

  // Get active tasks (in progress) and recent completed
  const activeTasks = state.tasks.filter(t => t.status === 'in_progress')
  const recentCompleted = state.tasks
    .filter(t => t.status === 'completed')
    .slice(-3)
    .reverse()

  const workingAgents = state.agents.filter(a => a.status === 'working')

  if (activeTasks.length === 0 && recentCompleted.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40"
      style={{ width: '280px' }}
    >
      {/* Main frame */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #3a2820 0%, #2a1810 50%, #1a0f0a 100%)',
          border: '3px solid #8B4513',
          boxShadow: `
            inset 0 2px 10px rgba(0,0,0,0.5),
            0 4px 20px rgba(0,0,0,0.5),
            0 0 0 1px #654321
          `,
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{
            background: 'linear-gradient(90deg, #4a3a2a 0%, #3a2820 100%)',
            borderBottom: '2px solid #654321',
          }}
        >
          <span className="text-yellow-200 font-bold text-sm">Task Queue</span>
          <span className="text-gray-400 text-xs">{activeTasks.length} active</span>
        </div>

        {/* Active tasks */}
        <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
          <AnimatePresence>
            {activeTasks.map(task => {
              const agent = state.agents.find(a => a.id === task.assignedAgent)
              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  agent={agent}
                  onCancel={() => dispatch({ type: 'CANCEL_TASK', taskId: task.id })}
                />
              )
            })}
          </AnimatePresence>

          {/* Completed tasks */}
          {recentCompleted.length > 0 && activeTasks.length > 0 && (
            <div className="border-t border-gray-700 pt-2 mt-2">
              <span className="text-gray-500 text-xs">Recently Completed</span>
            </div>
          )}
          <AnimatePresence>
            {recentCompleted.map(task => (
              <CompletedTaskItem key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </div>

        {/* Agent activity summary */}
        {workingAgents.length > 0 && (
          <div
            className="px-3 py-2 flex items-center gap-2 overflow-x-auto"
            style={{
              background: 'linear-gradient(90deg, #2a2015 0%, #1a0f0a 100%)',
              borderTop: '1px solid #654321',
            }}
          >
            <span className="text-gray-500 text-xs flex-shrink-0">Working:</span>
            {workingAgents.map(agent => (
              <motion.div
                key={agent.id}
                className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #3a3020 0%, #2a2015 100%)',
                  border: '1px solid #654321',
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                title={agent.name}
              >
                {getAgentIcon(agent.type, { size: 20 })}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Task Item Component
// ============================================================================

interface TaskItemProps {
  task: Task
  agent?: Agent
  onCancel: () => void
}

function TaskItem({ task, agent, onCancel }: TaskItemProps) {
  // Simulate progress for demo
  const progress = task.progress || Math.min(95, Math.random() * 80 + 10)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-2 rounded"
      style={{
        background: 'linear-gradient(135deg, #3a3020 0%, #2a2015 100%)',
        border: '1px solid #654321',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {agent && (
              <div className="w-6 h-6 flex-shrink-0">
                {getAgentIcon(agent.type, { size: 18 })}
              </div>
            )}
            <span className="text-yellow-100 text-sm font-medium truncate">
              {task.name}
            </span>
          </div>
          {task.targetFile && (
            <p className="text-gray-500 text-xs mt-0.5 truncate pl-8">
              {task.targetFile}
            </p>
          )}
        </div>
        <button
          onClick={onCancel}
          className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center bg-red-900/50 hover:bg-red-800 text-red-400 transition-colors"
        >
          <svg viewBox="0 0 16 16" width={10} height={10} fill="currentColor">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #4A90D9 0%, #68A8E8 100%)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-gray-400 text-xs w-8 text-right">{Math.round(progress)}%</span>
      </div>

      {/* Tokens used */}
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Est: {task.estimatedTokens.toLocaleString()} tokens
        </span>
        {task.startedAt && (
          <span className="text-gray-500">
            {formatDuration(Date.now() - task.startedAt)}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Completed Task Item Component
// ============================================================================

interface CompletedTaskItemProps {
  task: Task
}

function CompletedTaskItem({ task }: CompletedTaskItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-2 rounded opacity-60"
      style={{
        background: 'linear-gradient(135deg, #1a2a1a 0%, #0f1a0f 100%)',
        border: '1px solid #2a4a2a',
      }}
    >
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 16 16" width={14} height={14} fill="#4CAF50">
          <circle cx="8" cy="8" r="6"/>
          <path d="M5 8l2 2 4-4" fill="none" stroke="white" strokeWidth="1.5"/>
        </svg>
        <span className="text-green-300 text-sm truncate">{task.name}</span>
        {task.actualTokens > 0 && (
          <span className="text-gray-500 text-xs ml-auto">
            {task.actualTokens.toLocaleString()} tokens
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}
