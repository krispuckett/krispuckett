'use client'

import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OrchestratorProvider, useOrchestrator } from '@/lib/aoe-store'
import ResourceBar from '@/components/aoe/ResourceBar'
import Minimap from '@/components/aoe/Minimap'
import CommandPanel from '@/components/aoe/CommandPanel'
import ProductionQueue from '@/components/aoe/ProductionQueue'
import { getAgentIcon, getBuildingIcon, getStatusIcon } from '@/components/aoe/AoEIcons'
import type { Agent, Building } from '@/lib/aoe-types'

// ============================================================================
// Main Orchestrator Page
// ============================================================================

export default function OrchestratorPage() {
  return (
    <OrchestratorProvider>
      <div
        className="min-h-screen overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, #1a2a1a 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, #2a1a1a 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, #1a1a2a 0%, transparent 70%),
            #0a0a0a
          `,
        }}
      >
        <OrchestratorContent />
      </div>
    </OrchestratorProvider>
  )
}

// ============================================================================
// Orchestrator Content (with hooks)
// ============================================================================

function OrchestratorContent() {
  const {
    state,
    spawnAgent,
    selectAgents,
    clearSelection,
    setControlGroup,
    recallControlGroup,
    dispatch,
  } = useOrchestrator()

  const [showHelp, setShowHelp] = useState(false)
  const [notifications, setNotifications] = useState<string[]>([])

  // Keyboard shortcuts (AoE2 style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Control groups: Ctrl+1-9 to set, 1-9 to recall
      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key)
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          setControlGroup(num)
          addNotification(`Control group ${num} set`)
        } else {
          e.preventDefault()
          recallControlGroup(num)
        }
        return
      }

      // Other shortcuts
      switch (e.key.toLowerCase()) {
        case 'escape':
          clearSelection()
          break
        case 'f1':
          e.preventDefault()
          setShowHelp(h => !h)
          break
        case 'c':
          // Spawn villager (general agent) from Town Center
          if (!e.ctrlKey) {
            spawnAgent('villager', 'general-purpose')
            addNotification('Villager training...')
          }
          break
        case 's':
          // Spawn scout
          spawnAgent('scout', 'explore')
          addNotification('Scout training...')
          break
        case 'a':
          // Spawn archer
          spawnAgent('archer', 'general-purpose')
          addNotification('Archer training...')
          break
        case 'm':
          // Spawn monk
          spawnAgent('monk', 'code-review')
          addNotification('Monk training...')
          break
        case ' ':
          // Space to toggle pause
          e.preventDefault()
          dispatch({ type: state.isPaused ? 'RESUME' : 'PAUSE' })
          break
        case '.':
          // Find idle agent (like . in AoE2)
          const idleAgent = state.agents.find(a => a.status === 'idle')
          if (idleAgent) {
            selectAgents([idleAgent.id])
            addNotification(`Selected idle agent: ${idleAgent.name}`)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state, spawnAgent, selectAgents, clearSelection, setControlGroup, recallControlGroup, dispatch])

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message])
    setTimeout(() => {
      setNotifications(prev => prev.slice(1))
    }, 2000)
  }

  // Demo: Simulate task progress
  useEffect(() => {
    const interval = setInterval(() => {
      state.tasks.forEach(task => {
        if (task.status === 'in_progress') {
          const newProgress = Math.min(100, (task.progress || 0) + Math.random() * 5)
          dispatch({
            type: 'UPDATE_TASK',
            taskId: task.id,
            updates: { progress: newProgress },
          })
          if (newProgress >= 100) {
            dispatch({
              type: 'UPDATE_TASK',
              taskId: task.id,
              updates: {
                status: 'completed',
                completedAt: Date.now(),
                actualTokens: task.estimatedTokens + Math.floor(Math.random() * 500),
              },
            })
          }
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state.tasks, dispatch])

  return (
    <>
      {/* Resource Bar - Top */}
      <ResourceBar />

      {/* Main Game View */}
      <div className="pt-16 pb-32 px-4 min-h-screen">
        <GameView />
      </div>

      {/* Minimap - Bottom Left */}
      <Minimap />

      {/* Command Panel - Bottom Center */}
      <CommandPanel />

      {/* Production Queue - Bottom Right */}
      <ProductionQueue />

      {/* Notifications Toast */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((msg, i) => (
            <motion.div
              key={`${msg}-${i}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4 py-2 rounded-lg text-yellow-200 text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, #4a3a2a 0%, #2a1810 100%)',
                border: '2px solid #8B4513',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              {msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </AnimatePresence>

      {/* Pause Overlay */}
      <AnimatePresence>
        {state.isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-6xl font-bold text-yellow-400 uppercase tracking-widest"
              style={{ textShadow: '0 0 20px rgba(255,200,0,0.5)' }}
            >
              Paused
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================================================
// Game View - Main Battlefield
// ============================================================================

function GameView() {
  const { state, selectAgents, selectBuildings, clearSelection } = useOrchestrator()
  const [selectionBox, setSelectionBox] = useState<{
    start: { x: number; y: number }
    end: { x: number; y: number }
  } | null>(null)

  // Handle click on empty area
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection()
    }
  }, [clearSelection])

  // Handle agent click
  const handleAgentClick = useCallback((agentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.shiftKey) {
      selectAgents([...state.selection.agents, agentId])
    } else {
      selectAgents([agentId])
    }
  }, [selectAgents, state.selection.agents])

  // Handle building click
  const handleBuildingClick = useCallback((buildingId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    selectBuildings([buildingId])
  }, [selectBuildings])

  return (
    <div
      className="relative w-full h-[calc(100vh-200px)] rounded-lg overflow-hidden cursor-crosshair"
      onClick={handleBackgroundClick}
      style={{
        background: `
          radial-gradient(ellipse at 20% 30%, #1a3a1a 0%, transparent 40%),
          radial-gradient(ellipse at 80% 70%, #2a4a2a 0%, transparent 35%),
          radial-gradient(ellipse at 50% 50%, #1a2a1a 0%, transparent 60%),
          linear-gradient(180deg, #0f1a0f 0%, #0a0f0a 100%)
        `,
        border: '3px solid #4a3a2a',
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Terrain decorations */}
      <TerrainDecorations />

      {/* Buildings */}
      {state.buildings.map(building => (
        <BuildingUnit
          key={building.id}
          building={building}
          isSelected={building.isSelected}
          onClick={handleBuildingClick}
        />
      ))}

      {/* Agents */}
      {state.agents.map(agent => (
        <AgentUnit
          key={agent.id}
          agent={agent}
          isSelected={state.selection.agents.includes(agent.id)}
          onClick={handleAgentClick}
        />
      ))}

      {/* Selection box (future: drag select) */}
      {selectionBox && (
        <div
          className="absolute border-2 border-green-400 bg-green-400/20"
          style={{
            left: Math.min(selectionBox.start.x, selectionBox.end.x),
            top: Math.min(selectionBox.start.y, selectionBox.end.y),
            width: Math.abs(selectionBox.end.x - selectionBox.start.x),
            height: Math.abs(selectionBox.end.y - selectionBox.start.y),
          }}
        />
      )}

      {/* Empty state prompt */}
      {state.agents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-8 rounded-lg"
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: '2px solid #4a3a2a',
            }}
          >
            <h2 className="text-2xl font-bold text-yellow-200 mb-4">
              Welcome, Commander
            </h2>
            <p className="text-gray-400 mb-6 max-w-md">
              Click on a building to train agents, or use hotkeys:
            </p>
            <div className="grid grid-cols-2 gap-4 text-left text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded text-yellow-300 font-mono">C</kbd>
                <span className="text-gray-300">Train Villager</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded text-yellow-300 font-mono">S</kbd>
                <span className="text-gray-300">Train Scout</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded text-yellow-300 font-mono">A</kbd>
                <span className="text-gray-300">Train Archer</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded text-yellow-300 font-mono">M</kbd>
                <span className="text-gray-300">Train Monk</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-4">Press F1 for full help</p>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Agent Unit Component
// ============================================================================

interface AgentUnitProps {
  agent: Agent
  isSelected: boolean
  onClick: (id: string, e: React.MouseEvent) => void
}

function AgentUnit({ agent, isSelected, onClick }: AgentUnitProps) {
  const isWorking = agent.status === 'working'
  const isIdle = agent.status === 'idle'

  return (
    <motion.div
      className={`
        absolute cursor-pointer
        ${isSelected ? 'z-20' : 'z-10'}
      `}
      style={{
        left: `${agent.position.x}%`,
        top: `${agent.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={(e) => onClick(agent.id, e)}
      animate={
        isWorking
          ? { y: [0, -5, 0] }
          : isIdle
          ? { scale: [1, 1.05, 1] }
          : {}
      }
      transition={{
        repeat: Infinity,
        duration: isWorking ? 0.5 : 1.5,
      }}
      whileHover={{ scale: 1.15 }}
    >
      {/* Selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 -m-3 rounded-full border-2 border-green-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1 }}
          style={{
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
          }}
        />
      )}

      {/* Agent container */}
      <div
        className="w-14 h-14 rounded-lg flex items-center justify-center relative"
        style={{
          background: isSelected
            ? 'linear-gradient(135deg, #3a5030 0%, #2a3820 100%)'
            : 'linear-gradient(135deg, #3a3020 0%, #2a2015 100%)',
          border: `2px solid ${isSelected ? '#4a6040' : '#654321'}`,
          boxShadow: isSelected
            ? '0 0 20px rgba(0, 255, 0, 0.2), 0 4px 10px rgba(0,0,0,0.5)'
            : '0 4px 10px rgba(0,0,0,0.5)',
        }}
      >
        {getAgentIcon(agent.type, { size: 32 })}

        {/* Status indicator */}
        <div className="absolute -top-1 -right-1">
          {getStatusIcon(agent.status, { size: 14 })}
        </div>

        {/* Control group badge */}
        {agent.controlGroup && (
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold"
            style={{ border: '2px solid #4a90d9' }}
          >
            {agent.controlGroup}
          </div>
        )}

        {/* Health bar */}
        <div className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gray-800 rounded-full overflow-hidden mx-1">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${agent.health}%`,
              background: agent.health > 50 ? '#4CAF50' : agent.health > 25 ? '#FFC107' : '#F44336',
            }}
          />
        </div>
      </div>

      {/* Name label */}
      <div
        className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-1 rounded"
        style={{
          color: isSelected ? '#90EE90' : '#a0a0a0',
          background: 'rgba(0,0,0,0.5)',
        }}
      >
        {agent.name}
      </div>

      {/* Working indicator */}
      {isWorking && agent.currentTask && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs bg-blue-900/80 text-blue-200 whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {agent.currentTask.name.slice(0, 20)}...
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================================================
// Building Unit Component
// ============================================================================

interface BuildingUnitProps {
  building: Building
  isSelected: boolean
  onClick: (id: string, e: React.MouseEvent) => void
}

function BuildingUnit({ building, isSelected, onClick }: BuildingUnitProps) {
  return (
    <motion.div
      className={`
        absolute cursor-pointer
        ${isSelected ? 'z-20' : 'z-5'}
      `}
      style={{
        left: `${building.position.x}%`,
        top: `${building.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={(e) => onClick(building.id, e)}
      whileHover={{ scale: 1.05 }}
    >
      {/* Selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 -m-4 rounded-lg border-2 border-yellow-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1 }}
          style={{
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
          }}
        />
      )}

      {/* Building container */}
      <div
        className="w-20 h-20 rounded-lg flex items-center justify-center relative"
        style={{
          background: isSelected
            ? 'linear-gradient(135deg, #5a4a3a 0%, #3a2a20 100%)'
            : 'linear-gradient(135deg, #4a3a2a 0%, #2a1a10 100%)',
          border: `3px solid ${isSelected ? '#B8860B' : '#8B4513'}`,
          boxShadow: isSelected
            ? '0 0 25px rgba(255, 215, 0, 0.2), 0 6px 15px rgba(0,0,0,0.6)'
            : '0 6px 15px rgba(0,0,0,0.6)',
        }}
      >
        {getBuildingIcon(building.type, { size: 48 })}

        {/* Production queue indicator */}
        {building.productionQueue.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-600 text-white text-xs flex items-center justify-center font-bold border-2 border-yellow-400">
            {building.productionQueue.length}
          </div>
        )}
      </div>

      {/* Name label */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold px-2 py-0.5 rounded"
        style={{
          color: isSelected ? '#FFD700' : '#b0a090',
          background: 'rgba(0,0,0,0.6)',
        }}
      >
        {building.name}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Terrain Decorations
// ============================================================================

function TerrainDecorations() {
  // Generate some random decorative elements
  const trees = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    scale: 0.5 + Math.random() * 0.5,
  }))

  return (
    <>
      {trees.map(tree => (
        <div
          key={tree.id}
          className="absolute pointer-events-none opacity-30"
          style={{
            left: `${tree.x}%`,
            top: `${tree.y}%`,
            transform: `translate(-50%, -50%) scale(${tree.scale})`,
          }}
        >
          <svg viewBox="0 0 24 32" width={24} height={32} fill="#1a3a1a">
            <ellipse cx="12" cy="12" rx="10" ry="12" fill="#2a4a2a"/>
            <ellipse cx="12" cy="8" rx="7" ry="8" fill="#3a5a3a"/>
            <rect x="10" y="20" width="4" height="12" fill="#4a3020"/>
          </svg>
        </div>
      ))}
    </>
  )
}

// ============================================================================
// Help Modal
// ============================================================================

function HelpModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: '1-9', desc: 'Recall control group' },
    { key: 'Ctrl+1-9', desc: 'Set control group' },
    { key: 'C', desc: 'Train Villager (general agent)' },
    { key: 'S', desc: 'Train Scout (explore agent)' },
    { key: 'A', desc: 'Train Archer (surgical edit agent)' },
    { key: 'M', desc: 'Train Monk (code review agent)' },
    { key: '.', desc: 'Select next idle agent' },
    { key: 'Space', desc: 'Pause/Resume' },
    { key: 'Esc', desc: 'Clear selection' },
    { key: 'F1', desc: 'Toggle this help' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-lg p-6 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, #3a2820 0%, #2a1810 50%, #1a0f0a 100%)',
          border: '3px solid #8B4513',
          boxShadow: '0 0 60px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-yellow-200">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map(({ key, desc }) => (
            <div key={key} className="flex items-center gap-4">
              <kbd
                className="w-24 px-2 py-1 text-center font-mono text-sm rounded"
                style={{
                  background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
                  border: '1px solid #5a5a5a',
                  color: '#FFD700',
                  boxShadow: '0 2px 0 #1a1a1a',
                }}
              >
                {key}
              </kbd>
              <span className="text-gray-300">{desc}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700">
          <h3 className="text-lg font-bold text-yellow-200 mb-2">About</h3>
          <p className="text-gray-400 text-sm">
            This is an Age of Empires 2 style interface for orchestrating Claude Code agents.
            Train agents, assign them tasks, and manage your codebase like commanding an army!
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
