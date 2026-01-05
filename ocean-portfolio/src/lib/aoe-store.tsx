'use client'

import { createContext, useContext, useReducer, useCallback, useRef, ReactNode } from 'react'
import type {
  OrchestratorState,
  OrchestratorEvent,
  Agent,
  Task,
  AgentType,
  AgentSpecialization,
  Resources,
  Building,
  Notification,
  CodebaseNode,
} from './aoe-types'
import { spawnAgent as spawnRealAgent, subscribeToAgent, agentTypeToRole } from './agents/client'
import type { AgentEvent } from './agents/client'

// ============================================================================
// Initial State
// ============================================================================

const initialResources: Resources = {
  tokens: 100000,
  maxTokens: 100000,
  activeAgents: 0,
  maxAgents: 10,
  completedTasks: 0,
  failedTasks: 0,
}

const initialCodebase: CodebaseNode[] = [
  {
    id: 'root',
    name: 'src',
    type: 'directory',
    path: '/src',
    explored: true,
    hasActivity: false,
    children: [
      {
        id: 'app',
        name: 'app',
        type: 'directory',
        path: '/src/app',
        explored: true,
        hasActivity: false,
        children: [
          { id: 'layout', name: 'layout.tsx', type: 'file', path: '/src/app/layout.tsx', explored: true, hasActivity: false },
          { id: 'page', name: 'page.tsx', type: 'file', path: '/src/app/page.tsx', explored: true, hasActivity: false },
          { id: 'globals', name: 'globals.css', type: 'file', path: '/src/app/globals.css', explored: true, hasActivity: false },
        ],
      },
      {
        id: 'components',
        name: 'components',
        type: 'directory',
        path: '/src/components',
        explored: true,
        hasActivity: false,
        children: [
          { id: 'cmd-k', name: 'CommandK.tsx', type: 'file', path: '/src/components/CommandK.tsx', explored: true, hasActivity: false },
          { id: 'ocean', name: 'OceanCanvas.tsx', type: 'file', path: '/src/components/OceanCanvas.tsx', explored: true, hasActivity: false },
          { id: 'nav', name: 'Navigation.tsx', type: 'file', path: '/src/components/Navigation.tsx', explored: false, hasActivity: false },
        ],
      },
      {
        id: 'lib',
        name: 'lib',
        type: 'directory',
        path: '/src/lib',
        explored: false,
        hasActivity: false,
        children: [],
      },
      {
        id: 'hooks',
        name: 'hooks',
        type: 'directory',
        path: '/src/hooks',
        explored: false,
        hasActivity: false,
        children: [],
      },
    ],
  },
]

const initialBuildings: Building[] = [
  {
    id: 'tc-1',
    type: 'town-center',
    name: 'Main Base',
    position: { x: 50, y: 50 },
    health: 100,
    productionQueue: [],
    isSelected: false,
  },
  {
    id: 'barracks-1',
    type: 'barracks',
    name: 'Code Barracks',
    position: { x: 30, y: 60 },
    health: 100,
    productionQueue: [],
    isSelected: false,
  },
  {
    id: 'stable-1',
    type: 'stable',
    name: 'Scout Stable',
    position: { x: 70, y: 40 },
    health: 100,
    productionQueue: [],
    isSelected: false,
  },
]

const initialState: OrchestratorState = {
  resources: initialResources,
  agents: [],
  buildings: initialBuildings,
  tasks: [],
  codebase: initialCodebase,
  selection: { agents: [], buildings: [], type: 'none' },
  controlGroups: Array.from({ length: 9 }, (_, i) => ({ number: i + 1, agentIds: [] })),
  isPaused: false,
  gameSpeed: 1,
  notifications: [],
}

// ============================================================================
// Helpers
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getAgentName(type: AgentType, index: number): string {
  const names: Record<AgentType, string[]> = {
    villager: ['Claude', 'Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara'],
    scout: ['Scout Alpha', 'Scout Bravo', 'Recon', 'Pathfinder', 'Explorer'],
    archer: ['Sniper', 'Precision', 'Surgical', 'Pinpoint', 'Sharpshot'],
    knight: ['Heavy', 'Crusher', 'Demolisher', 'Titan', 'Juggernaut'],
    monk: ['Reviewer', 'Healer', 'Guardian', 'Mentor', 'Sage'],
    siege: ['Siege', 'Destroyer', 'Rewriter', 'Architect', 'Rebuilder'],
  }
  return names[type][index % names[type].length]
}

function getAgentSpecFromType(type: AgentType): AgentSpecialization {
  const map: Record<AgentType, AgentSpecialization> = {
    villager: 'general-purpose',
    scout: 'explore',
    archer: 'general-purpose',
    knight: 'general-purpose',
    monk: 'code-review',
    siege: 'general-purpose',
  }
  return map[type]
}

// ============================================================================
// Reducer
// ============================================================================

function orchestratorReducer(
  state: OrchestratorState,
  event: OrchestratorEvent
): OrchestratorState {
  switch (event.type) {
    case 'SPAWN_AGENT': {
      if (state.resources.activeAgents >= state.resources.maxAgents) {
        return {
          ...state,
          notifications: [
            ...state.notifications,
            {
              id: generateId(),
              type: 'warning',
              message: 'Maximum agents reached!',
              timestamp: Date.now(),
              read: false,
              sound: 'error',
            },
          ],
        }
      }

      const newAgent: Agent = {
        id: generateId(),
        name: getAgentName(event.agentType, state.agents.length),
        type: event.agentType,
        specialization: event.specialization || getAgentSpecFromType(event.agentType),
        status: 'idle',
        health: 100,
        experience: 0,
        position: {
          x: 50 + Math.random() * 10 - 5,
          y: 50 + Math.random() * 10 - 5,
        },
        createdAt: Date.now(),
        tokensUsed: 0,
      }

      return {
        ...state,
        agents: [...state.agents, newAgent],
        resources: {
          ...state.resources,
          activeAgents: state.resources.activeAgents + 1,
        },
        notifications: [
          ...state.notifications,
          {
            id: generateId(),
            type: 'info',
            message: `${newAgent.name} has joined the battle!`,
            timestamp: Date.now(),
            read: false,
          },
        ],
      }
    }

    case 'ASSIGN_TASK': {
      const agent = state.agents.find(a => a.id === event.agentId)
      if (!agent || agent.status !== 'idle') return state

      const newTask: Task = {
        id: generateId(),
        ...event.task,
        status: 'in_progress',
        createdAt: Date.now(),
        startedAt: Date.now(),
        assignedAgent: event.agentId,
        actualTokens: 0,
      }

      return {
        ...state,
        agents: state.agents.map(a =>
          a.id === event.agentId
            ? { ...a, status: 'working' as const, currentTask: newTask }
            : a
        ),
        tasks: [...state.tasks, newTask],
      }
    }

    case 'SELECT_AGENTS': {
      return {
        ...state,
        selection: {
          agents: event.agentIds,
          buildings: [],
          type: event.agentIds.length > 0 ? 'agents' : 'none',
        },
        buildings: state.buildings.map(b => ({ ...b, isSelected: false })),
      }
    }

    case 'SELECT_BUILDINGS': {
      return {
        ...state,
        selection: {
          agents: [],
          buildings: event.buildingIds,
          type: event.buildingIds.length > 0 ? 'buildings' : 'none',
        },
        buildings: state.buildings.map(b => ({
          ...b,
          isSelected: event.buildingIds.includes(b.id),
        })),
      }
    }

    case 'CLEAR_SELECTION': {
      return {
        ...state,
        selection: { agents: [], buildings: [], type: 'none' },
        buildings: state.buildings.map(b => ({ ...b, isSelected: false })),
      }
    }

    case 'SET_CONTROL_GROUP': {
      return {
        ...state,
        controlGroups: state.controlGroups.map(cg =>
          cg.number === event.number
            ? { ...cg, agentIds: event.agentIds }
            : cg
        ),
        agents: state.agents.map(a =>
          event.agentIds.includes(a.id)
            ? { ...a, controlGroup: event.number }
            : a.controlGroup === event.number
            ? { ...a, controlGroup: undefined }
            : a
        ),
      }
    }

    case 'RECALL_CONTROL_GROUP': {
      const group = state.controlGroups.find(cg => cg.number === event.number)
      if (!group || group.agentIds.length === 0) return state

      return {
        ...state,
        selection: {
          agents: group.agentIds,
          buildings: [],
          type: 'agents',
        },
      }
    }

    case 'UPDATE_AGENT': {
      return {
        ...state,
        agents: state.agents.map(a =>
          a.id === event.agentId ? { ...a, ...event.updates } : a
        ),
      }
    }

    case 'UPDATE_TASK': {
      const updatedTasks = state.tasks.map(t =>
        t.id === event.taskId ? { ...t, ...event.updates } : t
      )

      // If task completed, update agent
      const task = updatedTasks.find(t => t.id === event.taskId)
      let updatedAgents = state.agents
      let updatedResources = state.resources

      if (task && event.updates.status === 'completed' && task.assignedAgent) {
        updatedAgents = state.agents.map(a =>
          a.id === task.assignedAgent
            ? {
                ...a,
                status: 'idle' as const,
                currentTask: undefined,
                experience: a.experience + 1,
                tokensUsed: a.tokensUsed + (task.actualTokens || 0),
              }
            : a
        )
        updatedResources = {
          ...state.resources,
          completedTasks: state.resources.completedTasks + 1,
          tokens: state.resources.tokens - (task.actualTokens || 0),
        }
      }

      if (task && event.updates.status === 'failed' && task.assignedAgent) {
        updatedAgents = state.agents.map(a =>
          a.id === task.assignedAgent
            ? { ...a, status: 'idle' as const, currentTask: undefined }
            : a
        )
        updatedResources = {
          ...state.resources,
          failedTasks: state.resources.failedTasks + 1,
        }
      }

      return {
        ...state,
        tasks: updatedTasks,
        agents: updatedAgents,
        resources: updatedResources,
      }
    }

    case 'CANCEL_TASK': {
      const task = state.tasks.find(t => t.id === event.taskId)
      if (!task) return state

      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === event.taskId ? { ...t, status: 'cancelled' as const } : t
        ),
        agents: task.assignedAgent
          ? state.agents.map(a =>
              a.id === task.assignedAgent
                ? { ...a, status: 'idle' as const, currentTask: undefined }
                : a
            )
          : state.agents,
      }
    }

    case 'PAUSE': {
      return { ...state, isPaused: true }
    }

    case 'RESUME': {
      return { ...state, isPaused: false }
    }

    case 'SET_SPEED': {
      return { ...state, gameSpeed: event.speed }
    }

    case 'ADD_NOTIFICATION': {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: generateId(),
            ...event.notification,
            timestamp: Date.now(),
            read: false,
          },
        ],
      }
    }

    case 'DISMISS_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== event.notificationId),
      }
    }

    case 'EXPLORE_NODE': {
      const exploreNode = (nodes: CodebaseNode[]): CodebaseNode[] => {
        return nodes.map(node => {
          if (node.id === event.nodeId) {
            return { ...node, explored: true }
          }
          if (node.children) {
            return { ...node, children: exploreNode(node.children) }
          }
          return node
        })
      }
      return {
        ...state,
        codebase: exploreNode(state.codebase),
      }
    }

    default:
      return state
  }
}

// ============================================================================
// Context
// ============================================================================

interface OrchestratorContextType {
  state: OrchestratorState
  dispatch: (event: OrchestratorEvent) => void
  // Convenience actions
  spawnAgent: (type: AgentType, specialization?: AgentSpecialization) => void
  selectAgents: (ids: string[]) => void
  selectBuildings: (ids: string[]) => void
  clearSelection: () => void
  setControlGroup: (num: number) => void
  recallControlGroup: (num: number) => void
  assignTask: (agentId: string, task: Omit<Task, 'id' | 'createdAt' | 'status' | 'assignedAgent' | 'actualTokens'>) => void
  assignRealTask: (agentId: string, task: { name: string; description: string; targetFile?: string; targetDirectory?: string }) => Promise<void>
  completeTask: (taskId: string, result: string, tokensUsed: number) => void
  failTask: (taskId: string, error: string) => void
  getSelectedAgents: () => Agent[]
  getIdleAgents: () => Agent[]
}

const OrchestratorContext = createContext<OrchestratorContextType | null>(null)

// ============================================================================
// Provider
// ============================================================================

export function OrchestratorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orchestratorReducer, initialState)

  const spawnAgent = useCallback((type: AgentType, specialization?: AgentSpecialization) => {
    dispatch({
      type: 'SPAWN_AGENT',
      agentType: type,
      specialization: specialization || getAgentSpecFromType(type),
    })
  }, [])

  const selectAgents = useCallback((ids: string[]) => {
    dispatch({ type: 'SELECT_AGENTS', agentIds: ids })
  }, [])

  const selectBuildings = useCallback((ids: string[]) => {
    dispatch({ type: 'SELECT_BUILDINGS', buildingIds: ids })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }, [])

  const setControlGroup = useCallback((num: number) => {
    dispatch({
      type: 'SET_CONTROL_GROUP',
      number: num,
      agentIds: state.selection.agents,
    })
  }, [state.selection.agents])

  const recallControlGroup = useCallback((num: number) => {
    dispatch({ type: 'RECALL_CONTROL_GROUP', number: num })
  }, [])

  // Store for SSE cleanup functions
  const sseCleanups = useRef<Map<string, () => void>>(new Map())

  const assignTask = useCallback((
    agentId: string,
    task: Omit<Task, 'id' | 'createdAt' | 'status' | 'assignedAgent' | 'actualTokens'>
  ) => {
    dispatch({
      type: 'ASSIGN_TASK',
      agentId,
      task: { ...task, actualTokens: 0 },
    })
  }, [])

  // Assign a REAL task using the Claude Agent API
  const assignRealTask = useCallback(async (
    agentId: string,
    task: {
      name: string
      description: string
      targetFile?: string
      targetDirectory?: string
    }
  ) => {
    const agent = state.agents.find(a => a.id === agentId)
    if (!agent) return

    // Create task in local state
    const taskId = `task-${Date.now()}`
    dispatch({
      type: 'ASSIGN_TASK',
      agentId,
      task: {
        name: task.name,
        description: task.description,
        priority: 'normal',
        estimatedTokens: 2000,
        progress: 0,
        targetFile: task.targetFile,
        targetDirectory: task.targetDirectory,
        actualTokens: 0,
      },
    })

    try {
      // Spawn real agent via API
      const response = await spawnRealAgent({
        task: task.description,
        role: agentTypeToRole(agent.type),
        targetPath: task.targetFile || task.targetDirectory,
      })

      // Subscribe to progress updates via SSE
      const cleanup = subscribeToAgent(
        response.id,
        (event: AgentEvent) => {
          // Update task progress based on events
          if (event.type === 'thinking' && event.iteration) {
            dispatch({
              type: 'UPDATE_TASK',
              taskId,
              updates: {
                progress: Math.min(90, event.iteration * 10),
              },
            })
          }

          if (event.type === 'complete') {
            dispatch({
              type: 'UPDATE_TASK',
              taskId,
              updates: {
                status: 'completed',
                result: event.content,
                actualTokens: event.tokensUsed || 0,
                progress: 100,
                completedAt: Date.now(),
              },
            })
            dispatch({
              type: 'ADD_NOTIFICATION',
              notification: {
                type: 'success',
                message: `${agent.name} completed: ${task.name}`,
                sound: 'task-complete',
              },
            })
            // Clean up SSE connection
            cleanup()
            sseCleanups.current.delete(response.id)
          }

          if (event.type === 'error') {
            dispatch({
              type: 'UPDATE_TASK',
              taskId,
              updates: {
                status: 'failed',
                error: event.content,
                completedAt: Date.now(),
              },
            })
            dispatch({
              type: 'ADD_NOTIFICATION',
              notification: {
                type: 'error',
                message: `${agent.name} failed: ${event.content}`,
                sound: 'error',
              },
            })
            cleanup()
            sseCleanups.current.delete(response.id)
          }
        },
        (error) => {
          console.error('SSE error:', error)
          dispatch({
            type: 'UPDATE_TASK',
            taskId,
            updates: {
              status: 'failed',
              error: 'Connection lost',
              completedAt: Date.now(),
            },
          })
        }
      )

      // Store cleanup function
      sseCleanups.current.set(response.id, cleanup)

    } catch (error) {
      dispatch({
        type: 'UPDATE_TASK',
        taskId,
        updates: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Failed to spawn agent',
          completedAt: Date.now(),
        },
      })
    }
  }, [state.agents])

  const completeTask = useCallback((taskId: string, result: string, tokensUsed: number) => {
    dispatch({
      type: 'UPDATE_TASK',
      taskId,
      updates: {
        status: 'completed',
        result,
        actualTokens: tokensUsed,
        progress: 100,
        completedAt: Date.now(),
      },
    })
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        type: 'success',
        message: 'Task completed!',
        sound: 'task-complete',
      },
    })
  }, [])

  const failTask = useCallback((taskId: string, error: string) => {
    dispatch({
      type: 'UPDATE_TASK',
      taskId,
      updates: {
        status: 'failed',
        error,
        completedAt: Date.now(),
      },
    })
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        type: 'error',
        message: `Task failed: ${error}`,
        sound: 'error',
      },
    })
  }, [])

  const getSelectedAgents = useCallback(() => {
    return state.agents.filter(a => state.selection.agents.includes(a.id))
  }, [state.agents, state.selection.agents])

  const getIdleAgents = useCallback(() => {
    return state.agents.filter(a => a.status === 'idle')
  }, [state.agents])

  return (
    <OrchestratorContext.Provider
      value={{
        state,
        dispatch,
        spawnAgent,
        selectAgents,
        selectBuildings,
        clearSelection,
        setControlGroup,
        recallControlGroup,
        assignTask,
        assignRealTask,
        completeTask,
        failTask,
        getSelectedAgents,
        getIdleAgents,
      }}
    >
      {children}
    </OrchestratorContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useOrchestrator() {
  const context = useContext(OrchestratorContext)
  if (!context) {
    throw new Error('useOrchestrator must be used within an OrchestratorProvider')
  }
  return context
}
