import { GoogleGenAI } from '@google/genai';
import {
  executeAgentTool,
  AGENT_FUNCTION_DECLARATIONS,
  ToolResult,
} from './agentTools';

export interface AgentExecutionStep {
  step: number;
  tool: string;
  args: Record<string, any>;
  result: ToolResult;
  summary: string;
  durationMs: number;
}

export interface AgentRunResult {
  reply: string;
  modelUsed: string;
  provider: string;
  filesModified: Array<{ path: string; action: string; lines?: number }>;
  autoRefreshPreview: boolean;
  toolSteps: AgentExecutionStep[];
  iterations: number;
  completed: boolean;
}

const SYSTEM_INSTRUCTION_AGENT = `You are an elite Autonomous Senior AI Coding Agent with direct access to this project's real filesystem and bash terminal.

CRITICAL DIRECTIVES:
1. YOU ARE NOT JUST A CHATBOT. Do NOT dump huge multi-page raw code files into the chat bubble!
2. You MUST ACTUALLY INSPECT AND MODIFY the project using your tools:
   - Use 'get_project_structure' or 'list_files' to discover files.
   - Use 'read_file' to inspect existing code before changing it.
   - Use 'write_file', 'create_file', or 'edit_file' to ACTUALLY APPLY code changes to the workspace.
   - Use 'run_command' to run linters ('npm run lint' or 'npx tsc --noEmit'), check git status, or test.
3. WORKFLOW FOR CODING TASKS:
   Step A: Understand the user request.
   Step B: Inspect relevant project files (read_file).
   Step C: Plan and apply surgical or complete code changes (write_file / edit_file / create_file).
   Step D: Validate with run_command (e.g. npm run lint) if you touched code. If errors arise, fix them!
   Step E: Provide a crisp, friendly final summary of what was accomplished, what files changed, and how it works.
4. TONE & COMMUNICATION:
   - Talk naturally like a top-tier peer developer. If the user writes in Hindi or Hinglish, speak in clean, natural, peer-developer Hinglish/Hindi.
   - Never say "I cannot access files" or "I am an AI without access". You have full tool access to the workspace.
   - Start multi-step operations with a concise <thinking>...</thinking> block analyzing the architecture.
5. If the user explicitly asks for a download or zip, inform them the project zip is always synced and ready at /api/workspace/zip.`;

// Parse any text-based tool calls if the model emits them as text
function parseTextToolCalls(text: string): Array<{ name: string; args: Record<string, any>; raw: string }> {
  const calls: Array<{ name: string; args: Record<string, any>; raw: string }> = [];

  // Pattern 1: <tool_call>{"name": "...", "arguments": {...}}</tool_call>
  const tagRegex = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const name = parsed.name || parsed.tool;
      const args = parsed.arguments || parsed.parameters || parsed.args || {};
      if (name) {
        calls.push({ name, args, raw: match[0] });
      }
    } catch {
      // ignore parse errors
    }
  }

  // Pattern 2: ```tool:read_file\n{...}\n```
  const fenceRegex = /```(?:tool:([a-zA-Z0-9_-]+)|json:tool)\s*[\r\n]+([\s\S]*?)```/gi;
  while ((match = fenceRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[2].trim());
      const name = match[1] || parsed.name || parsed.tool;
      const args = parsed.arguments || parsed.parameters || parsed.args || parsed;
      if (name) {
        calls.push({ name, args, raw: match[0] });
      }
    } catch {
      // ignore
    }
  }

  return calls;
}

export async function runAgentLoop(params: {
  apiKey: string;
  modelId?: string;
  userMessage: string;
  history?: Array<{ role: string; content: string }>;
  agentPersona?: { name?: string; role?: string; systemPrompt?: string };
  language?: string;
  maxIterations?: number;
}): Promise<AgentRunResult> {
  const {
    apiKey,
    modelId = 'gemini-3.8-flash',
    userMessage,
    history = [],
    agentPersona,
    language = 'auto',
    maxIterations = 10,
  } = params;

  const ai = new GoogleGenAI({ apiKey });

  const filesModifiedMap = new Map<string, { path: string; action: string; lines?: number }>();
  const toolSteps: AgentExecutionStep[] = [];

  let systemInstruction = SYSTEM_INSTRUCTION_AGENT;
  if (agentPersona?.systemPrompt) {
    systemInstruction += `\n\n[Active Persona: ${agentPersona.name || 'Engineer'} - ${agentPersona.role || 'Generalist'}]:\n${agentPersona.systemPrompt}`;
  }

  if (language && language !== 'auto') {
    systemInstruction += `\n\n[Language Preference]: Respond naturally in ${language}.`;
  }

  // Build initial contents
  const contents: any[] = [];

  // Add conversation history
  for (const h of history.slice(-6)) {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    });
  }

  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  let iterations = 0;
  let finalReply = '';
  let modelUsed = 'gemini-3.8-flash';
  let isDone = false;

  // Candidate models fallback
  const modelsToTry = [
    modelId.includes('gemini') ? modelId : 'gemini-3.8-flash',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ];
  const uniqueModels = Array.from(new Set(modelsToTry));

  while (iterations < maxIterations && !isDone) {
    iterations++;
    const stepStartTime = Date.now();

    let response: any = null;
    let successfulModel = '';

    for (const m of uniqueModels) {
      try {
        response = await ai.models.generateContent({
          model: m,
          contents,
          config: {
            systemInstruction,
            temperature: 0.2, // low temp for accurate tool arguments
            tools: [{ functionDeclarations: AGENT_FUNCTION_DECLARATIONS }],
          },
        });
        successfulModel = m;
        break;
      } catch (err: unknown) {
        console.warn(`[Agent Loop] Model ${m} attempt failed on iteration ${iterations}:`, err instanceof Error ? err.message : err);
      }
    }

    if (!response) {
      finalReply = `⚠️ All agent models failed to respond on iteration ${iterations}. Please verify your API key or try again.`;
      break;
    }

    modelUsed = successfulModel || modelUsed;

    // Check for native function calls
    const functionCalls = response.functionCalls || [];
    const responseText = response.text || '';

    // Check for text-based tool calls if no native function calls were produced
    const textCalls = functionCalls.length === 0 ? parseTextToolCalls(responseText) : [];

    // If neither native nor text tool calls exist, the AI has concluded its turn!
    if (functionCalls.length === 0 && textCalls.length === 0) {
      finalReply = responseText;
      isDone = true;
      break;
    }

    // Execute native function calls
    if (functionCalls.length > 0) {
      // Append the model's response (with function call parts) to conversation
      const candidateContent = response.candidates?.[0]?.content;
      if (candidateContent) {
        contents.push(candidateContent);
      } else {
        contents.push({
          role: 'model',
          parts: functionCalls.map((fc: any) => ({ functionCall: fc })),
        });
      }

      const responseParts: any[] = [];

      for (const fc of functionCalls) {
        const toolName = fc.name;
        const toolArgs = fc.args || {};

        const toolStart = Date.now();
        console.log(`[Agent Loop #${iterations}] Executing tool: ${toolName}`, toolArgs);
        const result = await executeAgentTool(toolName, toolArgs);
        const duration = Date.now() - toolStart;

        // Record step
        toolSteps.push({
          step: iterations,
          tool: toolName,
          args: toolArgs,
          result,
          summary: generateToolSummary(toolName, toolArgs, result),
          durationMs: duration,
        });

        // Record file modifications
        trackFileModifications(toolName, toolArgs, result, filesModifiedMap);

        responseParts.push({
          functionResponse: {
            name: toolName,
            response: result,
          },
        });
      }

      // Feed function responses back to Gemini
      contents.push({
        role: 'user',
        parts: responseParts,
      });
      continue;
    }

    // Execute text-based tool calls (fallback for text-emitted tool calls)
    if (textCalls.length > 0) {
      contents.push({
        role: 'model',
        parts: [{ text: responseText }],
      });

      const toolResultsFeedback: string[] = [];

      for (const tc of textCalls) {
        const toolStart = Date.now();
        console.log(`[Agent Loop #${iterations} (Text)] Executing tool: ${tc.name}`, tc.args);
        const result = await executeAgentTool(tc.name, tc.args);
        const duration = Date.now() - toolStart;

        toolSteps.push({
          step: iterations,
          tool: tc.name,
          args: tc.args,
          result,
          summary: generateToolSummary(tc.name, tc.args, result),
          durationMs: duration,
        });

        trackFileModifications(tc.name, tc.args, result, filesModifiedMap);

        toolResultsFeedback.push(
          `<tool_result tool="${tc.name}">\n${JSON.stringify(result, null, 2)}\n</tool_result>`
        );
      }

      contents.push({
        role: 'user',
        parts: [
          {
            text: `Tool Execution Results:\n${toolResultsFeedback.join('\n\n')}\n\nContinue with next steps or provide final answer.`,
          },
        ],
      });
      continue;
    }
  }

  // Ensure we have a friendly final reply if loop reached limit
  if (!finalReply.trim()) {
    const lastContent = contents[contents.length - 1];
    if (lastContent?.role === 'model' && lastContent.parts?.[0]?.text) {
      finalReply = lastContent.parts[0].text;
    } else {
      finalReply = `I have completed the operations across ${iterations} steps. Check the tool steps log for detailed execution output.`;
    }
  }

  // Format action badges for any modified files so the UI displays them cleanly
  const filesModifiedList = Array.from(filesModifiedMap.values());
  let enrichedReply = finalReply;

  // If files were modified and reply doesn't mention them, add clean Action Badges
  for (const f of filesModifiedList) {
    const badgeTag = `[ACTION_BADGE:${f.action}:${f.path}:${f.lines || 1}]`;
    if (!enrichedReply.includes(badgeTag) && !enrichedReply.includes(`[ACTION_BADGE:`)) {
      enrichedReply = `${badgeTag}\n` + enrichedReply;
    }
  }

  return {
    reply: enrichedReply,
    modelUsed,
    provider: 'Autonomous AI Agent',
    filesModified: filesModifiedList,
    autoRefreshPreview: filesModifiedList.length > 0,
    toolSteps,
    iterations,
    completed: isDone || iterations < maxIterations,
  };
}

function generateToolSummary(toolName: string, args: any, result: ToolResult): string {
  if (!result.success) {
    return `❌ ${toolName} failed: ${result.error || 'Unknown error'}`;
  }

  switch (toolName) {
    case 'get_project_structure':
      return `📂 Inspected project structure (${result.totalItems || 0} items)`;
    case 'list_files':
      return `📁 Listed ${result.count || 0} files in ${args.directory || '.'}`;
    case 'read_file':
      return `📖 Read file '${args.path}' (${result.lines || 0} lines)`;
    case 'write_file':
      return `✏️ ${result.action === 'created' ? 'Created' : 'Updated'} file '${args.path}' (${result.lines || 0} lines)`;
    case 'create_file':
      return `✨ Created new file '${args.path}'`;
    case 'edit_file':
      return `📝 Surgically edited '${args.path}'`;
    case 'delete_file':
      return `🗑️ Deleted '${args.path}'`;
    case 'search_files':
      return `🔍 Found ${result.matchCount || 0} matches for '${args.query}'`;
    case 'run_command':
      return `⚡ Executed \`${args.command}\` (exit code: ${result.exitCode})`;
    case 'check_file_exists':
      return `🔎 Checked '${args.path}': ${result.exists ? 'Found' : 'Not found'}`;
    case 'get_file_info':
      return `ℹ️ File info for '${args.path}': ${result.size} bytes, ${result.lines} lines`;
    default:
      return `⚙️ Tool ${toolName} completed successfully`;
  }
}

function trackFileModifications(
  toolName: string,
  args: any,
  result: ToolResult,
  map: Map<string, { path: string; action: string; lines?: number }>
) {
  if (!result.success) return;

  if (toolName === 'write_file' || toolName === 'create_file' || toolName === 'edit_file') {
    const pathKey = result.path || args.path;
    if (pathKey) {
      const action =
        result.action === 'created'
          ? 'Created'
          : result.action === 'edited'
          ? 'Edited'
          : 'Updated';
      map.set(pathKey, {
        path: pathKey,
        action,
        lines: result.lines,
      });
    }
  } else if (toolName === 'delete_file') {
    const pathKey = result.path || args.path;
    if (pathKey) {
      map.set(pathKey, {
        path: pathKey,
        action: 'Deleted',
      });
    }
  }
}
