export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatAttachment {
  name: string;
  uri?: string;
  mimeType?: string;
  size?: number;
  content?: string;
  dataUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  modelId?: string;
  attachment?: ChatAttachment;
  agentPersona?: string;
}

export interface Model {
  id: string;
  name: string;
  detail: string;
  badge?: string;
  provider: string;
  description: string;
}

export interface AgentPersona {
  id: string;
  name: string;
  initials: string;
  tint: string;
  role: string;
  status: 'Active' | 'Idle' | 'Busy';
  active?: boolean;
  systemPrompt: string;
}

export interface WorkspaceTool {
  id: string;
  iconName: string;
  label: string;
  detail: string;
  description: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  content?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  progress: number;
  detail: string;
  status: 'in_progress' | 'completed' | 'queued';
  items: TaskItem[];
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'stack' | 'architecture' | 'preference' | 'note';
}

export interface TerminalLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp: string;
  cwd?: string;
  exitCode?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: Message[];
  agentId?: string;
  modelId?: string;
}
