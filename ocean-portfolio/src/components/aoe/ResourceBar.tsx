'use client'

import { motion } from 'framer-motion'
import { useOrchestrator } from '@/lib/aoe-store'
import { TokenIcon, AgentCountIcon, TaskIcon } from './AoEIcons'

// ============================================================================
// Resource Bar - Top HUD (Age of Empires 2 Style)
// ============================================================================

export default function ResourceBar() {
  const { state } = useOrchestrator()
  const { resources } = state

  const tokenPercentage = (resources.tokens / resources.maxTokens) * 100
  const agentPercentage = (resources.activeAgents / resources.maxAgents) * 100

  // Idle agent count for alert
  const idleAgents = state.agents.filter(a => a.status === 'idle').length

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Main resource bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: 'linear-gradient(180deg, #2a1810 0%, #1a0f0a 100%)',
          borderBottom: '2px solid #8B4513',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        {/* Left side - Resources */}
        <div className="flex items-center gap-6">
          {/* Tokens (like Gold in AoE2) */}
          <ResourceItem
            icon={<TokenIcon size={24} />}
            value={resources.tokens.toLocaleString()}
            max={resources.maxTokens.toLocaleString()}
            percentage={tokenPercentage}
            color="#FFD700"
            label="Tokens"
          />

          {/* Active Agents (like Population) */}
          <ResourceItem
            icon={<AgentCountIcon size={24} />}
            value={resources.activeAgents}
            max={resources.maxAgents}
            percentage={agentPercentage}
            color="#4A90D9"
            label="Agents"
          />

          {/* Completed Tasks */}
          <ResourceItem
            icon={<TaskIcon size={24} />}
            value={resources.completedTasks}
            color="#4CAF50"
            label="Completed"
          />

          {/* Failed Tasks */}
          {resources.failedTasks > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-900/50 border border-red-700">
              <span className="text-red-400 text-sm font-bold">{resources.failedTasks} Failed</span>
            </div>
          )}
        </div>

        {/* Center - Game controls */}
        <div className="flex items-center gap-2">
          <GameSpeedControl />
        </div>

        {/* Right side - Idle agent alert */}
        <div className="flex items-center gap-4">
          {idleAgents > 0 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #8B4513 0%, #654321 100%)',
                border: '2px solid #FFD700',
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
              }}
            >
              <span className="text-yellow-300 font-bold text-lg">{idleAgents}</span>
              <span className="text-yellow-100 text-sm">Idle</span>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                <svg viewBox="0 0 16 16" width={16} height={16} fill="#FFD700">
                  <path d="M8 1L10 6H15L11 9.5L12.5 15L8 11.5L3.5 15L5 9.5L1 6H6L8 1Z"/>
                </svg>
              </motion.div>
            </motion.div>
          )}

          {/* Control group indicators */}
          <div className="flex items-center gap-1">
            {state.controlGroups.slice(0, 5).map((cg, i) => (
              <div
                key={cg.number}
                className={`
                  w-6 h-6 rounded flex items-center justify-center text-xs font-bold
                  ${cg.agentIds.length > 0
                    ? 'bg-blue-900 text-blue-200 border border-blue-500'
                    : 'bg-gray-800 text-gray-600 border border-gray-700'
                  }
                `}
              >
                {cg.number}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Resource Item Component
// ============================================================================

interface ResourceItemProps {
  icon: React.ReactNode
  value: number | string
  max?: number | string
  percentage?: number
  color: string
  label: string
}

function ResourceItem({ icon, value, max, percentage, color, label }: ResourceItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className="text-white font-bold text-lg" style={{ textShadow: '1px 1px 2px black' }}>
            {value}
          </span>
          {max && (
            <span className="text-gray-400 text-sm">/ {max}</span>
          )}
        </div>
        {percentage !== undefined && (
          <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Game Speed Control
// ============================================================================

function GameSpeedControl() {
  const { state, dispatch } = useOrchestrator()

  const speeds = [0.5, 1, 2, 4]

  return (
    <div className="flex items-center gap-2">
      {/* Pause/Resume button */}
      <button
        onClick={() => dispatch({ type: state.isPaused ? 'RESUME' : 'PAUSE' })}
        className={`
          w-8 h-8 rounded flex items-center justify-center transition-colors
          ${state.isPaused
            ? 'bg-green-800 hover:bg-green-700 border border-green-500'
            : 'bg-yellow-800 hover:bg-yellow-700 border border-yellow-500'
          }
        `}
      >
        {state.isPaused ? (
          <svg viewBox="0 0 16 16" width={12} height={12} fill="white">
            <polygon points="4,2 14,8 4,14"/>
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width={12} height={12} fill="white">
            <rect x="3" y="2" width="4" height="12"/>
            <rect x="9" y="2" width="4" height="12"/>
          </svg>
        )}
      </button>

      {/* Speed selector */}
      <div className="flex items-center bg-gray-900 rounded border border-gray-700">
        {speeds.map(speed => (
          <button
            key={speed}
            onClick={() => dispatch({ type: 'SET_SPEED', speed })}
            className={`
              px-2 py-1 text-xs font-bold transition-colors
              ${state.gameSpeed === speed
                ? 'bg-blue-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  )
}
