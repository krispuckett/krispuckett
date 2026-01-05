// ============================================================================
// Age of Empires 2 Style Agent Orchestrator - Core Types
// ============================================================================

// Resource types - what agents consume
export interface Resources {
  tokens: number          // API tokens available
  maxTokens: number       // Maximum token budget
  activeAgents: number    // Currently running agents
  maxAgents: number       // Maximum concurrent agents
  completedTasks: number  // Tasks completed this session
  failedTasks: number     // Tasks that failed
}

// Agent status - maps to unit states in AoE2
export type AgentStatus =
  | 'idle'           // Waiting for orders (like idle villager)
  | 'working'        // Actively processing (gathering/building)
  | 'moving'         // Transitioning between tasks
  | 'attacking'      // Aggressively solving a problem
  | 'defending'      // Reviewing/validating code
  | 'dead'           // Agent terminated/crashed

// Agent types - different unit classes
export type AgentType =
  | 'villager'       // General purpose agent - does everything
  | 'scout'          // Explorer agent - fast codebase navigation
  | 'archer'         // Ranged agent - makes surgical changes
  | 'knight'         // Heavy agent - large refactors
  | 'monk'           // Healer agent - fixes bugs, reviews code
  | 'siege'          // Siege agent - destroys/rewrites entire systems

// Agent specialization
export type AgentSpecialization =
  | 'general-purpose'
  | 'explore'
  | 'plan'
  | 'code-review'
  | 'test-runner'
  | 'documentation'

// Individual agent instance
export interface Agent {
  id: string
  name: string
  type: AgentType
  specialization: AgentSpecialization
  status: AgentStatus
  health: number          // 0-100, represents remaining capability
  experience: number      // Tasks completed successfully
  position: { x: number; y: number }  // Position on minimap
  currentTask?: Task
  controlGroup?: number   // 1-9 for hotkey selection
  createdAt: number
  tokensUsed: number
}

// Building types - agent spawners
export type BuildingType =
  | 'town-center'    // Main base - spawns villagers (general agents)
  | 'barracks'       // Spawns infantry (code agents)
  | 'archery-range'  // Spawns archers (surgical edit agents)
  | 'stable'         // Spawns cavalry (fast exploration agents)
  | 'monastery'      // Spawns monks (code review agents)
  | 'siege-workshop' // Spawns siege (heavy refactor agents)
  | 'castle'         // Advanced agents, hero units
  | 'university'     // Research/upgrades

// Building instance
export interface Building {
  id: string
  type: BuildingType
  name: string
  position: { x: number; y: number }
  health: number
  productionQueue: Task[]
  rallyPoint?: { x: number; y: number }
  isSelected: boolean
}

// Task priority
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'

// Task status
export type TaskStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

// Task instance - what agents work on
export interface Task {
  id: string
  name: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  progress: number        // 0-100
  assignedAgent?: string  // Agent ID
  estimatedTokens: number
  actualTokens: number
  targetFile?: string     // File being worked on
  targetDirectory?: string
  createdAt: number
  startedAt?: number
  completedAt?: number
  result?: string
  error?: string
}

// Codebase structure for minimap
export interface CodebaseNode {
  id: string
  name: string
  type: 'directory' | 'file'
  path: string
  children?: CodebaseNode[]
  explored: boolean       // Fog of war - has been visited
  hasActivity: boolean    // Agent currently working here
  lastModified?: number
}

// Selection state
export interface Selection {
  agents: string[]        // Selected agent IDs
  buildings: string[]     // Selected building IDs
  type: 'agents' | 'buildings' | 'mixed' | 'none'
}

// Control group
export interface ControlGroup {
  number: number          // 1-9
  agentIds: string[]
}

// Command types
export type CommandType =
  | 'move'               // Move to location
  | 'explore'            // Explore directory
  | 'edit'               // Edit file
  | 'review'             // Review code
  | 'test'               // Run tests
  | 'build'              // Build project
  | 'stop'               // Stop current task
  | 'attack'             // Aggressively fix issue
  | 'patrol'             // Monitor directory for changes

// Command instance
export interface Command {
  type: CommandType
  target?: { x: number; y: number } | string  // Location or file path
  shift?: boolean         // Queue command
}

// Game/orchestrator state
export interface OrchestratorState {
  resources: Resources
  agents: Agent[]
  buildings: Building[]
  tasks: Task[]
  codebase: CodebaseNode[]
  selection: Selection
  controlGroups: ControlGroup[]
  isPaused: boolean
  gameSpeed: number       // 1x, 2x, etc.
  notifications: Notification[]
}

// Notification (like AoE2 alerts)
export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' | 'idle'
  message: string
  timestamp: number
  read: boolean
  sound?: 'villager-idle' | 'task-complete' | 'error' | 'attack'
}

// Event types for the orchestrator
export type OrchestratorEvent =
  | { type: 'SPAWN_AGENT'; agentType: AgentType; specialization: AgentSpecialization }
  | { type: 'ASSIGN_TASK'; agentId: string; task: Omit<Task, 'id' | 'createdAt' | 'status'> }
  | { type: 'SELECT_AGENTS'; agentIds: string[] }
  | { type: 'SELECT_BUILDINGS'; buildingIds: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_CONTROL_GROUP'; number: number; agentIds: string[] }
  | { type: 'RECALL_CONTROL_GROUP'; number: number }
  | { type: 'ISSUE_COMMAND'; command: Command }
  | { type: 'CANCEL_TASK'; taskId: string }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'UPDATE_AGENT'; agentId: string; updates: Partial<Agent> }
  | { type: 'UPDATE_TASK'; taskId: string; updates: Partial<Task> }
  | { type: 'ADD_NOTIFICATION'; notification: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'DISMISS_NOTIFICATION'; notificationId: string }
  | { type: 'EXPLORE_NODE'; nodeId: string }
