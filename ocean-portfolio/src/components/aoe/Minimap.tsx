'use client'

import { useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useOrchestrator } from '@/lib/aoe-store'
import type { CodebaseNode, Agent, Building } from '@/lib/aoe-types'

// ============================================================================
// Minimap Component (AoE2 Style Bottom-Left)
// ============================================================================

export default function Minimap() {
  const { state, selectAgents, selectBuildings } = useOrchestrator()

  // Calculate positions for codebase visualization
  const { nodes, maxDepth } = useMemo(() => {
    const flatNodes: { node: CodebaseNode; x: number; y: number; depth: number }[] = []
    let nodeIndex = 0

    function traverse(nodes: CodebaseNode[], depth: number, parentX: number) {
      nodes.forEach((node, i) => {
        const x = 10 + (nodeIndex * 15) % 80
        const y = 10 + depth * 20
        flatNodes.push({ node, x, y, depth })
        nodeIndex++
        if (node.children) {
          traverse(node.children, depth + 1, x)
        }
      })
    }

    traverse(state.codebase, 0, 50)
    return { nodes: flatNodes, maxDepth: Math.max(...flatNodes.map(n => n.depth)) }
  }, [state.codebase])

  const handleAgentClick = useCallback((agentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    selectAgents([agentId])
  }, [selectAgents])

  const handleBuildingClick = useCallback((buildingId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    selectBuildings([buildingId])
  }, [selectBuildings])

  return (
    <div
      className="fixed bottom-4 left-4 z-40"
      style={{
        width: '200px',
        height: '200px',
      }}
    >
      {/* Ornate frame */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #4a3728 0%, #2a1810 50%, #1a0f0a 100%)',
          border: '3px solid #8B4513',
          boxShadow: `
            inset 0 0 20px rgba(0,0,0,0.5),
            0 4px 20px rgba(0,0,0,0.5),
            0 0 0 1px #654321
          `,
        }}
      >
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-700 rounded-tl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-700 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-700 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-700 rounded-br" />
      </div>

      {/* Map content */}
      <div className="absolute inset-2 rounded overflow-hidden">
        {/* Terrain background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, #2d4a2d 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, #3d5a3d 0%, transparent 40%),
              radial-gradient(circle at 50% 80%, #1d3a1d 0%, transparent 60%),
              #1a2a1a
            `,
          }}
        />

        {/* Fog of war overlay for unexplored areas */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="fog" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="rgba(0,0,0,0.7)"/>
              <circle cx="2" cy="2" r="1" fill="rgba(0,0,0,0.9)"/>
            </pattern>
          </defs>

          {/* Codebase nodes */}
          {nodes.map(({ node, x, y }) => (
            <g key={node.id}>
              {/* Fog of war for unexplored nodes */}
              {!node.explored && (
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="8"
                  fill="rgba(0,0,0,0.8)"
                />
              )}
              {/* Node indicator */}
              <circle
                cx={`${x}%`}
                cy={`${y}%`}
                r={node.type === 'directory' ? 4 : 2}
                fill={
                  node.hasActivity
                    ? '#FFD700'
                    : node.explored
                    ? node.type === 'directory'
                      ? '#4A90D9'
                      : '#6B8E6B'
                    : '#333'
                }
                className={node.hasActivity ? 'animate-pulse' : ''}
              />
            </g>
          ))}
        </svg>

        {/* Buildings */}
        {state.buildings.map(building => (
          <motion.div
            key={building.id}
            className={`
              absolute w-4 h-4 cursor-pointer
              ${building.isSelected ? 'ring-2 ring-yellow-400' : ''}
            `}
            style={{
              left: `${building.position.x}%`,
              top: `${building.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => handleBuildingClick(building.id, e)}
            whileHover={{ scale: 1.2 }}
          >
            <div
              className="w-full h-full"
              style={{
                background: getBuildingColor(building.type),
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 0 4px rgba(0,0,0,0.5)',
              }}
            />
          </motion.div>
        ))}

        {/* Agents */}
        {state.agents.map(agent => (
          <motion.div
            key={agent.id}
            className={`
              absolute cursor-pointer
              ${state.selection.agents.includes(agent.id) ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
            `}
            style={{
              left: `${agent.position.x}%`,
              top: `${agent.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => handleAgentClick(agent.id, e)}
            animate={{
              x: agent.status === 'moving' ? [0, 2, 0, -2, 0] : 0,
            }}
            transition={{
              repeat: agent.status === 'moving' ? Infinity : 0,
              duration: 0.5,
            }}
          >
            <AgentDot agent={agent} />
          </motion.div>
        ))}
      </div>

      {/* Minimap label */}
      <div
        className="absolute -top-6 left-0 px-2 py-0.5 text-xs font-bold text-yellow-200 uppercase tracking-wider"
        style={{
          background: 'linear-gradient(90deg, #2a1810 0%, transparent 100%)',
        }}
      >
        Codebase
      </div>
    </div>
  )
}

// ============================================================================
// Agent Dot Component
// ============================================================================

function AgentDot({ agent }: { agent: Agent }) {
  const color = getAgentColor(agent.type)
  const isActive = agent.status === 'working' || agent.status === 'attacking'

  return (
    <div className="relative">
      <motion.div
        className="w-3 h-3 rounded-full"
        style={{
          background: color,
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: isActive
            ? `0 0 6px ${color}, 0 0 12px ${color}`
            : '0 0 2px rgba(0,0,0,0.5)',
        }}
        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />
      {/* Control group number */}
      {agent.controlGroup && (
        <div
          className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold"
          style={{ border: '1px solid white' }}
        >
          {agent.controlGroup}
        </div>
      )}
      {/* Status indicator */}
      {agent.status === 'idle' && (
        <motion.div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      )}
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function getAgentColor(type: Agent['type']): string {
  const colors = {
    villager: '#4A90D9',
    scout: '#90EE90',
    archer: '#FF6B6B',
    knight: '#DDA0DD',
    monk: '#FFD700',
    siege: '#FF8C00',
  }
  return colors[type]
}

function getBuildingColor(type: Building['type']): string {
  const colors = {
    'town-center': '#8B4513',
    barracks: '#696969',
    'archery-range': '#228B22',
    stable: '#D2691E',
    monastery: '#FFD700',
    'siege-workshop': '#4A4A4A',
    castle: '#808080',
    university: '#DEB887',
  }
  return colors[type]
}
