// ============================================================================
// Client-side Agent API
// ============================================================================

export type AgentRole = 'explorer' | 'editor' | 'reviewer' | 'tester' | 'general'

export interface SpawnAgentParams {
  task: string
  role: AgentRole
  targetPath?: string
}

export interface AgentStatus {
  id: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  role: AgentRole
  task: string
  tokensUsed: number
  iterations: number
}

export interface AgentEvent {
  type: 'thinking' | 'tool_use' | 'tool_result' | 'message' | 'complete' | 'error' | 'status'
  agentId: string
  content: string
  toolName?: string
  toolInput?: Record<string, unknown>
  tokensUsed?: number
  iteration?: number
}

// ============================================================================
// API Functions
// ============================================================================

export async function spawnAgent(params: SpawnAgentParams): Promise<{ id: string }> {
  const response = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to spawn agent')
  }

  return response.json()
}

export async function listAgents(): Promise<{ agents: AgentStatus[] }> {
  const response = await fetch('/api/agents')

  if (!response.ok) {
    throw new Error('Failed to list agents')
  }

  return response.json()
}

export async function getAgent(agentId: string): Promise<AgentStatus & { events: AgentEvent[] }> {
  const response = await fetch(`/api/agents/${agentId}`)

  if (!response.ok) {
    throw new Error('Failed to get agent')
  }

  return response.json()
}

export async function cancelAgent(agentId: string): Promise<void> {
  const response = await fetch(`/api/agents/${agentId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to cancel agent')
  }
}

// ============================================================================
// SSE Stream Subscription
// ============================================================================

export function subscribeToAgent(
  agentId: string,
  onEvent: (event: AgentEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const eventSource = new EventSource(`/api/agents/${agentId}/stream`)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as AgentEvent
      onEvent(data)
    } catch (error) {
      console.error('Failed to parse event:', error)
    }
  }

  eventSource.onerror = (error) => {
    console.error('SSE error:', error)
    if (onError) {
      onError(new Error('Connection lost'))
    }
    eventSource.close()
  }

  // Return cleanup function
  return () => {
    eventSource.close()
  }
}

// ============================================================================
// Helper: Map agent type to role
// ============================================================================

export function agentTypeToRole(type: string): AgentRole {
  const mapping: Record<string, AgentRole> = {
    villager: 'general',
    scout: 'explorer',
    archer: 'editor',
    knight: 'editor',
    monk: 'reviewer',
    siege: 'editor',
  }
  return mapping[type] || 'general'
}
