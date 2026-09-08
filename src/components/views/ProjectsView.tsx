import React, { useState } from 'react';
import {
  FolderCode,
  FileCode,
  FileText,
  FileJson,
  Folder,
  Plus,
  RefreshCw,
  Search,
  Github,
  GitBranch,
  GitCommit,
  Sparkles,
  ExternalLink,
  Smartphone,
  Layers,
  ArrowUpRight,
  Terminal as TerminalIcon,
  CheckCircle2,
} from 'lucide-react';
import { AppTab, WorkspaceFile } from '../../types';

interface ProjectsViewProps {
  files: WorkspaceFile[];
  onSelectFile: (file: WorkspaceFile) => void;
  onRefreshFiles: () => void;
  isRefreshingFiles?: boolean;
  connectedGithubUser?: {
    username: string;
    avatarUrl?: string;
    repoName?: string;
    branch?: string;
  } | null;
  onOpenGitHub: () => void;
  onSelectTab: (tab: AppTab) => void;
}

export function ProjectsView({
  files,
  onSelectFile,
  onRefreshFiles,
  isRefreshingFiles = false,
  connectedGithubUser,
  onOpenGitHub,
  onSelectTab,
}: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'components' | 'backend' | 'apk'>('all');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Sample APK assets in the workspace
  const apkAssets = [
    { name: 'AndroidManifest.xml', path: '/android/app/src/main/AndroidManifest.xml', size: '2.4 KB', type: 'Config' },
    { name: 'JarvisFloatingService.kt', path: '/android/app/src/main/java/JarvisFloatingService.kt', size: '8.1 KB', type: 'Service' },
    { name: 'app-release.apk', path: '/build/outputs/apk/release/codepilot-v2.apk', size: '14.2 MB', type: 'Binary' },
    { name: 'manifest.json', path: '/public/manifest.json', size: '1.2 KB', type: 'PWA / WebApp' },
  ];

  // Filter files
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'components') {
      return f.path.includes('components') || f.name.endsWith('.tsx');
    }
    if (selectedCategory === 'backend') {
      return f.name.includes('server') || f.path.includes('api') || f.name.endsWith('.ts');
    }
    return true;
  });

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) return <FileCode className="w-4 h-4 text-sky-400" />;
    if (fileName.endsWith('.ts') || fileName.endsWith('.js')) return <FileCode className="w-4 h-4 text-blue-400" />;
    if (fileName.endsWith('.json')) return <FileJson className="w-4 h-4 text-amber-400" />;
    if (fileName.endsWith('.css') || fileName.endsWith('.html')) return <FileText className="w-4 h-4 text-rose-400" />;
    return <FileText className="w-4 h-4 text-[#8e918f]" />;
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanPath = newFileName.startsWith('/') ? newFileName : `/${newFileName}`;
    const newFile: WorkspaceFile = {
      id: `file-${Date.now()}`,
      name: cleanPath.split('/').pop() || cleanPath,
      path: cleanPath,
      type: 'file',
      content: `// Created by CodePilot AI\n// File: ${cleanPath}\n\nexport {};\n`,
    };
    onSelectFile(newFile);
    setIsCreatingNew(false);
    setNewFileName('');
  };

  return (
    <div
      id="view-projects"
      className="h-full overflow-y-auto pb-20 p-4 sm:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150 custom-scrollbar"
    >
      {/* 1. Projects View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2b2d34]">
        <div>
          <div className="flex items-center gap-2">
            <FolderCode className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Project Explorer & Workspaces</h1>
          </div>
          <p className="text-xs text-[#8e918f] mt-0.5">
            Manage repository files, APK bundle assets, and connected GitHub repositories.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="projects-btn-new-project"
            type="button"
            onClick={() => setIsCreatingNew((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New File / Module</span>
          </button>

          <button
            id="projects-btn-github-manage"
            type="button"
            onClick={onOpenGitHub}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e2026] hover:bg-[#282a32] text-[#e3e3e3] hover:text-white border border-[#333640] text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Sync</span>
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreatingNew && (
        <form
          onSubmit={handleCreateFileSubmit}
          className="p-3.5 rounded-xl bg-[#18191f] border border-sky-500/40 flex items-center gap-2 animate-in slide-in-from-top-2"
        >
          <span className="text-xs font-mono text-sky-400">Path:</span>
          <input
            type="text"
            placeholder="src/components/MyNewComponent.tsx"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            autoFocus
            className="flex-1 bg-[#101114] border border-[#33353c] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-sky-400 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs cursor-pointer"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingNew(false)}
            className="px-2.5 py-1.5 rounded-lg hover:bg-[#282a32] text-xs text-[#8e918f] cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* 2. Top GitHub Connected Status Bar */}
      <div className="rounded-xl bg-[#16171b] border border-[#2b2d34] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-white shrink-0">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {connectedGithubUser
                  ? `Connected: @${connectedGithubUser.username}`
                  : 'GitHub Workspace Repository'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {connectedGithubUser ? 'Synchronized' : 'Ready to Connect'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#8e918f] mt-0.5">
              <span className="flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-sky-400" />
                Branch: <span className="font-mono text-zinc-300">main</span>
              </span>
              <span className="flex items-center gap-1">
                <GitCommit className="w-3 h-3 text-emerald-400" />
                Commit: <span className="font-mono text-zinc-300">HEAD (latest)</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectTab('terminal')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22242a] hover:bg-[#2d3038] text-xs text-[#c4c7c5] hover:text-white border border-[#33353c] transition-colors cursor-pointer"
          >
            <TerminalIcon className="w-3.5 h-3.5 text-teal-400" />
            <span>git status</span>
          </button>
          <button
            type="button"
            onClick={onOpenGitHub}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22242a] hover:bg-[#2d3038] text-xs text-sky-400 hover:text-sky-300 border border-[#33353c] transition-colors cursor-pointer"
          >
            <span>Manage Repos</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Main Split Section: File Explorer & APK Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: File Explorer */}
        <div className="lg:col-span-2 rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Source Files ({filteredFiles.length})</h3>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8e918f] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 sm:w-48 bg-[#1f2127] border border-[#33353c] rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-sky-400"
                />
              </div>

              <button
                type="button"
                onClick={onRefreshFiles}
                disabled={isRefreshingFiles}
                title="Refresh file tree"
                className="p-1.5 rounded-lg bg-[#1f2127] hover:bg-[#282a32] text-[#8e918f] hover:text-white border border-[#33353c] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingFiles ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'components', label: 'React UI' },
              { id: 'backend', label: 'Node / Express' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'bg-[#1f2127] text-[#8e918f] hover:text-white border border-[#2b2d34]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* File Items Grid / List */}
          <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredFiles.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#8e918f]">
                No files matched your filter query.
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file)}
                  className="p-2.5 rounded-xl bg-[#1c1e24] hover:bg-[#242730] border border-[#282a30] hover:border-sky-500/30 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    {getFileIcon(file.name)}
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-medium text-white group-hover:text-sky-300 truncate transition-colors">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-[#8e918f] font-mono truncate">
                        {file.path}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-[#8e918f]">
                      {file.content ? `${Math.round(file.content.length / 1024 * 10) / 10} KB` : '1.4 KB'}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: APK & Mobile Workspace Assets */}
        <div className="rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">APK & Mobile Workspace</h3>
            </div>

            <p className="text-xs text-[#8e918f] leading-relaxed">
              Standalone mobile build targets and native bridge assets for the Jarvis voice assistant overlay.
            </p>

            <div className="space-y-2">
              {apkAssets.map((asset) => (
                <div
                  key={asset.path}
                  className="p-3 rounded-xl bg-[#1c1e24] border border-[#282a30] flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-mono font-semibold text-white truncate">
                      {asset.name}
                    </div>
                    <div className="text-[10px] text-teal-400 font-mono">
                      {asset.type} • {asset.size}
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-2 mt-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>Mobile Build Target: Ready</span>
            </div>
            <p className="text-[11px] text-teal-200/80 leading-snug">
              Web Speech API & micro-waveform listeners are mapped directly into the live assistant runner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
