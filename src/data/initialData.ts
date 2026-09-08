import { AgentPersona, MemoryItem, Model, WorkspaceFile, WorkspaceTask, WorkspaceTool } from '../types';

export const initialModels: Model[] = [
  {
    id: 'codepilot-native',
    name: 'CodePilot Native',
    detail: 'In-House Core (Zero Config)',
    badge: 'No API Key Required',
    provider: 'App Native Engine',
    description: 'App ka apna in-house autonomous intelligence engine. Isme kisi external API key ki bilkul zaroorat nahi hai—hamesha 100% free, active aur instant ready rehta hai.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    detail: 'Gemini 3.8 Flash',
    badge: 'Recommended',
    provider: 'Google AI',
    description: 'Highly capable multimodal reasoning model for coding, analysis, and agentic workflows.',
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4o',
    detail: 'GPT-4o mini',
    badge: 'Industry Standard',
    provider: 'OpenAI',
    description: 'Flagship reasoning and instruction following for enterprise coding and logic.',
  },
  {
    id: 'groq',
    name: 'Groq',
    detail: 'Qwen 3.8 27B LPU',
    badge: 'Ultra Fast',
    provider: 'Groq LPU',
    description: 'Near-instantaneous token generation optimized for rapid iteration and code completion.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    detail: 'DeepSeek V3 / R1',
    badge: 'Coding Specialist',
    provider: 'DeepSeek',
    description: 'State-of-the-art coding, mathematical synthesis, and open-weight model intelligence.',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    detail: 'Universal Router',
    badge: 'Aggregator',
    provider: 'OpenRouter',
    description: 'Unified gateway routing to hundreds of cutting-edge open and proprietary AI models.',
  },
  {
    id: 'kimi',
    name: 'Kimi / Moonshot',
    detail: 'Moonshot v1 8K',
    badge: 'Long Context',
    provider: 'Moonshot AI',
    description: 'Massive context window specialized in large codebases and complex repository analysis.',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    detail: 'Llama 3.1 8B/70B',
    badge: 'Wafer Scale',
    provider: 'Cerebras AI',
    description: 'World record inference speeds powered by Cerebras wafer-scale engine chips.',
  },
  {
    id: 'together',
    name: 'Together AI',
    detail: 'Llama 3.1 70B Turbo',
    badge: 'Cloud GPU',
    provider: 'Together.ai',
    description: 'High performance open-source model inference on specialized accelerated clusters.',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    detail: 'Mistral Small',
    badge: 'European Frontier',
    provider: 'Mistral.ai',
    description: 'Efficient, multilingual reasoning and code comprehension from Mistral AI.',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    detail: 'Command R',
    badge: 'Enterprise',
    provider: 'Cohere AI',
    description: 'Engineered specifically for business tasks, tool use, and grounded enterprise generation.',
  },
  {
    id: 'upstage',
    name: 'Upstage',
    detail: 'Solar Pro',
    badge: 'Document AI',
    provider: 'Upstage.ai',
    description: 'Specialized high-accuracy intelligence and document understanding from Upstage Solar.',
  },
  {
    id: 'zai',
    name: 'Z.Ai (GLM)',
    detail: 'GLM-5.3 Flash',
    badge: 'Bilingual AI',
    provider: 'Zhipu AI',
    description: 'Leading bilingual Chinese-English foundational model with deep reasoning abilities.',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    detail: 'Cloud / Local',
    badge: 'Flexible',
    provider: 'Ollama',
    description: 'Self-hosted or cloud inference running customized open deep learning models.',
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
    systemPrompt: 'You are the Lead Systems Architect. You design resilient distributed architectures, data models, scalable API contracts, and high-performance server topologies. Provide crisp architectural diagrams, trade-off evaluations, and robust schemas.',
  },
  {
    id: 'frontend',
    name: 'Frontend',
    initials: 'FE',
    tint: '#34a853',
    role: 'Component Design & Touch Interactions',
    status: 'Active',
    active: true,
    systemPrompt: 'You are the Principal Frontend Specialist. You build pixel-perfect, accessible, and responsive React & Tailwind interfaces. Deliver elegant component composition, fluid micro-interactions, robust state management, and modern design standards.',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    initials: 'RV',
    tint: '#a8c7fa',
    role: 'Code Quality, Tests & Security Audit',
    status: 'Idle',
    active: false,
    systemPrompt: 'You are the Senior Code Reviewer & Security Auditor. You scrutinize code with laser precision for security flaws, edge-case vulnerabilities, performance regressions, and architectural anti-patterns. Provide actionable audits with concrete, hardened code.',
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
    id: 'file-package-json',
    name: 'package.json',
    path: '/package.json',
    type: 'file',
    size: 1459,
    content: `{
  "name": "codepilot-ai",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "cap:sync": "cap sync",
    "cap:android": "cap add android",
    "cap:build": "vite build && cap sync android"
  }
}`,
  },
  {
    id: 'file-server-ts',
    name: 'server.ts',
    path: '/server.ts',
    type: 'file',
    size: 110787,
    content: `import express from 'express';
import http from 'http';
import path from 'path';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';

const PORT = 3000;
// Full-stack Node.js server with real Gemini AI, bash shell and GitHub APIs`,
  },
  {
    id: 'file-app-tsx',
    name: 'App.tsx',
    path: '/src/App.tsx',
    type: 'file',
    size: 32019,
    content: `// Main CodePilot AI Workspace interface with Jarvis Assistant, real terminal & files`,
  },
  {
    id: 'file-vite-config',
    name: 'vite.config.ts',
    path: '/vite.config.ts',
    type: 'file',
    size: 850,
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});`,
  },
  {
    id: 'file-env-example',
    name: '.env.example',
    path: '/.env.example',
    type: 'file',
    size: 380,
    content: `GEMINI_API_KEY=
FIREBASE_API_KEY=
FIREBASE_SERVICE_ACCOUNT_KEY=
GITHUB_TOKEN=
OPENAI_API_KEY=
GROQ_API_KEY=`,
  },
  {
    id: 'file-metadata-json',
    name: 'metadata.json',
    path: '/metadata.json',
    type: 'file',
    size: 350,
    content: `{
  "name": "CodePilot AI",
  "description": "Full-stack AI workspace with Gemini agent, real bash terminal, GitHub integration, and live preview.",
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}`,
  },
];

export const initialWorkspaceTasks: WorkspaceTask[] = [
  {
    id: 'task-1',
    title: 'Full-Stack Architecture & Environment Setup',
    progress: 100,
    detail: 'Normalized repository to npm, Node 22, Express server, and Vite frontend',
    status: 'completed',
    items: [
      { id: 't-1-1', title: 'Normalize dependencies and package manager to npm', completed: true },
      { id: 't-1-2', title: 'Configure Express server on port 3000 at 0.0.0.0', completed: true },
      { id: 't-1-3', title: 'Setup Vite middleware and client bundle', completed: true },
      { id: 't-1-4', title: 'Clean legacy monorepo artifacts and files', completed: true },
    ],
  },
  {
    id: 'task-2',
    title: 'Google Gemini & AI Multi-Model Intelligence',
    progress: 100,
    detail: 'Server-side @google/genai SDK integration with fallback multi-model routing',
    status: 'completed',
    items: [
      { id: 't-2-1', title: 'Implement server-side Gemini 3.8 Flash streaming & tools', completed: true },
      { id: 't-2-2', title: 'Support autonomous workspace file creation and editing', completed: true },
      { id: 't-2-3', title: 'Multilingual Hinglish, Hindi, and English natural fluency', completed: true },
    ],
  },
  {
    id: 'task-3',
    title: 'Real Interactive Bash Terminal & Git Integration',
    progress: 100,
    detail: 'Full WebSocket terminal with xterm-256color and simple-git push/clone',
    status: 'completed',
    items: [
      { id: 't-3-1', title: 'WebSocket server streaming /bin/bash shell on /ws/terminal', completed: true },
      { id: 't-3-2', title: 'Connect @xterm/xterm frontend with FitAddon & resize support', completed: true },
      { id: 't-3-3', title: 'Live GitHub Connect via Personal Access Token & OAuth', completed: true },
    ],
  },
  {
    id: 'task-4',
    title: 'Firebase Authentication & Cloud Sync',
    progress: 85,
    detail: 'Google OAuth, Email/Password sign-in, and Firebase Admin SDK verification',
    status: 'in_progress',
    items: [
      { id: 't-4-1', title: 'Initialize Firebase Web Client SDK with Auth', completed: true },
      { id: 't-4-2', title: 'Lazy load Firebase Admin SDK on backend', completed: true },
      { id: 't-4-3', title: 'Verify user ID tokens via /api/firebase/verify-token', completed: true },
    ],
  },
  {
    id: 'task-5',
    title: 'Capacitor Android APK Build Pipeline',
    progress: 90,
    detail: 'Mobile wrapper and APK sync configuration using @capacitor/core',
    status: 'in_progress',
    items: [
      { id: 't-5-1', title: 'Capacitor configuration and android assets', completed: true },
      { id: 't-5-2', title: 'Jarvis floating assistant mobile mode', completed: true },
      { id: 't-5-3', title: 'PWA Web App Manifest & responsive mobile viewport', completed: true },
    ],
  },
];

export const initialMemoryItems: MemoryItem[] = [
  {
    id: 'mem-1',
    key: 'Framework & Stack',
    value: 'React 19 + TypeScript + Express + Vite (Tailwind CSS)',
    category: 'stack',
  },
  {
    id: 'mem-2',
    key: 'AI Provider',
    value: 'Google AI Gemini (@google/genai) running server-side with multi-model fallbacks',
    category: 'architecture',
  },
  {
    id: 'mem-3',
    key: 'Source Repository',
    value: 'https://github.com/tanukhatun150-droid/AI-studio-',
    category: 'stack',
  },
  {
    id: 'mem-4',
    key: 'Terminal & Workspace',
    value: 'Real /bin/bash Linux terminal via WebSockets, live filesystem CRUD',
    category: 'architecture',
  },
  {
    id: 'mem-5',
    key: 'Mobile Runtime',
    value: 'Capacitor Android + PWA installable with Jarvis floating mode',
    category: 'preference',
  },
];

export const starterPromptChips = [
  '🔐 Sign in with Firebase (Google, GitHub, Email)',
  '✨ Generate code with Google Gemini AI',
  '⚡ Run commands in real Linux Bash terminal',
  '🐙 Connect GitHub and sync repositories',
  'इस प्रोजेक्ट का कोड समझाइए (Explain in Hindi)',
];
