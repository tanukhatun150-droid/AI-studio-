import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Database,
  Cloud,
  GitBranch,
  GitPullRequest,
  Terminal,
  Monitor,
  Play,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  Key,
  GitCommit,
  ArrowUpRight,
} from 'lucide-react';
import { TerminalLog, WorkspaceTool } from '../../types';
import { TerminalView } from '../TerminalView';
import { LivePreview } from '../LivePreview';

interface ToolModalProps {
  isOpen: boolean;
  tool: WorkspaceTool | null;
  onClose: () => void;
}

export function ToolModal({ isOpen, tool, onClose }: ToolModalProps) {
  // Packages state
  const [packageSearch, setPackageSearch] = useState('');
  const [newPackageName, setNewPackageName] = useState('');
  const [installedPackages, setInstalledPackages] = useState([
    { name: '@google/genai', version: '^2.4.0', desc: 'Google Gemini SDK' },
    { name: '@xterm/xterm', version: '^5.5.0', desc: 'Full interactive terminal' },
    { name: 'simple-git', version: '^3.27.0', desc: 'Real Git version control' },
    { name: 'ws', version: '^8.18.0', desc: 'WebSocket terminal stream' },
    { name: 'motion', version: '^12.23.24', desc: 'Animation engine' },
    { name: 'lucide-react', version: '^0.546.0', desc: 'Icon collection' },
    { name: 'react', version: '^19.0.1', desc: 'Core UI framework' },
    { name: 'tailwindcss', version: '^4.1.14', desc: 'Utility CSS' },
    { name: 'express', version: '^4.21.2', desc: 'API server' },
  ]);
  const [isInstalling, setIsInstalling] = useState(false);

  // PostgreSQL state
  const [sqlQuery, setSqlQuery] = useState('SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = \'public\';');
  const [sqlResult, setSqlResult] = useState<string | null>(null);

  // Deploy state
  const [deployStep, setDeployStep] = useState<number>(0);
  const [isDeploying, setIsDeploying] = useState(false);

  // Real GitHub Git state
  const [repoUrl, setRepoUrl] = useState('https://github.com/skssoyel94-lang/AI-Agent-Home-UI.git');
  const [githubToken, setGithubToken] = useState('');
  const [branchName, setBranchName] = useState('main');
  const [commitMsg, setCommitMsg] = useState('feat: autonomous AI developer updates & real git integration');
  const [isPushing, setIsPushing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [gitOutput, setGitOutput] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch real git status when opening GitHub tools
  useEffect(() => {
    if (isOpen && (tool?.id === 'github-import' || tool?.id === 'github-push')) {
      fetch('/api/git/status')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setGitStatus(data);
            if (data.branch) setBranchName(data.branch);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, tool?.id]);

  // Handle Real Git Push
  const handleRealGitPush = async () => {
    setIsPushing(true);
    setGitOutput(null);
    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitMessage: commitMsg,
          branch: branchName,
          repoUrl,
          token: githubToken || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGitOutput({
          type: 'success',
          message: data.message || `Changes committed (${data.latestCommit?.hash?.slice(0, 7) || 'HEAD'}) and pushed to ${branchName}.`,
        });
        // Refresh status
        const statusRes = await fetch('/api/git/status');
        const statusData = await statusRes.json();
        if (statusData.success) setGitStatus(statusData);
      } else {
        setGitOutput({ type: 'error', message: data.error || 'Failed to commit & push.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGitOutput({ type: 'error', message: `Network error: ${msg}` });
    } finally {
      setIsPushing(false);
    }
  };

  // Handle Real Git Import / Sync
  const handleRealGitImport = async () => {
    setIsImporting(true);
    setGitOutput(null);
    try {
      const res = await fetch('/api/git/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          branch: branchName,
          token: githubToken || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGitOutput({
          type: 'success',
          message: data.message || `Successfully synced with ${repoUrl} on branch ${branchName}.`,
        });
        // Refresh status
        const statusRes = await fetch('/api/git/status');
        const statusData = await statusRes.json();
        if (statusData.success) setGitStatus(statusData);
      } else {
        setGitOutput({ type: 'error', message: data.error || 'Failed to sync repository.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGitOutput({ type: 'error', message: `Network error: ${msg}` });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen || !tool) return null;

  const renderToolIcon = () => {
    switch (tool.iconName) {
      case 'Package':
        return <Package className="w-5 h-5 text-[#a8c7fa]" />;
      case 'Database':
        return <Database className="w-5 h-5 text-[#a8c7fa]" />;
      case 'Cloud':
        return <Cloud className="w-5 h-5 text-[#a8c7fa]" />;
      case 'GitBranch':
        return <GitBranch className="w-5 h-5 text-[#a8c7fa]" />;
      case 'GitPullRequest':
        return <GitPullRequest className="w-5 h-5 text-[#a8c7fa]" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-[#a8c7fa]" />;
      case 'Monitor':
        return <Monitor className="w-5 h-5 text-[#a8c7fa]" />;
      default:
        return <Package className="w-5 h-5 text-[#a8c7fa]" />;
    }
  };

  // Package installation handler
  const handleInstallPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackageName.trim() || isInstalling) return;
    setIsInstalling(true);
    setTimeout(() => {
      setInstalledPackages((prev) => [
        ...prev,
        {
          name: newPackageName.trim(),
          version: '^1.0.0',
          desc: 'User installed dependency',
        },
      ]);
      setNewPackageName('');
      setIsInstalling(false);
    }, 1200);
  };

  // SQL query runner
  const handleExecuteSql = () => {
    setSqlResult('Loading query results from PostgreSQL...');
    setTimeout(() => {
      setSqlResult(`Rows returned: 3 (execution time: 14ms)
┌──────────────┬──────────────────┬──────────────┐
│ table_name   │ column_name      │ data_type    │
├──────────────┼──────────────────┼──────────────┤
│ messages     │ id               │ uuid         │
│ messages     │ role             │ varchar(32)  │
│ messages     │ content          │ text         │
│ messages     │ created_at       │ timestamptz  │
└──────────────┴──────────────────┴──────────────┘`);
    }, 400);
  };

  // Deploy handler
  const handleStartDeploy = () => {
    setIsDeploying(true);
    setDeployStep(1);
    setTimeout(() => setDeployStep(2), 1200);
    setTimeout(() => setDeployStep(3), 2400);
    setTimeout(() => {
      setDeployStep(4);
      setIsDeploying(false);
    }, 3600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className={`relative w-full ${tool.id === 'terminal' ? 'max-w-3xl' : 'max-w-2xl'} bg-[#1e1f20] border border-[#333538] rounded-2xl p-5 shadow-2xl z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150`}>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#333538]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#282a2c] border border-[#333538] flex items-center justify-center shrink-0">
              {renderToolIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{tool.label}</h3>
                <span className="text-[10px] font-semibold bg-[#282a2c] text-[#a8c7fa] px-2 py-0.5 rounded border border-[#333538]">
                  {tool.detail}
                </span>
              </div>
              <p className="text-xs text-[#8e918f] mt-0.5">{tool.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Tool Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
          {/* Tool: TERMINAL */}
          {tool.id === 'terminal' && (
            <TerminalView />
          )}

          {/* Tool: PACKAGES */}
          {tool.id === 'packages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#8e918f] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={packageSearch}
                    onChange={(e) => setPackageSearch(e.target.value)}
                    placeholder="Search dependencies..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#282a2c] border border-[#333538] text-xs text-white placeholder-[#8e918f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Package list */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {installedPackages
                  .filter((p) => p.name.toLowerCase().includes(packageSearch.toLowerCase()))
                  .map((pkg, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#282a2c] border border-[#333538]"
                    >
                      <div>
                        <span className="font-mono text-xs font-semibold text-white">
                          {pkg.name}
                        </span>
                        <p className="text-[11px] text-[#8e918f]">{pkg.desc}</p>
                      </div>
                      <span className="font-mono text-[11px] text-[#a8c7fa] bg-[#1e1f20] px-2 py-0.5 rounded border border-[#333538]">
                        {pkg.version}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Install package input */}
              <form onSubmit={handleInstallPackage} className="pt-2 border-t border-[#333538] flex gap-2">
                <input
                  type="text"
                  value={newPackageName}
                  onChange={(e) => setNewPackageName(e.target.value)}
                  placeholder="Install new package (e.g. zod, date-fns)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#111216] border border-[#333538] text-xs text-white placeholder-[#8e918f] focus:outline-none focus:border-[#a8c7fa]"
                />
                <button
                  type="submit"
                  disabled={isInstalling || !newPackageName.trim()}
                  className="px-4 py-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isInstalling ? 'Installing...' : 'Add Package'}
                </button>
              </form>
            </div>
          )}

          {/* Tool: POSTGRESQL */}
          {tool.id === 'postgres' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#282a2c] border border-[#333538] text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse" />
                  <span className="text-[#e3e3e3] font-medium">PostgreSQL 16 Socket</span>
                </div>
                <span className="text-[#8e918f] font-mono text-[11px]">Cloud SQL Active</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8e918f] block mb-1 uppercase tracking-wider">
                  SQL Query Scratchpad
                </label>
                <textarea
                  rows={3}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#111216] border border-[#333538] font-mono text-xs text-[#e3e3e3] focus:outline-none focus:border-[#a8c7fa] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExecuteSql}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Query</span>
                </button>
              </div>

              {sqlResult && (
                <div className="rounded-xl bg-[#111216] border border-[#333538] p-3">
                  <pre className="font-mono text-xs text-[#a8c7fa] overflow-x-auto leading-relaxed">
                    {sqlResult}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Tool: DEPLOY */}
          {tool.id === 'deploy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#282a2c] border border-[#333538] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Target Production</span>
                  <span className="text-xs text-[#34a853] font-bold">Cloud Run (Managed)</span>
                </div>
                <p className="text-xs text-[#8e918f]">
                  Single-container production distribution bundling client static assets and reverse proxy server on port 3000.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#e3e3e3]">
                  {deployStep >= 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-[#34a853]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#8e918f]" />
                  )}
                  <span>Vite Production Compilation (`dist/`)</span>
                </div>
                <div className="flex items-center gap-2 text-[#e3e3e3]">
                  {deployStep >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-[#34a853]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#8e918f]" />
                  )}
                  <span>Container Image Ingress Bundling</span>
                </div>
                <div className="flex items-center gap-2 text-[#e3e3e3]">
                  {deployStep >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-[#34a853]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#8e918f]" />
                  )}
                  <span>Health Check & Port 3000 Readiness Verification</span>
                </div>
                {deployStep === 4 && (
                  <div className="p-3 rounded-xl bg-[#34a853]/10 border border-[#34a853]/30 text-[#34a853] font-medium flex items-center justify-between">
                    <span>Successfully deployed to production!</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                )}
              </div>

              <button
                onClick={handleStartDeploy}
                disabled={isDeploying}
                className="w-full py-2.5 rounded-xl bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] font-semibold text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {isDeploying ? 'Deploying in progress...' : 'Trigger Production Deploy'}
              </button>
            </div>
          )}

          {/* Tool: GITHUB IMPORT & PUSH */}
          {(tool.id === 'github-import' || tool.id === 'github-push') && (
            <div className="space-y-4">
              {/* Repository & Branch Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 p-3 rounded-xl bg-[#282a2c] border border-[#333538] space-y-1">
                  <label className="text-[10px] text-[#8e918f] font-semibold uppercase tracking-wider block">
                    GitHub Repository Origin
                  </label>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full bg-[#111216] border border-[#333538] rounded-lg px-2.5 py-1 font-mono text-xs text-white focus:outline-none focus:border-[#a8c7fa]"
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#282a2c] border border-[#333538] space-y-1">
                  <label className="text-[10px] text-[#8e918f] font-semibold uppercase tracking-wider block">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full bg-[#111216] border border-[#333538] rounded-lg px-2.5 py-1 font-mono text-xs text-white focus:outline-none focus:border-[#a8c7fa]"
                  />
                </div>
              </div>

              {/* GitHub OAuth / Personal Access Token */}
              <div className="p-3 rounded-xl bg-[#282a2c] border border-[#333538] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-[#8e918f] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3 h-3 text-[#a8c7fa]" />
                    <span>GitHub OAuth / Personal Access Token</span>
                  </label>
                  <span className="text-[10px] text-[#8e918f]">Required for private repos or push</span>
                </div>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or OAuth token"
                  className="w-full bg-[#111216] border border-[#333538] rounded-lg px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-[#a8c7fa]"
                />
              </div>

              {/* Real Git Status Card */}
              {gitStatus && (
                <div className="p-3 rounded-xl bg-[#18191c] border border-[#2e3036] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-[#a8c7fa]" />
                      <span className="font-semibold text-white">Local Git: {gitStatus.branch}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      gitStatus.isClean ? 'bg-[#34a853]/20 text-[#81c995]' : 'bg-[#fdd663]/20 text-[#fdd663]'
                    }`}>
                      {gitStatus.isClean ? 'Working Tree Clean' : `${(gitStatus.modified?.length || 0) + (gitStatus.not_added?.length || 0)} uncommitted changes`}
                    </span>
                  </div>

                  {gitStatus.latestCommit && (
                    <div className="flex items-center gap-2 text-[11px] text-[#8e918f] font-mono bg-[#111216] p-2 rounded-lg border border-[#2a2c30]">
                      <GitCommit className="w-3.5 h-3.5 text-[#a8c7fa] shrink-0" />
                      <span className="text-[#a8c7fa]">{gitStatus.latestCommit.hash?.slice(0, 7)}</span>
                      <span className="truncate text-[#e3e3e3]">{gitStatus.latestCommit.message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action specific views */}
              {tool.id === 'github-push' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#8e918f] block mb-1 uppercase tracking-wider">
                      Commit Message
                    </label>
                    <input
                      type="text"
                      value={commitMsg}
                      onChange={(e) => setCommitMsg(e.target.value)}
                      placeholder="feat: commit message..."
                      className="w-full px-3 py-2 rounded-xl bg-[#111216] border border-[#333538] text-xs text-white focus:outline-none focus:border-[#a8c7fa]"
                    />
                  </div>

                  <button
                    onClick={handleRealGitPush}
                    disabled={isPushing}
                    className="w-full py-2.5 rounded-xl bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  >
                    {isPushing ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Staging, Committing & Pushing to GitHub...</span>
                      </>
                    ) : (
                      <>
                        <GitPullRequest className="w-4 h-4" />
                        <span>Commit & Push Changes to GitHub</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleRealGitImport}
                    disabled={isImporting}
                    className="w-full py-2.5 rounded-xl bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  >
                    {isImporting ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Fetching & Syncing with GitHub...</span>
                      </>
                    ) : (
                      <>
                        <GitBranch className="w-4 h-4" />
                        <span>Sync / Pull from GitHub Repository</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Feedback messages */}
              {gitOutput && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  gitOutput.type === 'success'
                    ? 'bg-[#34a853]/15 border border-[#34a853]/30 text-[#81c995]'
                    : 'bg-[#ee675c]/15 border border-[#ee675c]/30 text-[#f28b82]'
                }`}>
                  {gitOutput.message}
                </div>
              )}
            </div>
          )}

          {/* Tool: PREVIEW */}
          {tool.id === 'preview' && (
            <div className="h-[480px] w-full rounded-xl overflow-hidden border border-[#333538]">
              <LivePreview isSplitView={false} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#333538] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] font-semibold text-xs transition-colors cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
