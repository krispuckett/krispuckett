import { NextRequest, NextResponse } from 'next/server'
import { agentManager, AgentRole } from '@/lib/agents/executor'

// ============================================================================
// POST /api/agents - Spawn a new agent
// ============================================================================

interface SpawnRequest {
  task: string
  role: AgentRole
  targetPath?: string
  workingDirectory?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SpawnRequest = await request.json()

    if (!body.task) {
      return NextResponse.json(
        { error: 'Task is required' },
        { status: 400 }
      )
    }

    // Generate unique agent ID
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Default working directory to the project root
    const workingDirectory = body.workingDirectory || process.cwd()

    // Spawn the agent
    await agentManager.spawn({
      id: agentId,
      role: body.role || 'general',
      task: body.task,
      targetPath: body.targetPath,
      workingDirectory,
    })

    return NextResponse.json({
      id: agentId,
      status: 'running',
      message: 'Agent spawned successfully',
    })
  } catch (error) {
    console.error('Error spawning agent:', error)
    return NextResponse.json(
      { error: 'Failed to spawn agent' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/agents - List all agents
// ============================================================================

export async function GET() {
  try {
    const agents = agentManager.list()

    return NextResponse.json({
      agents: agents.map(agent => ({
        id: agent.id,
        role: agent.config.role,
        task: agent.config.task,
        status: agent.status,
        startTime: agent.startTime,
        endTime: agent.endTime,
        tokensUsed: agent.result?.tokensUsed || 0,
        iterations: agent.result?.iterations || 0,
        eventsCount: agent.events.length,
      })),
    })
  } catch (error) {
    console.error('Error listing agents:', error)
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 }
    )
  }
}
