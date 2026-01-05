import { NextRequest, NextResponse } from 'next/server'
import { agentManager } from '@/lib/agents/executor'

// ============================================================================
// GET /api/agents/[id] - Get agent details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params

  const agent = agentManager.get(agentId)
  if (!agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    id: agent.id,
    role: agent.config.role,
    task: agent.config.task,
    targetPath: agent.config.targetPath,
    status: agent.status,
    startTime: agent.startTime,
    endTime: agent.endTime,
    result: agent.result,
    events: agent.events,
  })
}

// ============================================================================
// DELETE /api/agents/[id] - Cancel agent
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params

  const cancelled = agentManager.cancel(agentId)
  if (!cancelled) {
    return NextResponse.json(
      { error: 'Agent not found or already completed' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    id: agentId,
    status: 'cancelled',
    message: 'Agent cancelled successfully',
  })
}
