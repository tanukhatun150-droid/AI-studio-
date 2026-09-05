import { AgentPersona, MemoryItem, Model, WorkspaceFile, WorkspaceTask, WorkspaceTool } from '../types';

export const initialModels: Model[] = [
  {
    id: 'groq',
    name: 'Groq',
    detail: 'Llama 3 / Mixtral',
    badge: 'Ultra Fast',
    provider: 'Groq LPU',
    description: 'Near-instantaneous token generation optimized for rapid iteration and code completion.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    detail: 'Google AI',
    badge: 'Recommended',
    provider: 'Google AI',
    description: 'Highly capable multimodal reasoning model for coding, analysis, and agentic workflows.',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    detail: 'Local models',
    badge: 'Local',
    provider: 'Localhost',
    description: 'Self-hosted inference running local deep learning weights on device.',
  },
  {
    id: 'kimi',
    name: 'Kimi',
    detail: 'Long context',
    badge: '2M Tokens',
    provider: 'Moonshot AI',
    description: 'Massive context window specialized in large codebases and complex repository analysis.',
  },
];

export const initialAgents: AgentPersona[] = [
  {
    id: 'architect',
    name: 'Architect',
    initials: 'AR',
    tint: '#fbbc04',
    role: 'System Architecture & Data Modeling',
    status: 'Idle',
    active: false,
    systemPrompt: 'You are the Architect. Focus on high-level system topology, schemas, and contract interfaces.',
  },
  {
    id: 'frontend',
    name: 'Frontend',
    initials: 'FE',
    tint: '#34a853',
    role: 'Component Design & Touch Interactions',
    status: 'Active',
    active: true,
    systemPrompt: 'You are the Frontend Specialist. Craft clean, pixel-perfect, accessible React UI with fluid animations.',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    initials: 'RV',
    tint: '#a8c7fa',
    role: 'Code Quality, Tests & Security Audit',
    status: 'Idle',
    active: false,
    systemPrompt: 'You are the Reviewer. Critique proposed changes, spot security vulnerabilities, and enforce quality.',
  },
];

export const initialWorkspaceTools: WorkspaceTool[] = [
  {
    id: 'packages',
    iconName: 'Package',
    label: 'Packages',
    detail: 'npm / pip',
    description: 'Manage the packages available to this workspace.',
  },
  {
    id: 'postgres',
    iconName: 'Database',
    label: 'PostgreSQL',
    detail: 'Database',
    description: 'Connect persistent PostgreSQL data to your workspace.',
  },
  {
    id: 'deploy',
    iconName: 'Cloud',
    label: 'Deploy',
    detail: 'Publish',
    description: 'Prepare this workspace to publish when your build is ready.',
  },
  {
    id: 'github-connect',
    iconName: 'FolderGit2',
    label: 'GitHub Connect',
    detail: 'OAuth & PAT',
    description: 'Connect your real GitHub account to browse repositories, clone, and push.',
  },
  {
    id: 'github-import',
    iconName: 'GitBranch',
    label: 'Import from GitHub',
    detail: 'Repository',
    description: 'Bring a GitHub repository into this workspace.',
  },
  {
    id: 'github-push',
    iconName: 'GitPullRequest',
    label: 'GitHub Push',
    detail: 'Sync',
    description: 'Send workspace changes back to a connected GitHub repository.',
  },
  {
    id: 'terminal',
    iconName: 'Terminal',
    label: 'Terminal',
    detail: 'Commands',
    description: 'Run workspace commands and inspect their output.',
  },
  {
    id: 'preview',
    iconName: 'Monitor',
    label: 'Preview',
    detail: 'Running',
    description: 'Open the running preview of the app you are building.',
  },
];

export const initialWorkspaceFiles: WorkspaceFile[] = [
  {
    id: 'file-1',
    name: 'index.tsx',
    path: 'artifacts/ai-agent-home-mobile/app/index.tsx',
    type: 'file',
    size: 54054,
    content: `// Primary AI Agent Home UI mobile screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function HomeScreen() {
  // Model picker, composer, sheet drawer, tasks & memory
  return (
    <View style={styles.screen}>
      <HomeOverview colors={colors} />
    </View>
  );
}`,
  },
  {
    id: 'file-2',
    name: 'colors.ts',
    path: 'artifacts/ai-agent-home-mobile/constants/colors.ts',
    type: 'file',
    size: 1067,
    content: `export const colors = {
  background: '#111216',
  foreground: '#e3e3e3',
  card: '#1e1f20',
  cardForeground: '#e3e3e3',
  primary: '#a8c7fa',
  primaryForeground: '#07111f',
  secondary: '#282a2c',
  secondaryForeground: '#e3e3e3',
  muted: '#282a2c',
  mutedForeground: '#8e918f',
  accent: '#3b82f6',
  border: '#333538',
  input: '#282a2c',
};`,
  },
  {
    id: 'file-3',
    name: 'AuthShell.tsx',
    path: 'artifacts/ai-agent-home-mobile/components/AuthShell.tsx',
    type: 'file',
    size: 7811,
    content: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}`,
  },
  {
    id: 'file-4',
    name: 'package.json',
    path: 'artifacts/ai-agent-home-mobile/package.json',
    type: 'file',
    size: 1420,
    content: `{
  "name": "@workspace/ai-agent-home-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react-native": "0.76.0"
  }
}`,
  },
  {
    id: 'file-5',
    name: 'app.json',
    path: 'artifacts/ai-agent-home-mobile/app.json',
    type: 'file',
    size: 980,
    content: `{
  "expo": {
    "name": "AI Agent Home",
    "slug": "ai-agent-home-mobile",
    "scheme": "ai-agent-home",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark"
  }
}`,
  },
  {
    id: 'file-6',
    name: 'workspace',
    path: 'artifacts/api-server/src/routes/workspace.ts',
    type: 'file',
    size: 2029,
    content: `import { Router } from "express";
import { readWorkspaceFiles } from "../lib/workspace";

const router = Router();
router.get("/workspace/files", (req, res) => {
  res.json({ files: readWorkspaceFiles(), root: "ai-agent-home-mobile" });
});
export default router;`,
  },
  {
    id: 'file-7',
    name: 'components',
    path: 'artifacts/ai-agent-home-mobile/components',
    type: 'directory',
  },
  {
    id: 'file-8',
    name: 'constants',
    path: 'artifacts/ai-agent-home-mobile/constants',
    type: 'directory',
  },
];

export const initialWorkspaceTasks: WorkspaceTask[] = [
  {
    id: 'task-1',
    title: 'Mobile workspace import',
    progress: 72,
    detail: 'Converting desktop interactions into native touch patterns',
    status: 'in_progress',
    items: [
      { id: 't-1', title: 'Implement collapsible workspace drawer', completed: true },
      { id: 't-2', title: 'Wire multi-model selector pill and modal', completed: true },
      { id: 't-3', title: 'Build file preview inspection modal', completed: true },
      { id: 't-4', title: 'Attach file upload drag-and-drop & interactive simulation', completed: false },
      { id: 't-5', title: 'Refine desktop vs mobile viewport wrapper', completed: false },
    ],
  },
];

export const initialMemoryItems: MemoryItem[] = [
  {
    id: 'mem-1',
    key: 'Framework',
    value: 'Expo + React Native',
    category: 'stack',
  },
  {
    id: 'mem-2',
    key: 'Architecture',
    value: 'Mobile-first workspace with local persistence',
    category: 'architecture',
  },
  {
    id: 'mem-3',
    key: 'Repository',
    value: 'https://github.com/skssoyel94-lang/AI-Agent-Home-UI.git',
    category: 'stack',
  },
  {
    id: 'mem-4',
    key: 'Theme Colors',
    value: 'Dark (#111216 background, #1e1f20 card, #282a2c secondary, #a8c7fa primary)',
    category: 'preference',
  },
];

export const starterPromptChips = [
  'Build a responsive React component',
  'इस प्रोजेक्ट का कोड समझाइए (Explain in Hindi)',
  'Attach photo or video to inspect UI',
  'Workspace terminal me git status check karo',
];
