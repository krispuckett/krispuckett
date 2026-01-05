'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrchestrator } from '@/lib/aoe-store'
import { getAgentIcon, getBuildingIcon, getStatusIcon } from './AoEIcons'
import type { Agent, Building, AgentType, BuildingType } from '@/lib/aoe-types'

// ============================================================================
// Command Panel - Bottom Center (AoE2 Style)
// ============================================================================

export default function CommandPanel() {
  const { state, spawnAgent, assignRealTask, getSelectedAgents, clearSelection } = useOrchestrator()
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [useRealAgents, setUseRealAgents] = useState(true) // Toggle for real vs simulated

  const selectedAgents = getSelectedAgents()
  const selectedBuilding = state.buildings.find(b => b.isSelected)

  // Determine what to show based on selection
  const hasSelection = selectedAgents.length > 0 || selectedBuilding

  return (
    <>
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
        style={{ width: 'min(600px, calc(100vw - 450px))' }}
      >
        {/* Main panel frame */}
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
          <AnimatePresence mode="wait">
            {hasSelection ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4"
              >
                {selectedBuilding ? (
                  <BuildingPanel
                    building={selectedBuilding}
                    onSpawnAgent={spawnAgent}
                  />
                ) : selectedAgents.length > 0 ? (
                  <AgentPanel
                    agents={selectedAgents}
                    onAssignTask={() => setShowTaskModal(true)}
                    onClearSelection={clearSelection}
                  />
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 text-center"
              >
                <p className="text-gray-500 text-sm italic">
                  Select units or buildings to see commands
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Click on the minimap or use hotkeys 1-9 for control groups
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4">
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, #8B4513 20%, #B8860B 50%, #8B4513 80%, transparent 100%)',
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
            }}
          />
        </div>
      </div>

      {/* Task Assignment Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <TaskModal
            agents={selectedAgents}
            onClose={() => setShowTaskModal(false)}
            onAssign={async (task) => {
              // Use real agents - spawn actual Claude agents
              for (const agent of selectedAgents) {
                if (agent.status === 'idle') {
                  await assignRealTask(agent.id, {
                    name: task.name,
                    description: task.description,
                    targetFile: task.targetFile,
                    targetDirectory: task.targetDirectory,
                  })
                }
              }
              setShowTaskModal(false)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================================================
// Building Panel - When a building is selected
// ============================================================================

interface BuildingPanelProps {
  building: Building
  onSpawnAgent: (type: AgentType) => void
}

function BuildingPanel({ building, onSpawnAgent }: BuildingPanelProps) {
  const availableUnits = getBuildingUnits(building.type)

  return (
    <div className="flex items-start gap-4">
      {/* Building info */}
      <div className="flex items-center gap-3">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #4a3a2a 0%, #2a2015 100%)',
            border: '2px solid #8B4513',
          }}
        >
          {getBuildingIcon(building.type, { size: 40 })}
        </div>
        <div>
          <h3 className="text-yellow-200 font-bold">{building.name}</h3>
          <p className="text-gray-400 text-sm capitalize">{building.type.replace('-', ' ')}</p>
          {/* Health bar */}
          <div className="w-24 h-2 bg-gray-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${building.health}%` }}
            />
          </div>
        </div>
      </div>

      {/* Spawn buttons */}
      <div className="flex-1">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Train Units</p>
        <div className="grid grid-cols-4 gap-2">
          {availableUnits.map(unit => (
            <CommandButton
              key={unit.type}
              icon={getAgentIcon(unit.type, { size: 28 })}
              label={unit.label}
              hotkey={unit.hotkey}
              onClick={() => onSpawnAgent(unit.type)}
              tooltip={unit.description}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Agent Panel - When agents are selected
// ============================================================================

interface AgentPanelProps {
  agents: Agent[]
  onAssignTask: () => void
  onClearSelection: () => void
}

function AgentPanel({ agents, onAssignTask, onClearSelection }: AgentPanelProps) {
  const { dispatch } = useOrchestrator()

  const idleAgents = agents.filter(a => a.status === 'idle')
  const workingAgents = agents.filter(a => a.status === 'working')

  return (
    <div className="flex items-start gap-4">
      {/* Selected agents preview */}
      <div className="flex flex-wrap gap-1 max-w-[180px]">
        {agents.slice(0, 12).map(agent => (
          <motion.div
            key={agent.id}
            className="relative w-10 h-10 rounded flex items-center justify-center cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #3a3020 0%, #2a2015 100%)',
              border: '2px solid #654321',
            }}
            whileHover={{ scale: 1.1 }}
            title={`${agent.name} (${agent.status})`}
          >
            {getAgentIcon(agent.type, { size: 24 })}
            <div className="absolute -top-1 -right-1">
              {getStatusIcon(agent.status, { size: 12 })}
            </div>
            {agent.controlGroup && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold border border-blue-400">
                {agent.controlGroup}
              </div>
            )}
          </motion.div>
        ))}
        {agents.length > 12 && (
          <div className="w-10 h-10 rounded flex items-center justify-center bg-gray-800 text-gray-400 text-sm font-bold">
            +{agents.length - 12}
          </div>
        )}
      </div>

      {/* Agent info summary */}
      <div className="flex-shrink-0">
        <h3 className="text-yellow-200 font-bold">
          {agents.length} {agents.length === 1 ? 'Agent' : 'Agents'} Selected
        </h3>
        <div className="flex items-center gap-3 text-sm mt-1">
          <span className="text-green-400">{idleAgents.length} Idle</span>
          <span className="text-blue-400">{workingAgents.length} Working</span>
        </div>
      </div>

      {/* Commands */}
      <div className="flex-1">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Commands</p>
        <div className="grid grid-cols-4 gap-2">
          <CommandButton
            icon={
              <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 6h2v6h-2V8zm0 8h2v2h-2v-2z"/>
              </svg>
            }
            label="Explore"
            hotkey="E"
            onClick={onAssignTask}
            disabled={idleAgents.length === 0}
            tooltip="Send agents to explore the codebase"
          />
          <CommandButton
            icon={
              <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            }
            label="Edit"
            hotkey="W"
            onClick={onAssignTask}
            disabled={idleAgents.length === 0}
            tooltip="Edit a specific file"
          />
          <CommandButton
            icon={
              <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            }
            label="Review"
            hotkey="R"
            onClick={onAssignTask}
            disabled={idleAgents.length === 0}
            tooltip="Review code for issues"
          />
          <CommandButton
            icon={
              <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            }
            label="Test"
            hotkey="T"
            onClick={onAssignTask}
            disabled={idleAgents.length === 0}
            tooltip="Run tests"
          />
          <CommandButton
            icon={
              <svg viewBox="0 0 24 24" width={24} height={24} fill="#FF6B6B">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
            }
            label="Stop"
            hotkey="S"
            onClick={() => {
              agents.forEach(agent => {
                if (agent.currentTask) {
                  dispatch({ type: 'CANCEL_TASK', taskId: agent.currentTask.id })
                }
              })
            }}
            disabled={workingAgents.length === 0}
            tooltip="Cancel current tasks"
          />
          <CommandButton
            icon={
              <svg viewBox="0 0 24 24" width={24} height={24} fill="#FFD700">
                <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
              </svg>
            }
            label="Group"
            hotkey="Ctrl+#"
            onClick={() => {}}
            tooltip="Set control group (Ctrl+1-9)"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Command Button
// ============================================================================

interface CommandButtonProps {
  icon: React.ReactNode
  label: string
  hotkey?: string
  onClick: () => void
  disabled?: boolean
  tooltip?: string
}

function CommandButton({ icon, label, hotkey, onClick, disabled, tooltip }: CommandButtonProps) {
  return (
    <motion.button
      className={`
        relative flex flex-col items-center justify-center p-2 rounded-lg
        transition-all group
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:brightness-125'
        }
      `}
      style={{
        background: disabled
          ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'
          : 'linear-gradient(135deg, #4a3a2a 0%, #2a2015 100%)',
        border: `2px solid ${disabled ? '#333' : '#8B4513'}`,
        boxShadow: disabled ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      title={tooltip}
    >
      <div className="text-yellow-100">{icon}</div>
      <span className="text-[10px] text-gray-300 mt-1 font-medium">{label}</span>
      {hotkey && (
        <div className="absolute -top-1 -right-1 px-1 py-0.5 bg-gray-900 rounded text-[8px] text-gray-400 font-mono border border-gray-700">
          {hotkey}
        </div>
      )}
    </motion.button>
  )
}

// ============================================================================
// Task Modal
// ============================================================================

interface TaskModalProps {
  agents: Agent[]
  onClose: () => void
  onAssign: (task: {
    name: string
    description: string
    priority: 'low' | 'normal' | 'high' | 'critical'
    estimatedTokens: number
    progress: number
    targetFile?: string
    targetDirectory?: string
  }) => void
}

function TaskModal({ agents, onClose, onAssign }: TaskModalProps) {
  const [taskType, setTaskType] = useState<'explore' | 'edit' | 'review' | 'test'>('explore')
  const [target, setTarget] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = () => {
    onAssign({
      name: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)}: ${target || 'General'}`,
      description: description || `${taskType} operation on ${target || 'codebase'}`,
      priority: 'normal',
      estimatedTokens: taskType === 'explore' ? 1000 : taskType === 'edit' ? 2000 : 1500,
      progress: 0,
      targetFile: taskType !== 'explore' ? target : undefined,
      targetDirectory: taskType === 'explore' ? target : undefined,
    })
  }

  const idleCount = agents.filter(a => a.status === 'idle').length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md p-6 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, #3a2820 0%, #2a1810 50%, #1a0f0a 100%)',
          border: '3px solid #8B4513',
          boxShadow: '0 0 40px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-yellow-200 mb-4">Assign Task</h2>
        <p className="text-gray-400 text-sm mb-4">
          {idleCount} agents ready for assignment
        </p>

        {/* Task type selection */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(['explore', 'edit', 'review', 'test'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTaskType(type)}
              className={`
                px-3 py-2 rounded text-sm font-medium capitalize
                ${taskType === type
                  ? 'bg-yellow-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }
              `}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Target input */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-1">
            {taskType === 'explore' ? 'Directory' : 'File'} (optional)
          </label>
          <input
            type="text"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder={taskType === 'explore' ? '/src/components' : '/src/app/page.tsx'}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-700"
          />
        </div>

        {/* Description input */}
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What should the agent do?"
            rows={3}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-700 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-gradient-to-r from-yellow-700 to-yellow-600 text-white font-medium rounded hover:from-yellow-600 hover:to-yellow-500 transition-colors"
          >
            Deploy Agents
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

interface UnitConfig {
  type: AgentType
  label: string
  hotkey: string
  description: string
}

function getBuildingUnits(buildingType: BuildingType): UnitConfig[] {
  const units: Record<BuildingType, UnitConfig[]> = {
    'town-center': [
      { type: 'villager', label: 'Villager', hotkey: 'C', description: 'General purpose agent' },
    ],
    barracks: [
      { type: 'archer', label: 'Archer', hotkey: 'A', description: 'Surgical edit agent' },
      { type: 'knight', label: 'Knight', hotkey: 'K', description: 'Heavy refactor agent' },
    ],
    'archery-range': [
      { type: 'archer', label: 'Archer', hotkey: 'A', description: 'Surgical edit agent' },
    ],
    stable: [
      { type: 'scout', label: 'Scout', hotkey: 'S', description: 'Fast exploration agent' },
    ],
    monastery: [
      { type: 'monk', label: 'Monk', hotkey: 'M', description: 'Code review agent' },
    ],
    'siege-workshop': [
      { type: 'siege', label: 'Siege', hotkey: 'R', description: 'System rewrite agent' },
    ],
    castle: [
      { type: 'knight', label: 'Elite Knight', hotkey: 'K', description: 'Advanced agent' },
    ],
    university: [],
  }
  return units[buildingType] || []
}
