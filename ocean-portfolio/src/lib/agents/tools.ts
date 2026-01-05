import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import { glob } from 'glob'

const execAsync = promisify(exec)

// ============================================================================
// Tool Definitions for Claude API
// ============================================================================

export interface ToolDefinition {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file at the specified path. Returns the file contents as a string.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The absolute or relative path to the file to read',
        },
        offset: {
          type: 'number',
          description: 'Line number to start reading from (1-indexed). Optional.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of lines to read. Optional.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Creates the file if it does not exist, overwrites if it does.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path where the file should be written',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Make a surgical edit to a file by replacing a specific string with another string.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to edit',
        },
        old_string: {
          type: 'string',
          description: 'The exact string to find and replace',
        },
        new_string: {
          type: 'string',
          description: 'The string to replace it with',
        },
      },
      required: ['path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'bash',
    description: 'Execute a bash command and return its output. Use for running tests, git commands, npm scripts, etc.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds. Defaults to 30000 (30 seconds).',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'glob',
    description: 'Find files matching a glob pattern. Returns a list of matching file paths.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The glob pattern to match (e.g., "**/*.ts", "src/**/*.tsx")',
        },
        cwd: {
          type: 'string',
          description: 'The directory to search in. Defaults to current working directory.',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'grep',
    description: 'Search for a pattern in files. Returns matching lines with file paths and line numbers.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The regex pattern to search for',
        },
        path: {
          type: 'string',
          description: 'File or directory to search in. Defaults to current directory.',
        },
        include: {
          type: 'string',
          description: 'Glob pattern for files to include (e.g., "*.ts")',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'list_directory',
    description: 'List the contents of a directory, showing files and subdirectories.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The directory path to list',
        },
      },
      required: ['path'],
    },
  },
]

// ============================================================================
// Tool Implementations
// ============================================================================

export interface ToolResult {
  success: boolean
  output: string
  error?: string
}

// Get the base working directory (the project root)
function getWorkingDirectory(): string {
  return process.env.AGENT_WORKING_DIR || process.cwd()
}

// Resolve a path relative to the working directory
function resolvePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath
  }
  return path.join(getWorkingDirectory(), filePath)
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'read_file':
        return await readFile(input as { path: string; offset?: number; limit?: number })

      case 'write_file':
        return await writeFile(input as { path: string; content: string })

      case 'edit_file':
        return await editFile(input as { path: string; old_string: string; new_string: string })

      case 'bash':
        return await runBash(input as { command: string; timeout?: number })

      case 'glob':
        return await runGlob(input as { pattern: string; cwd?: string })

      case 'grep':
        return await runGrep(input as { pattern: string; path?: string; include?: string })

      case 'list_directory':
        return await listDirectory(input as { path: string })

      default:
        return { success: false, output: '', error: `Unknown tool: ${toolName}` }
    }
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function readFile(input: { path: string; offset?: number; limit?: number }): Promise<ToolResult> {
  const filePath = resolvePath(input.path)

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\n')

    const offset = input.offset ? input.offset - 1 : 0
    const limit = input.limit || lines.length
    const selectedLines = lines.slice(offset, offset + limit)

    // Add line numbers
    const numberedLines = selectedLines.map((line, i) => `${offset + i + 1}: ${line}`)

    return { success: true, output: numberedLines.join('\n') }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { success: false, output: '', error: `File not found: ${input.path}` }
    }
    throw error
  }
}

async function writeFile(input: { path: string; content: string }): Promise<ToolResult> {
  const filePath = resolvePath(input.path)

  // Ensure directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true })

  await fs.writeFile(filePath, input.content, 'utf-8')

  return { success: true, output: `Successfully wrote ${input.content.length} characters to ${input.path}` }
}

async function editFile(input: { path: string; old_string: string; new_string: string }): Promise<ToolResult> {
  const filePath = resolvePath(input.path)

  const content = await fs.readFile(filePath, 'utf-8')

  if (!content.includes(input.old_string)) {
    return {
      success: false,
      output: '',
      error: `Could not find the string to replace in ${input.path}. Make sure the old_string matches exactly.`,
    }
  }

  // Count occurrences
  const occurrences = content.split(input.old_string).length - 1
  if (occurrences > 1) {
    return {
      success: false,
      output: '',
      error: `Found ${occurrences} occurrences of the string. Please provide more context to make it unique.`,
    }
  }

  const newContent = content.replace(input.old_string, input.new_string)
  await fs.writeFile(filePath, newContent, 'utf-8')

  return { success: true, output: `Successfully edited ${input.path}` }
}

async function runBash(input: { command: string; timeout?: number }): Promise<ToolResult> {
  const timeout = input.timeout || 30000
  const cwd = getWorkingDirectory()

  try {
    const { stdout, stderr } = await execAsync(input.command, {
      timeout,
      cwd,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    })

    const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '')
    return { success: true, output: output || '(no output)' }
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message: string }
    return {
      success: false,
      output: execError.stdout || '',
      error: execError.stderr || execError.message,
    }
  }
}

async function runGlob(input: { pattern: string; cwd?: string }): Promise<ToolResult> {
  const cwd = input.cwd ? resolvePath(input.cwd) : getWorkingDirectory()

  const matches = await glob(input.pattern, {
    cwd,
    nodir: false,
    ignore: ['node_modules/**', '.git/**'],
  })

  if (matches.length === 0) {
    return { success: true, output: 'No files matched the pattern.' }
  }

  return { success: true, output: matches.join('\n') }
}

async function runGrep(input: { pattern: string; path?: string; include?: string }): Promise<ToolResult> {
  const searchPath = input.path ? resolvePath(input.path) : getWorkingDirectory()

  // Build grep command
  let command = `grep -rn --color=never`
  if (input.include) {
    command += ` --include="${input.include}"`
  }
  command += ` "${input.pattern}" "${searchPath}"`
  command += ' 2>/dev/null || true' // Don't fail on no matches

  try {
    const { stdout } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    })

    if (!stdout.trim()) {
      return { success: true, output: 'No matches found.' }
    }

    // Limit output to first 100 matches
    const lines = stdout.trim().split('\n')
    const limited = lines.slice(0, 100)
    const output = limited.join('\n') + (lines.length > 100 ? `\n... and ${lines.length - 100} more matches` : '')

    return { success: true, output }
  } catch (error) {
    return { success: true, output: 'No matches found.' }
  }
}

async function listDirectory(input: { path: string }): Promise<ToolResult> {
  const dirPath = resolvePath(input.path)

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    const formatted = entries.map(entry => {
      const prefix = entry.isDirectory() ? '[DIR]  ' : '[FILE] '
      return prefix + entry.name
    })

    return { success: true, output: formatted.join('\n') }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { success: false, output: '', error: `Directory not found: ${input.path}` }
    }
    throw error
  }
}
