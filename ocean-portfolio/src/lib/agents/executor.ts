import Anthropic from '@anthropic-ai/sdk'
import { AGENT_TOOLS, executeTool } from './tools'

// ============================================================================
// Agent Executor - Runs the agentic loop
// ============================================================================

export type AgentRole = 'explorer' | 'editor' | 'reviewer' | 'tester' | 'general'

export interface AgentConfig {
  id: string
  role: AgentRole
  task: string
  targetPath?: string
  workingDirectory: string
  maxIterations?: number
  onProgress?: (event: ProgressEvent) => void
}

export interface ProgressEvent {
  type: 'thinking' | 'tool_use' | 'tool_result' | 'message' | 'complete' | 'error'
  agentId: string
  content: string
  toolName?: string
  toolInput?: Record<string, unknown>
  tokensUsed?: number
  iteration?: number
}

export interface AgentResult {
  success: boolean
  result: string
  tokensUsed: number
  iterations: number
  error?: string
}

// System prompts for different agent roles
const SYSTEM_PROMPTS: Record<AgentRole, string> = {
  explorer: `You are an expert code explorer. Your job is to understand and map out codebases.
When exploring:
- Start by listing the directory structure
- Read key files like package.json, README, and main entry points
- Identify patterns, frameworks, and architecture
- Summarize what you find clearly

Always be thorough but efficient. Don't read every file - focus on understanding the structure and key components.`,

  editor: `You are an expert code editor. Your job is to make precise, surgical edits to code.
When editing:
- First read the file to understand the context
- Make minimal changes - only what's necessary
- Preserve existing code style and patterns
- Test your changes if possible (run linters, type checks)
- Explain what you changed and why

Be careful and precise. Avoid unnecessary changes.`,

  reviewer: `You are an expert code reviewer. Your job is to analyze code for issues and improvements.
When reviewing:
- Look for bugs, security issues, and performance problems
- Check for code style and best practices
- Identify potential edge cases
- Suggest improvements with specific examples

Be constructive and specific. Explain the impact of issues you find.`,

  tester: `You are an expert at testing code. Your job is to run tests and validate code works correctly.
When testing:
- Run existing tests using npm test or similar
- Check for test coverage gaps
- Validate edge cases
- Report results clearly

Focus on ensuring the code works as expected.`,

  general: `You are a helpful coding assistant. You can explore code, make edits, run tests, and more.
Use the tools available to complete the task. Be thorough but efficient.`,
}

export class AgentExecutor {
  private client: Anthropic
  private config: AgentConfig
  private tokensUsed: number = 0
  private iteration: number = 0

  constructor(config: AgentConfig) {
    this.client = new Anthropic()
    this.config = config

    // Set working directory for tools
    process.env.AGENT_WORKING_DIR = config.workingDirectory
  }

  async run(): Promise<AgentResult> {
    const maxIterations = this.config.maxIterations || 20

    // Build the initial prompt
    const userPrompt = this.buildPrompt()

    this.emit({
      type: 'thinking',
      agentId: this.config.id,
      content: `Starting task: ${this.config.task}`,
    })

    // Initial messages
    let messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userPrompt },
    ]

    try {
      // Agentic loop
      while (this.iteration < maxIterations) {
        this.iteration++

        this.emit({
          type: 'thinking',
          agentId: this.config.id,
          content: `Iteration ${this.iteration}/${maxIterations}`,
          iteration: this.iteration,
        })

        // Call Claude
        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: SYSTEM_PROMPTS[this.config.role],
          tools: AGENT_TOOLS as Anthropic.Tool[],
          messages,
        })

        // Track token usage
        this.tokensUsed += response.usage.input_tokens + response.usage.output_tokens

        // Process response
        const assistantContent: Anthropic.ContentBlock[] = []
        let hasToolUse = false
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of response.content) {
          assistantContent.push(block)

          if (block.type === 'text') {
            this.emit({
              type: 'message',
              agentId: this.config.id,
              content: block.text,
              tokensUsed: this.tokensUsed,
            })
          } else if (block.type === 'tool_use') {
            hasToolUse = true

            this.emit({
              type: 'tool_use',
              agentId: this.config.id,
              content: `Using tool: ${block.name}`,
              toolName: block.name,
              toolInput: block.input as Record<string, unknown>,
            })

            // Execute the tool
            const result = await executeTool(block.name, block.input as Record<string, unknown>)

            this.emit({
              type: 'tool_result',
              agentId: this.config.id,
              content: result.success
                ? result.output.slice(0, 500) + (result.output.length > 500 ? '...' : '')
                : `Error: ${result.error}`,
              toolName: block.name,
            })

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result.success ? result.output : `Error: ${result.error}`,
              is_error: !result.success,
            })
          }
        }

        // Add assistant message to history
        messages.push({ role: 'assistant', content: assistantContent })

        // If there were tool uses, add results and continue
        if (hasToolUse) {
          messages.push({ role: 'user', content: toolResults })
        }

        // Check if we're done
        if (response.stop_reason === 'end_turn' && !hasToolUse) {
          // Extract final message
          const finalText = response.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('\n')

          this.emit({
            type: 'complete',
            agentId: this.config.id,
            content: 'Task completed',
            tokensUsed: this.tokensUsed,
            iteration: this.iteration,
          })

          return {
            success: true,
            result: finalText,
            tokensUsed: this.tokensUsed,
            iterations: this.iteration,
          }
        }
      }

      // Max iterations reached
      return {
        success: false,
        result: 'Task incomplete - max iterations reached',
        tokensUsed: this.tokensUsed,
        iterations: this.iteration,
        error: 'Max iterations reached',
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      this.emit({
        type: 'error',
        agentId: this.config.id,
        content: errorMessage,
      })

      return {
        success: false,
        result: '',
        tokensUsed: this.tokensUsed,
        iterations: this.iteration,
        error: errorMessage,
      }
    }
  }

  private buildPrompt(): string {
    let prompt = this.config.task

    if (this.config.targetPath) {
      prompt += `\n\nTarget: ${this.config.targetPath}`
    }

    prompt += `\n\nWorking directory: ${this.config.workingDirectory}`

    return prompt
  }

  private emit(event: ProgressEvent): void {
    if (this.config.onProgress) {
      this.config.onProgress(event)
    }
  }
}

// ============================================================================
// Agent Manager - Tracks all running agents
// ============================================================================

interface RunningAgent {
  id: string
  config: AgentConfig
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: number
  endTime?: number
  result?: AgentResult
  events: ProgressEvent[]
}

class AgentManager {
  private agents: Map<string, RunningAgent> = new Map()
  private eventSubscribers: Map<string, ((event: ProgressEvent) => void)[]> = new Map()

  async spawn(config: Omit<AgentConfig, 'onProgress'>): Promise<string> {
    const agent: RunningAgent = {
      id: config.id,
      config: config as AgentConfig,
      status: 'running',
      startTime: Date.now(),
      events: [],
    }

    this.agents.set(config.id, agent)

    // Create executor with progress callback
    const executor = new AgentExecutor({
      ...config,
      onProgress: (event) => {
        agent.events.push(event)
        this.notifySubscribers(config.id, event)
      },
    })

    // Run in background
    executor.run().then(result => {
      agent.status = result.success ? 'completed' : 'failed'
      agent.endTime = Date.now()
      agent.result = result

      this.notifySubscribers(config.id, {
        type: result.success ? 'complete' : 'error',
        agentId: config.id,
        content: result.success ? result.result : result.error || 'Unknown error',
        tokensUsed: result.tokensUsed,
      })
    }).catch(error => {
      agent.status = 'failed'
      agent.endTime = Date.now()
      agent.result = {
        success: false,
        result: '',
        tokensUsed: 0,
        iterations: 0,
        error: error.message,
      }
    })

    return config.id
  }

  subscribe(agentId: string, callback: (event: ProgressEvent) => void): () => void {
    if (!this.eventSubscribers.has(agentId)) {
      this.eventSubscribers.set(agentId, [])
    }
    this.eventSubscribers.get(agentId)!.push(callback)

    // Send existing events
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.events.forEach(callback)
    }

    // Return unsubscribe function
    return () => {
      const subscribers = this.eventSubscribers.get(agentId)
      if (subscribers) {
        const index = subscribers.indexOf(callback)
        if (index > -1) {
          subscribers.splice(index, 1)
        }
      }
    }
  }

  private notifySubscribers(agentId: string, event: ProgressEvent): void {
    const subscribers = this.eventSubscribers.get(agentId)
    if (subscribers) {
      subscribers.forEach(callback => callback(event))
    }
  }

  get(agentId: string): RunningAgent | undefined {
    return this.agents.get(agentId)
  }

  list(): RunningAgent[] {
    return Array.from(this.agents.values())
  }

  cancel(agentId: string): boolean {
    const agent = this.agents.get(agentId)
    if (agent && agent.status === 'running') {
      agent.status = 'cancelled'
      agent.endTime = Date.now()
      return true
    }
    return false
  }
}

// Singleton instance
export const agentManager = new AgentManager()
