import { NextRequest } from 'next/server'
import { agentManager } from '@/lib/agents/executor'

// ============================================================================
// GET /api/agents/[id]/stream - SSE stream for agent progress
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params

  const agent = agentManager.get(agentId)
  if (!agent) {
    return new Response(JSON.stringify({ error: 'Agent not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Helper to send SSE events
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Send initial status
      sendEvent({
        type: 'status',
        agentId,
        status: agent.status,
        eventsCount: agent.events.length,
      })

      // Subscribe to new events
      const unsubscribe = agentManager.subscribe(agentId, (event) => {
        try {
          sendEvent(event)

          // Close stream when agent completes
          if (event.type === 'complete' || event.type === 'error') {
            setTimeout(() => {
              controller.close()
            }, 100)
          }
        } catch {
          // Stream closed
        }
      })

      // Clean up on abort
      request.signal.addEventListener('abort', () => {
        unsubscribe()
        controller.close()
      })

      // If agent already completed, send final event and close
      if (agent.status !== 'running') {
        sendEvent({
          type: agent.status === 'completed' ? 'complete' : 'error',
          agentId,
          content: agent.result?.result || agent.result?.error || 'Unknown',
          tokensUsed: agent.result?.tokensUsed || 0,
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
