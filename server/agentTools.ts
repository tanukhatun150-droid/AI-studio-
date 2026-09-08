import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export interface ToolResult {
  success: boolean;
  tool: string;
  error?: string;
  [key: string]: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

const WORKSPACE_ROOT = process.cwd();

// Normalize and validate path safely within workspace
export function resolveSafePath(filePath: string): { fullPath: string; relPath: string; isSafe: boolean } {
  const clean = (filePath || '').trim().replace(/^[\/\\]+/, '');
  const fullPath = path.resolve(WORKSPACE_ROOT, clean);
  const isSafe = fullPath.startsWith(WORKSPACE_ROOT) && !clean.includes('..');
  const relPath = path.relative(WORKSPACE_ROOT, fullPath).replace(/\\/g, '/');
  return { fullPath, relPath, isSafe };
}

// 1. list_files
export async function listFilesTool(args: { directory?: string; recursive?: boolean }): Promise<ToolResult> {
  const dirInput = args.directory || '.';
  const { fullPath, relPath, isSafe } = resolveSafePath(dirInput);
  if (!isSafe) {
    return { success: false, tool: 'list_files', error: 'Access outside workspace root is denied.' };
  }

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    return { success: false, tool: 'list_files', error: `Directory not found: ${dirInput}` };
  }

  const recursive = args.recursive !== false;
  const items: Array<{ path: string; type: 'file' | 'directory'; size?: number }> = [];

  const scan = (currentDir: string, depth = 0) => {
    if (depth > 6) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === '.next') {
        continue;
      }
      const itemFullPath = path.join(currentDir, e.name);
      const itemRelPath = path.relative(WORKSPACE_ROOT, itemFullPath).replace(/\\/g, '/');

      if (e.isDirectory()) {
        items.push({ path: itemRelPath, type: 'directory' });
        if (recursive) {
          scan(itemFullPath, depth + 1);
        }
      } else {
        try {
          const stat = fs.statSync(itemFullPath);
          items.push({ path: itemRelPath, type: 'file', size: stat.size });
        } catch {
          items.push({ path: itemRelPath, type: 'file' });
        }
      }
    }
  };

  try {
    scan(fullPath, 0);
    return {
      success: true,
      tool: 'list_files',
      directory: relPath || '.',
      count: items.length,
      files: items.slice(0, 150),
    };
  } catch (err: unknown) {
    return { success: false, tool: 'list_files', error: err instanceof Error ? err.message : String(err) };
  }
}

// 2. read_file
export async function readFileTool(args: { path: string; start_line?: number; end_line?: number }): Promise<ToolResult> {
  const { fullPath, relPath, isSafe } = resolveSafePath(args.path);
  if (!isSafe) {
    return { success: false, tool: 'read_file', error: 'Access outside workspace root is denied.' };
  }

  if (!fs.existsSync(fullPath)) {
    return { success: false, tool: 'read_file', error: `File not found: ${args.path}` };
  }

  try {
    const rawContent = fs.readFileSync(fullPath, 'utf8');
    const allLines = rawContent.split('\n');
    const totalLines = allLines.length;

    let content = rawContent;
    let start = 1;
    let end = totalLines;

    if (typeof args.start_line === 'number' || typeof args.end_line === 'number') {
      start = Math.max(1, args.start_line || 1);
      end = Math.min(totalLines, args.end_line || totalLines);
      content = allLines.slice(start - 1, end).join('\n');
    }

    return {
      success: true,
      tool: 'read_file',
      path: relPath,
      content,
      lines: totalLines,
      range: `${start}-${end}`,
    };
  } catch (err: unknown) {
    return { success: false, tool: 'read_file', error: err instanceof Error ? err.message : String(err) };
  }
}

// 3. write_file
export async function writeFileTool(args: { path: string; content: string }): Promise<ToolResult> {
  const { fullPath, relPath, isSafe } = resolveSafePath(args.path);
  if (!isSafe) {
    return { success: false, tool: 'write_file', error: 'Access outside workspace root is denied.' };
  }
  if (typeof args.content !== 'string') {
    return { success: false, tool: 'write_file', error: 'Content must be a string.' };
  }

  try {
    const exists = fs.existsSync(fullPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, args.content, 'utf8');

    const lineCount = args.content.split('\n').length;
    return {
      success: true,
      tool: 'write_file',
      path: relPath,
      action: exists ? 'updated' : 'created',
      lines: lineCount,
    };
  } catch (err: unknown) {
    return { success: false, tool: 'write_file', error: err instanceof Error ? err.message : String(err) };
  }
}

// 4. create_file
export async function createFileTool(args: { path: string; content?: string; overwrite?: boolean }): Promise<ToolResult> {
  const { fullPath, relPath, isSafe } = resolveSafePath(args.path);
  if (!isSafe) {
    return { success: false, tool: 'create_file', error: 'Access outside workspace root is denied.' };
  }

  if (fs.existsSync(fullPath) && !args.overwrite) {
    return {
      success: false,
      tool: 'create_file',
      error: `File already exists at ${relPath}. Use write_file or edit_file to modify, or set overwrite: true.`,
    };
  }

  try {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    const content = args.content || '';
    fs.writeFileSync(fullPath, content, 'utf8');
    return {
      success: true,
      tool: 'create_file',
      path: relPath,
      action: 'created',
      lines: content ? content.split('\n').length : 0,
    };
  } catch (err: unknown) {
    return { success: false, tool: 'create_file', error: err instanceof Error ? err.message : String(err) };
  }
}

// 5. edit_file
export async function editFileTool(args: {
  path: string;
  target_content: string;
  replacement_content: string;
}): Promise<ToolResult> {
  const { fullPath, relPath, isSafe } = resolveSafePath(args.path);
  if (!isSafe) {
    return { success: false, tool: 'edit_file', error: 'Access outside workspace root is denied.' };
  }

  if (!fs.existsSync(fullPath)) {
    return { success: false, tool: 'edit_file', error: `File not found: ${args.path}` };
  }

  try {
    const existing = fs.readFileSync(fullPath, 'utf8');
    if (!existing.includes(args.target_content)) {
      // Normalize carriage returns and try again
      const normExisting = existing.replace(/\r\n/g, '\n');
      const normTarget = (args.target_content || '').replace(/\r\n/g, '\n');
      if (!normExisting.includes(normTarget)) {
        return {
          success: false,
          tool: 'edit_file',
          error: 'target_content was not found in the file. Please inspect the file with read_file first.',
        };
      }
      const updated = normExisting.replace(normTarget, (args.replacement_content || '').replace(/\r\n/g, '\n'));
      fs.writeFileSync(fullPath, updated, 'utf8');
      return {
        success: true,
        tool: 'edit_file',
        path: relPath,
        action: 'edited',
        lines: updated.split('\n').length,
      };
    }

    const updated = existing.replace(args.target_content, args.replacement_content || '');
    fs.writeFileSync(fullPath, updated, 'utf8');
    return {
      success: true,
      tool: 'edit_file',
      path: relPath,
      action: 'edited',
      lines: updated.split('\n').length,
    };
  } catch (err: unknown) {
    return { success: false, tool: 'edit_file', error: err instanceof Error ? err.message : String(err) };
  }
}

// 6. delete_file
export async function deleteFileTool(args: { path: string }): Promise<ToolResult> {
  const { fullPath, relPath, isSafe } = resolveSafePath(args.path);
  if (!isSafe) {
    return { success: false, tool: 'delete_file', error: 'Access outside workspace root is denied.' };
  }

  if (!fs.existsSync(fullPath)) {
    return { success: false, tool: 'delete_file', error: `File not found: ${args.path}` };
  }

  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    return {
      success: true,
      tool: 'delete_file',
      path: relPath,
      action: 'deleted',
    };
  } catch (err: unknown) {
    return { success: false, tool: 'delete_file', error: err instanceof Error ? err.message : String(err) };
  }
}

// 7. search_files
export async function searchFilesTool(args: {
  query: string;
  directory?: string;
  extension?: string;
}): Promise<ToolResult> {
  const query = args.query;
  if (!query) {
    return { success: false, tool: 'search_files', error: 'Query string is required.' };
  }

  const dirInput = args.directory || '.';
  const { fullPath, isSafe } = resolveSafePath(dirInput);
  if (!isSafe) {
    return { success: false, tool: 'search_files', error: 'Access outside workspace root is denied.' };
  }

  const matches: Array<{ file: string; line: number; text: string }> = [];
  const maxMatches = 50;

  const searchDir = (currentDir: string, depth = 0) => {
    if (depth > 6 || matches.length >= maxMatches) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const e of entries) {
      if (matches.length >= maxMatches) break;
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
      const full = path.join(currentDir, e.name);

      if (e.isDirectory()) {
        searchDir(full, depth + 1);
      } else {
        if (args.extension && !e.name.endsWith(args.extension)) continue;
        // Search text files
        if (/\.(tsx?|jsx?|css|html|json|md|txt|env|cjs|mjs|sh)$/i.test(e.name)) {
          try {
            const content = fs.readFileSync(full, 'utf8');
            const lines = content.split('\n');
            const rel = path.relative(WORKSPACE_ROOT, full).replace(/\\/g, '/');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(query)) {
                matches.push({
                  file: rel,
                  line: i + 1,
                  text: lines[i].trim().slice(0, 160),
                });
                if (matches.length >= maxMatches) break;
              }
            }
          } catch {
            // ignore binary/read errors
          }
        }
      }
    }
  };

  try {
    if (fs.existsSync(fullPath)) {
      searchDir(fullPath, 0);
    }
    return {
      success: true,
      tool: 'search_files',
      query,
      matchCount: matches.length,
      matches,
    };
  } catch (err: unknown) {
    return { success: false, tool: 'search_files', error: err instanceof Error ? err.message : String(err) };
  }
}

// 8. run_command
export async function runCommandTool(args: {
  command: string;
  cwd?: string;
  timeout_ms?: number;
}): Promise<ToolResult> {
  const cmd = (args.command || '').trim();
  if (!cmd) {
    return { success: false, tool: 'run_command', error: 'Command is required.' };
  }

  const cwdInput = args.cwd || '.';
  const { fullPath, isSafe } = resolveSafePath(cwdInput);
  const workingDir = isSafe && fs.existsSync(fullPath) ? fullPath : WORKSPACE_ROOT;

  // Safety filter for catastrophic system commands
  if (/rm\s+-rf\s+(\/|~|\/\*)/.test(cmd)) {
    return { success: false, tool: 'run_command', error: 'Dangerous root deletion command blocked.' };
  }

  const timeout = Math.min(args.timeout_ms || 25000, 45000);

  return new Promise((resolve) => {
    exec(
      cmd,
      {
        cwd: workingDir,
        timeout,
        maxBuffer: 1024 * 1024 * 2, // 2MB
        env: { ...process.env, CI: 'true' },
      },
      (error, stdout, stderr) => {
        const exitCode = error ? (error.code ?? 1) : 0;
        resolve({
          success: exitCode === 0,
          tool: 'run_command',
          command: cmd,
          stdout: (stdout || '').trim(),
          stderr: (stderr || '').trim(),
          exitCode: typeof exitCode === 'number' ? exitCode : 1,
        });
      }
    );
  });
}

// 9. get_project_structure
export async function getProjectStructureTool(args: { depth?: number }): Promise<ToolResult> {
  const maxDepth = Math.min(args.depth || 3, 4);

  const buildTree = (dir: string, depth = 0): string[] => {
    if (depth > maxDepth) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const lines: string[] = [];
    const indent = '  '.repeat(depth);

    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === '.next') {
        continue;
      }
      if (e.isDirectory()) {
        lines.push(`${indent}📁 ${e.name}/`);
        lines.push(...buildTree(path.join(dir, e.name), depth + 1));
      } else {
        lines.push(`${indent}📄 ${e.name}`);
      }
    }
    return lines;
  };

  try {
    const treeLines = buildTree(WORKSPACE_ROOT, 0);
    return {
      success: true,
      tool: 'get_project_structure',
      root: path.basename(WORKSPACE_ROOT),
      tree: treeLines.slice(0, 150).join('\n'),
      totalItems: treeLines.length,
    };
  } catch (err: unknown) {
    return { success: false, tool: 'get_project_structure', error: err instanceof Error ? err.message : String(err) };
  }
}

// 10. check_file_exists
export async function checkFileExistsTool(args: { path: string }): Promise<ToolResult> {
  const { fullPath, relPath, isSafe } = resolveSafePath(args.path);
  if (!isSafe) {
    return { success: false, tool: 'check_file_exists', error: 'Access outside workspace root is denied.' };
  }

  const exists = fs.existsSync(fullPath);
  let isDirectory = false;
  if (exists) {
    try {
      isDirectory = fs.statSync(fullPath).isDirectory();
    } catch {
      // ignore
    }
  }

  return {
    success: true,
    tool: 'check_file_exists',
    path: relPath,
    exists,
    isDirectory,
  };
}

// 11. get_file_info
export async function getFileInfoTool(args: { path: string }): Promise<ToolResult> {
  const { fullPath, relPath, isSafe } = resolveSafePath(args.path);
  if (!isSafe) {
    return { success: false, tool: 'get_file_info', error: 'Access outside workspace root is denied.' };
  }

  if (!fs.existsSync(fullPath)) {
    return { success: false, tool: 'get_file_info', error: `File not found: ${args.path}` };
  }

  try {
    const stat = fs.statSync(fullPath);
    let lineCount = 0;
    if (!stat.isDirectory()) {
      try {
        const text = fs.readFileSync(fullPath, 'utf8');
        lineCount = text.split('\n').length;
      } catch {
        // binary file
      }
    }

    return {
      success: true,
      tool: 'get_file_info',
      path: relPath,
      size: stat.size,
      lines: lineCount,
      isDirectory: stat.isDirectory(),
      modified: stat.mtime.toISOString(),
    };
  } catch (err: unknown) {
    return { success: false, tool: 'get_file_info', error: err instanceof Error ? err.message : String(err) };
  }
}

// Unified Tool Dispatcher
export async function executeAgentTool(name: string, args: Record<string, any>): Promise<ToolResult> {
  switch (name) {
    case 'list_files':
      return listFilesTool(args);
    case 'read_file':
      return readFileTool(args as { path: string; start_line?: number; end_line?: number });
    case 'write_file':
      return writeFileTool(args as { path: string; content: string });
    case 'create_file':
      return createFileTool(args as { path: string; content?: string; overwrite?: boolean });
    case 'edit_file':
      return editFileTool(args as { path: string; target_content: string; replacement_content: string });
    case 'delete_file':
      return deleteFileTool(args as { path: string });
    case 'search_files':
      return searchFilesTool(args as { query: string; directory?: string; extension?: string });
    case 'run_command':
      return runCommandTool(args as { command: string; cwd?: string; timeout_ms?: number });
    case 'get_project_structure':
      return getProjectStructureTool(args);
    case 'check_file_exists':
      return checkFileExistsTool(args as { path: string });
    case 'get_file_info':
      return getFileInfoTool(args as { path: string });
    default:
      return {
        success: false,
        tool: name,
        error: `Unknown tool: '${name}'. Available tools: list_files, read_file, write_file, create_file, edit_file, delete_file, search_files, run_command, get_project_structure, check_file_exists, get_file_info`,
      };
  }
}

// Gemini Native Function Declarations
export const AGENT_FUNCTION_DECLARATIONS: any[] = [
  {
    name: 'get_project_structure',
    description: 'Inspect the directory and file tree of the project to understand where components and files live.',
    parameters: {
      type: 'OBJECT',
      properties: {
        depth: { type: 'INTEGER', description: 'Depth of directories to traverse (default 3, max 4)' },
      },
    },
  },
  {
    name: 'list_files',
    description: 'List files and folders in a specified directory.',
    parameters: {
      type: 'OBJECT',
      properties: {
        directory: { type: 'STRING', description: 'Directory path to list, relative to workspace (e.g. src/components)' },
        recursive: { type: 'BOOLEAN', description: 'Whether to list subdirectories recursively' },
      },
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file in the workspace.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Path of the file to read (e.g. src/App.tsx)' },
        start_line: { type: 'INTEGER', description: 'Optional 1-indexed start line to read' },
        end_line: { type: 'INTEGER', description: 'Optional 1-indexed end line to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write complete content to a file in the workspace (creates file and parent folders if needed).',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Path of the file to write (e.g. src/components/LoginModal.tsx)' },
        content: { type: 'STRING', description: 'The complete file content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'create_file',
    description: 'Create a new file in the workspace. Returns error if file already exists unless overwrite is true.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Path of the new file' },
        content: { type: 'STRING', description: 'Optional initial file content' },
        overwrite: { type: 'BOOLEAN', description: 'Whether to overwrite if it already exists' },
      },
      required: ['path'],
    },
  },
  {
    name: 'edit_file',
    description: 'Perform an exact substring replacement in a file.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Path of the file to edit' },
        target_content: { type: 'STRING', description: 'Exact string in the existing file to replace' },
        replacement_content: { type: 'STRING', description: 'New replacement content' },
      },
      required: ['path', 'target_content', 'replacement_content'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the workspace.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Path of the file to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_files',
    description: 'Search for text or symbols across workspace source files.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'String to search for' },
        directory: { type: 'STRING', description: 'Directory to search inside' },
        extension: { type: 'STRING', description: 'Filter by extension (e.g. .tsx)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'run_command',
    description: 'Execute a bash terminal command in the workspace (e.g. npm run lint, npm test, git status, ls).',
    parameters: {
      type: 'OBJECT',
      properties: {
        command: { type: 'STRING', description: 'The bash command to run' },
        cwd: { type: 'STRING', description: 'Working directory (defaults to workspace root)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'check_file_exists',
    description: 'Check if a specific file or directory exists.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Path to check' },
      },
      required: ['path'],
    },
  },
  {
    name: 'get_file_info',
    description: 'Get metadata about a file (size, line count, last modified date).',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Path of the file' },
      },
      required: ['path'],
    },
  },
];
