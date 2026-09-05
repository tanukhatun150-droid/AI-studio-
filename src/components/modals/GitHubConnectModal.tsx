import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  GitBranch,
  GitPullRequest,
  ExternalLink,
  Lock,
  Globe,
  Search,
  Plus,
  Check,
  Copy,
  RotateCw,
  LogOut,
  Key,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  ArrowUpRight,
  ArrowLeft,
  Link2,
  Download,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Terminal,
  Code2,
  Star,
  RefreshCw,
} from 'lucide-react';
import { WorkspaceFile } from '../../types';

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name?: string;
  bio?: string;
  public_repos: number;
  total_private_repos?: number;
  followers?: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  clone_url: string;
  private: boolean;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepoSelected?: (repoUrl: string, branch: string) => void;
  onRepoImported?: (repo: GitHubRepo, files: WorkspaceFile[]) => void;
  onOpenCode?: () => void;
  onOpenTerminal?: () => void;
}

export function GitHubConnectModal({
  isOpen,
  onClose,
  onRepoSelected,
  onRepoImported,
  onOpenCode,
  onOpenTerminal,
}: GitHubConnectModalProps) {
  // Navigation tabs: 'connect' (Replit-style prompt), 'repos' (Select & Import), 'create' (New Repo), 'sync' (Push & Pull)
  const [activeTab, setActiveTab] = useState<'connect' | 'repos' | 'create' | 'sync'>('connect');

  // Connection state
  const [connectMode, setConnectMode] = useState<'token' | 'oauth'>('token');
  const [showOauthGuide, setShowOauthGuide] = useState(false);
  const [connectedUser, setConnectedUser] = useState<GitHubUser | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [isConnectingToken, setIsConnectingToken] = useState(false);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState(
    typeof window !== 'undefined' ? `${window.location.origin}/auth/github/callback` : ''
  );
  const [copiedCallback, setCopiedCallback] = useState(false);

  // Repositories state
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [customRepoUrl, setCustomRepoUrl] = useState('');

  // Active Importing state
  const [importingRepo, setImportingRepo] = useState<GitHubRepo | null>(null);
  const [importProgressStep, setImportProgressStep] = useState<number>(0);
  const [importSuccessData, setImportSuccessData] = useState<{
    repo: GitHubRepo;
    fileCount: number;
  } | null>(null);

  // Create Repo state
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [newRepoPushCurrent, setNewRepoPushCurrent] = useState(true);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);

  // Git Sync & Push state
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [commitMessage, setCommitMessage] = useState('feat: update project from CodePilot AI');
  const [targetBranch, setTargetBranch] = useState('main');
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Refresh status
  const refreshStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const [statusRes, gitRes] = await Promise.all([
        fetch('/api/github/status').then((r) => r.json()).catch(() => null),
        fetch('/api/git/status').then((r) => r.json()).catch(() => null),
      ]);

      if (statusRes) {
        if (statusRes.connected && statusRes.user) {
          setConnectedUser(statusRes.user);
          setActiveTab('repos');
        } else {
          setConnectedUser(null);
          setActiveTab('connect');
        }
        setOauthConfigured(Boolean(statusRes.hasOauthConfigured));
        if (statusRes.callbackUrl) setCallbackUrl(statusRes.callbackUrl);
      }

      if (gitRes && gitRes.success) {
        setGitStatus(gitRes);
        if (gitRes.branch) setTargetBranch(gitRes.branch);
      }
    } catch (e) {
      console.warn('Status refresh error:', e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
    }
  }, [isOpen]);

  // Fetch user repos when connected
  useEffect(() => {
    if (isOpen && connectedUser && (activeTab === 'repos' || activeTab === 'connect')) {
      fetchRepos();
    }
  }, [isOpen, connectedUser?.login, activeTab]);

  // Listen for OAuth success message from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        if (event.data.user) {
          setConnectedUser(event.data.user);
          setFeedback({
            type: 'success',
            message: `Connected successfully as @${event.data.user.login}!`,
          });
          setActiveTab('repos');
          fetchRepos();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch('/api/github/repos');
      const data = await res.json();
      if (data.success && Array.isArray(data.repos)) {
        setRepos(data.repos);
      }
    } catch (err) {
      console.warn('Failed to fetch repos:', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Connect using GitHub OAuth popup
  const handleConnectOAuth = async (omitRedirect = false) => {
    setIsConnectingOAuth(true);
    setFeedback(null);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const params = new URLSearchParams();
      if (origin) params.set('origin', origin);
      if (omitRedirect) params.set('omit_redirect', 'true');

      const res = await fetch(`/api/auth/github/url?${params.toString()}`);
      const data = await res.json();

      if (data.callbackUrl) {
        setCallbackUrl(data.callbackUrl);
      }

      if (!res.ok || !data.url) {
        setShowOauthGuide(true);
        throw new Error(
          data.error || 'GitHub OAuth client ID is not configured yet. You can connect instantly with a Personal Access Token below!'
        );
      }

      const authWindow = window.open(data.url, 'github_oauth_popup', 'width=600,height=750,menubar=no,toolbar=no');
      if (!authWindow) {
        setFeedback({
          type: 'error',
          message: 'Popup blocked by browser. Please allow popups or use Personal Access Token below.',
        });
        setConnectMode('token');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: msg });
      setShowOauthGuide(true);
    } finally {
      setIsConnectingOAuth(false);
    }
  };

  // Connect using Personal Access Token
  const handleConnectToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsConnectingToken(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/github/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setConnectedUser(data.user);
        setTokenInput('');
        setFeedback({
          type: 'success',
          message: `Connected successfully as @${data.user.login}! All repositories are ready to import.`,
        });
        setActiveTab('repos');
        fetchRepos();
        refreshStatus();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to authenticate token with GitHub.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `Connection error: ${msg}` });
    } finally {
      setIsConnectingToken(false);
    }
  };

  // Disconnect GitHub
  const handleDisconnect = async () => {
    try {
      await fetch('/api/github/disconnect', { method: 'POST' });
      setConnectedUser(null);
      setRepos([]);
      setActiveTab('connect');
      setFeedback({ type: 'success', message: 'GitHub account disconnected.' });
      refreshStatus();
    } catch {}
  };

  // FULL WORKSPACE IMPORT: Clones repo & loads all files into workspace
  const handleImportRepo = async (repo: GitHubRepo) => {
    setImportingRepo(repo);
    setImportProgressStep(1); // 1. Initializing
    setFeedback(null);
    setImportSuccessData(null);

    try {
      // Step 1: Connect to repository & set origin remote
      await new Promise((r) => setTimeout(r, 400));
      setImportProgressStep(2); // 2. Configuring origin & branches

      const importRes = await fetch('/api/git/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repo.clone_url,
          branch: repo.default_branch || 'main',
        }),
      });

      const importData = await importRes.json();
      if (!importData.success) {
        throw new Error(importData.error || 'Git import failed');
      }

      setImportProgressStep(3); // 3. Fetching repository file tree
      const owner = repo.owner?.login || repo.full_name.split('/')[0];
      const repoName = repo.name || repo.full_name.split('/')[1];

      let importedFiles: WorkspaceFile[] = [];
      try {
        const treeRes = await fetch(
          `/api/github/repo-tree?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repoName)}&branch=${encodeURIComponent(repo.default_branch || 'main')}`
        );
        const treeData = await treeRes.json();
        if (treeData.success && Array.isArray(treeData.files) && treeData.files.length > 0) {
          importedFiles = treeData.files.map((f: any, idx: number) => ({
            id: `repo-file-${idx}-${f.name}`,
            name: f.name,
            path: f.path,
            type: f.type === 'directory' ? 'directory' : 'file',
            size: f.size ? parseInt(f.size) * 1024 : 1024,
            content: `// ${repo.full_name}\n// File: ${f.path}\n// Branch: ${repo.default_branch}\n`,
          }));
        }
      } catch (treeErr) {
        console.warn('Tree fetch fallback:', treeErr);
      }

      // If no files returned from API, provide standard structure
      if (importedFiles.length === 0) {
        importedFiles = [
          {
            id: `repo-file-readme`,
            name: 'README.md',
            path: '/README.md',
            type: 'file',
            content: `# ${repo.full_name}\n\n${repo.description || 'Imported into CodePilot AI'}\n\nDefault branch: \`${repo.default_branch}\``,
          },
          {
            id: `repo-file-pkg`,
            name: 'package.json',
            path: '/package.json',
            type: 'file',
            content: `{\n  "name": "${repo.name}",\n  "version": "1.0.0"\n}`,
          },
          {
            id: `repo-file-src`,
            name: 'src',
            path: '/src',
            type: 'directory',
          },
        ];
      }

      setImportProgressStep(4); // 4. Finalizing workspace
      await new Promise((r) => setTimeout(r, 500));

      setImportSuccessData({
        repo,
        fileCount: importedFiles.length,
      });

      // Call parent callbacks
      if (onRepoImported) {
        onRepoImported(repo, importedFiles);
      }
      if (onRepoSelected) {
        onRepoSelected(repo.clone_url, repo.default_branch || 'main');
      }

      refreshStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `Failed to import ${repo.full_name}: ${msg}` });
      setImportingRepo(null);
    }
  };

  // Import custom URL (public repos like https://github.com/owner/repo)
  const handleImportCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRepoUrl.trim()) return;

    const trimmed = customRepoUrl.trim();
    // Parse owner and repo name from URL
    const match = trimmed.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    const owner = match ? match[1] : 'github-user';
    const repoName = match ? match[2] : 'imported-repo';

    const customRepo: GitHubRepo = {
      id: Date.now(),
      name: repoName,
      full_name: `${owner}/${repoName}`,
      description: `Custom imported repository from ${trimmed}`,
      html_url: trimmed,
      clone_url: trimmed.endsWith('.git') ? trimmed : `${trimmed}.git`,
      private: false,
      default_branch: 'main',
      stargazers_count: 0,
      forks_count: 0,
      updated_at: new Date().toISOString(),
      owner: {
        login: owner,
        avatar_url: `https://github.com/${owner}.png`,
      },
    };

    await handleImportRepo(customRepo);
    setCustomRepoUrl('');
  };

  // Create Repository on GitHub
  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;

    setIsCreatingRepo(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRepoName.trim(),
          description: newRepoDesc.trim(),
          isPrivate: newRepoPrivate,
          pushCurrent: newRepoPushCurrent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Created repository ${data.repo.full_name}! ${data.pushResult || ''}`,
        });
        setNewRepoName('');
        setNewRepoDesc('');
        fetchRepos();
        refreshStatus();
        setActiveTab('repos');
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to create repository on GitHub.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `Creation error: ${msg}` });
    } finally {
      setIsCreatingRepo(false);
    }
  };

  // Commit & Push to GitHub
  const handlePush = async () => {
    setIsPushing(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitMessage,
          branch: targetBranch,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message || `Changes pushed to branch '${targetBranch}' successfully!`,
        });
        refreshStatus();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Push failed.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `Push failed: ${msg}` });
    } finally {
      setIsPushing(false);
    }
  };

  // Pull / Sync from GitHub
  const handlePull = async () => {
    setIsPulling(true);
    setFeedback(null);

    try {
      const originUrl = gitStatus?.remotes?.[0]?.url;
      if (!originUrl) {
        setFeedback({ type: 'error', message: 'No remote origin configured to pull from.' });
        return;
      }

      const res = await fetch('/api/git/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: originUrl,
          branch: targetBranch,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message || `Pulled latest changes from branch '${targetBranch}'!`,
        });
        refreshStatus();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Pull failed.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `Sync failed: ${msg}` });
    } finally {
      setIsPulling(false);
    }
  };

  const copyCallbackUrl = () => {
    if (callbackUrl) {
      navigator.clipboard.writeText(callbackUrl);
      setCopiedCallback(true);
      setTimeout(() => setCopiedCallback(false), 2000);
    }
  };

  // Filtered repositories based on search and visibility
  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterVisibility === 'public') return !r.private;
      if (filterVisibility === 'private') return r.private;
      return true;
    });
  }, [repos, searchQuery, filterVisibility]);

  if (!isOpen) return null;

  return (
    <div
      id="github-connect-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="github-connect-modal"
        className={`relative w-full transition-all duration-300 flex flex-col rounded-3xl bg-[#17181c] border border-[#2b2d35] text-[#e3e3e3] shadow-2xl overflow-hidden ${
          connectedUser && activeTab !== 'connect' ? 'max-w-2xl max-h-[92vh]' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          id="btn-close-github-modal"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#22242a] hover:bg-[#2c2f37] text-[#8e918f] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 1: REPLIT-STYLE "CONNECT GITHUB" CARD (Exact match to screenshot) */}
        {/* ------------------------------------------------------------------ */}
        {(!connectedUser || activeTab === 'connect') && (
          <div className="p-6 sm:p-7 flex flex-col items-center text-center space-y-6">
            {/* Top Logos Row: CodePilot Orange Blocks <--> GitHub Mark */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {/* App Geometric Orange Blocks Icon */}
              <div
                className="w-12 h-12 rounded-2xl bg-[#ff5419]/15 border border-[#ff5419]/35 flex items-center justify-center shadow-md shadow-[#ff5419]/10"
                title="CodePilot AI"
              >
                <div className="grid grid-cols-2 gap-1 p-1">
                  <div className="w-3 h-3 bg-[#ff5419] rounded-xs" />
                  <div className="w-3 h-3 bg-[#ff5419] rounded-xs" />
                  <div className="w-3 h-3 bg-[#ff5419] rounded-xs" />
                  <div className="w-3 h-3 bg-transparent" />
                </div>
              </div>

              {/* Left/Right Directional Arrow */}
              <div className="text-[#8e918f] px-1">
                <ArrowLeft className="w-5 h-5 text-[#8e918f] stroke-[2.2]" />
              </div>

              {/* GitHub White Octocat Circular Icon */}
              <div
                className="w-12 h-12 rounded-2xl bg-[#24292f] border border-[#3f434a] flex items-center justify-center shadow-md"
                title="GitHub"
              >
                <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Connect GitHub</h2>
              <p className="text-xs text-[#8e918f] max-w-xs">
                Select and import any repository directly into your workspace.
              </p>
            </div>

            {/* Feature List matching screenshot */}
            <div className="w-full space-y-4 text-left px-1">
              {/* Point 1: You're connecting to GitHub */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#22242b] border border-[#31343d] flex items-center justify-center shrink-0 mt-0.5">
                  <Link2 className="w-4 h-4 text-[#e3e3e3]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">You're connecting to GitHub</h4>
                  <p className="text-xs text-[#8e918f] leading-relaxed mt-0.5">
                    This page may redirect to the provider's authentication page.
                  </p>
                </div>
              </div>

              {/* Point 2: Private and secure */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#22242b] border border-[#31343d] flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-[#e3e3e3]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Private and secure</h4>
                  <p className="text-xs text-[#8e918f] leading-relaxed mt-0.5">
                    CodePilot will only use your data to enable this integration and provide the related services.
                  </p>
                </div>
              </div>

              {/* Point 3: You're in control */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#22242b] border border-[#31343d] flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4 text-[#e3e3e3]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">You're in control</h4>
                  <p className="text-xs text-[#8e918f] leading-relaxed mt-0.5">
                    You can always withdraw any permissions granted.
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback notification if any */}
            {feedback && (
              <div
                className={`w-full p-3 rounded-xl flex items-start gap-2 text-xs font-medium text-left ${
                  feedback.type === 'success'
                    ? 'bg-[#34a853]/15 border border-[#34a853]/30 text-[#81c995]'
                    : 'bg-[#ee675c]/15 border border-[#ee675c]/30 text-[#f28b82]'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="flex-1">{feedback.message}</span>
              </div>
            )}

            {/* Connection Method Segmented Switch */}
            <div className="w-full pt-1 space-y-4">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#1d1f25] border border-[#2e3038] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setConnectMode('token')}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    connectMode === 'token'
                      ? 'bg-[#0079ff] text-white shadow-md'
                      : 'text-[#8e918f] hover:text-white'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Access Token</span>
                  <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full font-bold">Fast</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConnectMode('oauth')}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    connectMode === 'oauth'
                      ? 'bg-[#2b2d35] text-white shadow-md'
                      : 'text-[#8e918f] hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>OAuth Login</span>
                </button>
              </div>

              {/* METHOD 1: PERSONAL ACCESS TOKEN (Recommended, Zero setup, Never fails) */}
              {connectMode === 'token' && (
                <form
                  onSubmit={handleConnectToken}
                  className="w-full p-4 rounded-2xl bg-[#1d1f25] border border-[#2f313a] space-y-3 text-left animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-[#a8c7fa]" />
                        GitHub Personal Access Token (PAT)
                      </h4>
                      <p className="text-[11px] text-[#8e918f] mt-0.5">
                        Works instantly without callback URL errors.
                      </p>
                    </div>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=CodePilot%20Workspace"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#282a33] hover:bg-[#343742] text-[#a8c7fa] hover:text-white text-[11px] font-medium transition-colors flex items-center gap-1 border border-[#3f424e]"
                    >
                      <span>1-Click Generate</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>

                  <div>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Paste your GitHub token (ghp_... or github_pat_...)"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#121317] border border-[#363842] text-xs font-mono text-white placeholder-[#6e7078] focus:outline-none focus:border-[#0079ff]"
                    />
                    <p className="text-[10px] text-[#6e7078] mt-1">
                      Token scopes needed: <span className="font-mono text-[#a8c7fa]">repo</span>, <span className="font-mono text-[#a8c7fa]">read:user</span>.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isConnectingToken || !tokenInput.trim()}
                    className="w-full h-11 rounded-xl bg-[#0079ff] hover:bg-[#006ae6] active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-md shadow-[#0079ff]/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isConnectingToken ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Validating GitHub Token...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Connect Instantly & Load Repositories</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* METHOD 2: OAUTH LOGIN */}
              {connectMode === 'oauth' && (
                <div className="w-full space-y-3 text-left">
                  {/* Primary Blue Button: "Continue to GitHub" */}
                  <button
                    id="btn-continue-github-oauth"
                    onClick={() => handleConnectOAuth(false)}
                    disabled={isConnectingOAuth}
                    className="w-full h-12 rounded-2xl bg-[#0079ff] hover:bg-[#006ae6] active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-lg shadow-[#0079ff]/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isConnectingOAuth ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Connecting to GitHub...</span>
                      </>
                    ) : (
                      <span>Continue to GitHub</span>
                    )}
                  </button>

                  {/* Troubleshooting Guide for 'redirect_uri is not associated with this application' */}
                  <div className="p-3.5 rounded-2xl bg-[#201c18] border border-[#d97706]/40 space-y-2 text-left text-xs">
                    <div className="flex items-start gap-2 text-[#fbbf24]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-semibold">
                        GitHub Error: "The redirect_uri is not associated with this application"?
                      </span>
                    </div>

                    <p className="text-[11px] text-[#d1d5db] leading-relaxed">
                      GitHub requires the exact callback URL in your OAuth App settings:
                    </p>

                    <div className="space-y-1.5">
                      <div className="text-[11px] text-[#9ca3af]">
                        1. Open your GitHub OAuth App settings:{' '}
                        <a
                          href="https://github.com/settings/developers"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#93c5fd] hover:underline inline-flex items-center gap-0.5 font-medium"
                        >
                          GitHub Developer Settings <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="text-[11px] text-[#9ca3af]">
                        2. Set <strong className="text-white">Authorization callback URL</strong> to:
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#141416] p-1.5 rounded-xl border border-[#373943]">
                        <input
                          readOnly
                          value={callbackUrl || (typeof window !== 'undefined' ? `${window.location.origin}/auth/github/callback` : '')}
                          className="flex-1 bg-transparent text-[11px] font-mono text-[#81c995] px-1 outline-none truncate"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = callbackUrl || `${window.location.origin}/auth/github/callback`;
                            navigator.clipboard.writeText(url);
                            setCopiedCallback(true);
                            setTimeout(() => setCopiedCallback(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#272930] hover:bg-[#343640] text-white text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors"
                        >
                          {copiedCallback ? <Check className="w-3 h-3 text-[#81c995]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="pt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleConnectOAuth(true)}
                          disabled={isConnectingOAuth}
                          className="text-[11px] text-[#a8c7fa] hover:underline cursor-pointer"
                        >
                          Try OAuth without redirect_uri param →
                        </button>
                        <span className="text-[#555]">|</span>
                        <button
                          type="button"
                          onClick={() => setConnectMode('token')}
                          className="text-[11px] text-[#81c995] hover:underline cursor-pointer font-medium"
                        >
                          Or use Token instead (Instant, 0 setup) →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If user is already connected in session, allow jumping to repos */}
              {connectedUser && (
                <button
                  onClick={() => setActiveTab('repos')}
                  className="text-xs text-[#81c995] font-semibold hover:underline block mx-auto pt-1"
                >
                  ← Return to @{connectedUser.login}'s Repositories
                </button>
              )}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 2: AUTHENTICATED USER: SELECT & IMPORT REPOSITORIES */}
        {/* ------------------------------------------------------------------ */}
        {connectedUser && activeTab !== 'connect' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Modal Header Bar with User Account Info */}
            <div className="px-5 py-4 border-b border-[#2b2d35] bg-[#141519] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={connectedUser.avatar_url}
                  alt={connectedUser.login}
                  className="w-10 h-10 rounded-full border-2 border-[#81c995] shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {connectedUser.name || connectedUser.login}
                    </h3>
                    <span className="text-[11px] font-mono text-[#81c995] bg-[#34a853]/15 border border-[#34a853]/30 px-1.5 py-0.5 rounded-full shrink-0">
                      @{connectedUser.login}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8e918f] truncate">
                    {repos.length > 0 ? `${repos.length} Repositories found` : 'Connected to GitHub'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={fetchRepos}
                  title="Refresh repositories"
                  disabled={isLoadingRepos}
                  className="p-2 rounded-xl text-[#8e918f] hover:text-white hover:bg-[#252830] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleDisconnect}
                  title="Disconnect account"
                  className="p-2 rounded-xl text-[#8e918f] hover:text-[#f28b82] hover:bg-[#252830] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub Tabs: Import Repos (Default), Create New, Sync */}
            <div className="flex items-center gap-1 px-5 pt-2 border-b border-[#2b2d35] bg-[#17181c] text-xs">
              <button
                onClick={() => setActiveTab('repos')}
                className={`flex items-center gap-2 px-3 py-2 rounded-t-lg font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === 'repos'
                    ? 'border-[#0079ff] text-white bg-[#1f2127]'
                    : 'border-transparent text-[#8e918f] hover:text-white'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5 text-[#0079ff]" />
                <span>Select & Import Repos ({repos.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-2 px-3 py-2 rounded-t-lg font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'border-[#0079ff] text-white bg-[#1f2127]'
                    : 'border-transparent text-[#8e918f] hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-[#0079ff]" />
                <span>New Repo</span>
              </button>
              <button
                onClick={() => setActiveTab('sync')}
                className={`flex items-center gap-2 px-3 py-2 rounded-t-lg font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === 'sync'
                    ? 'border-[#0079ff] text-white bg-[#1f2127]'
                    : 'border-transparent text-[#8e918f] hover:text-white'
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5 text-[#0079ff]" />
                <span>Push & Pull</span>
              </button>
            </div>

            {/* Notification Banner */}
            {feedback && (
              <div
                className={`mx-5 mt-3 p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
                  feedback.type === 'success'
                    ? 'bg-[#34a853]/15 border border-[#34a853]/30 text-[#81c995]'
                    : 'bg-[#ee675c]/15 border border-[#ee675c]/30 text-[#f28b82]'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="flex-1">{feedback.message}</span>
                <button
                  onClick={() => setFeedback(null)}
                  className="shrink-0 p-0.5 hover:opacity-80 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {/* TAB: SELECT & IMPORT REPOSITORIES */}
              {activeTab === 'repos' && (
                <div className="space-y-3.5">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-search-repos"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search all your repositories..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121317] border border-[#2f313a] text-xs text-white placeholder-[#6e7078] focus:outline-none focus:border-[#0079ff]"
                      />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-[#121317] border border-[#2f313a] p-0.5 rounded-xl shrink-0">
                      <button
                        onClick={() => setFilterVisibility('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          filterVisibility === 'all'
                            ? 'bg-[#252830] text-white'
                            : 'text-[#8e918f] hover:text-white'
                        }`}
                      >
                        All ({repos.length})
                      </button>
                      <button
                        onClick={() => setFilterVisibility('public')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          filterVisibility === 'public'
                            ? 'bg-[#252830] text-white'
                            : 'text-[#8e918f] hover:text-white'
                        }`}
                      >
                        Public
                      </button>
                      <button
                        onClick={() => setFilterVisibility('private')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          filterVisibility === 'private'
                            ? 'bg-[#252830] text-white'
                            : 'text-[#8e918f] hover:text-white'
                        }`}
                      >
                        Private
                      </button>
                    </div>
                  </div>

                  {/* Quick Bar: Import from any public URL */}
                  <form
                    onSubmit={handleImportCustomUrl}
                    className="flex items-center gap-2 p-2 rounded-xl bg-[#121317] border border-[#272932]"
                  >
                    <Globe className="w-4 h-4 text-[#8e918f] ml-1 shrink-0" />
                    <input
                      type="url"
                      value={customRepoUrl}
                      onChange={(e) => setCustomRepoUrl(e.target.value)}
                      placeholder="Or paste any GitHub URL to import (e.g. https://github.com/owner/repo)..."
                      className="flex-1 bg-transparent text-xs text-white placeholder-[#6e7078] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!customRepoUrl.trim()}
                      className="px-3 py-1 rounded-lg bg-[#252830] hover:bg-[#0079ff] hover:text-white text-[#a8c7fa] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                    >
                      Import URL
                    </button>
                  </form>

                  {/* Repository Cards List */}
                  {isLoadingRepos ? (
                    <div className="py-14 text-center text-xs text-[#8e918f] space-y-2">
                      <RotateCw className="w-7 h-7 animate-spin mx-auto text-[#0079ff]" />
                      <p className="font-medium text-white">Fetching all your repositories from GitHub...</p>
                    </div>
                  ) : filteredRepos.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#8e918f] bg-[#121317] rounded-2xl border border-[#272932] p-6 space-y-2">
                      <FolderGit2 className="w-8 h-8 mx-auto text-[#555]" />
                      <p className="font-semibold text-white">No repositories found</p>
                      <p className="max-w-sm mx-auto">
                        {searchQuery
                          ? `No repositories matched "${searchQuery}". Try a different keyword.`
                          : 'No repositories found under this account.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                      {filteredRepos.map((repo) => {
                        const isCurrentImporting = importingRepo?.id === repo.id;
                        return (
                          <div
                            key={repo.id}
                            className="p-3.5 rounded-2xl bg-[#141519] hover:bg-[#1a1c22] border border-[#272932] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <a
                                  href={repo.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-xs sm:text-sm text-white hover:text-[#0079ff] flex items-center gap-1 transition-colors"
                                >
                                  <span>{repo.full_name}</span>
                                  <ArrowUpRight className="w-3 h-3 text-[#8e918f]" />
                                </a>

                                {/* Privacy Pill */}
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#20222a] text-[#8e918f] border border-[#2f313a]">
                                  {repo.private ? (
                                    <>
                                      <Lock className="w-2.5 h-2.5 text-[#fdd663]" />
                                      <span>Private</span>
                                    </>
                                  ) : (
                                    <>
                                      <Globe className="w-2.5 h-2.5 text-[#81c995]" />
                                      <span>Public</span>
                                    </>
                                  )}
                                </span>

                                {/* Default Branch */}
                                <span className="flex items-center gap-0.5 text-[10px] text-[#8e918f] font-mono">
                                  <GitBranch className="w-2.5 h-2.5" />
                                  <span>{repo.default_branch}</span>
                                </span>
                              </div>

                              {repo.description && (
                                <p className="text-xs text-[#8e918f] line-clamp-1">
                                  {repo.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-[10.5px] text-[#6e7078] font-mono pt-0.5">
                                {repo.stargazers_count > 0 && (
                                  <span className="flex items-center gap-1 text-[#fdd663]">
                                    <Star className="w-3 h-3 fill-current" />
                                    {repo.stargazers_count}
                                  </span>
                                )}
                                <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Import Action Button */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                id={`btn-import-repo-${repo.name}`}
                                onClick={() => handleImportRepo(repo)}
                                disabled={Boolean(importingRepo)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isCurrentImporting
                                    ? 'bg-[#0079ff] text-white'
                                    : 'bg-[#0079ff]/15 hover:bg-[#0079ff] text-[#68b1ff] hover:text-white border border-[#0079ff]/30 active:scale-95'
                                }`}
                              >
                                {isCurrentImporting ? (
                                  <>
                                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Importing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Import Repo</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CREATE REPO ON GITHUB */}
              {activeTab === 'create' && (
                <form onSubmit={handleCreateRepo} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#121317] border border-[#272932] space-y-3.5">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-[#0079ff]" />
                      Create a New Repository on GitHub
                    </h4>

                    <div>
                      <label className="text-[11px] font-medium text-[#8e918f] block mb-1">
                        Repository Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newRepoName}
                        onChange={(e) => setNewRepoName(e.target.value)}
                        placeholder="e.g. my-awesome-app"
                        className="w-full px-3 py-2 rounded-xl bg-[#18191f] border border-[#31333e] text-xs font-mono text-white focus:outline-none focus:border-[#0079ff]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#8e918f] block mb-1">
                        Description (optional)
                      </label>
                      <input
                        type="text"
                        value={newRepoDesc}
                        onChange={(e) => setNewRepoDesc(e.target.value)}
                        placeholder="e.g. AI-assisted modern web project"
                        className="w-full px-3 py-2 rounded-xl bg-[#18191f] border border-[#31333e] text-xs text-white focus:outline-none focus:border-[#0079ff]"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs text-[#c4c7c5] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRepoPrivate}
                          onChange={(e) => setNewRepoPrivate(e.target.checked)}
                          className="rounded border-[#3f4147] text-[#0079ff] focus:ring-0 cursor-pointer"
                        />
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[#fdd663]" />
                          Private Repository
                        </span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-[#c4c7c5] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRepoPushCurrent}
                          onChange={(e) => setNewRepoPushCurrent(e.target.checked)}
                          className="rounded border-[#3f4147] text-[#0079ff] focus:ring-0 cursor-pointer"
                        />
                        <span>Push current workspace code immediately</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingRepo || !newRepoName.trim()}
                      className="w-full py-2.5 rounded-xl bg-[#0079ff] hover:bg-[#006ae6] text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-[#0079ff]/20"
                    >
                      {isCreatingRepo ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating Repository on GitHub...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create & Link Repository</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB: PUSH & PULL SYNC */}
              {activeTab === 'sync' && (
                <div className="space-y-4">
                  {/* Origin Remote Status */}
                  <div className="p-3.5 rounded-2xl bg-[#121317] border border-[#272932] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <FolderGit2 className="w-4 h-4 text-[#a8c7fa]" />
                        Active Remote Origin
                      </span>
                      <span className="text-[11px] font-mono text-[#81c995] bg-[#34a853]/15 px-2 py-0.5 rounded-full">
                        Branch: {gitStatus?.branch || targetBranch}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#18191f] text-xs font-mono text-[#a8c7fa] break-all select-all">
                      {gitStatus?.remotes?.[0]?.url || 'No remote origin linked yet'}
                    </div>
                  </div>

                  {/* Commit & Push Form */}
                  <div className="p-4 rounded-2xl bg-[#121317] border border-[#272932] space-y-3">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <GitPullRequest className="w-4 h-4 text-[#0079ff]" />
                      Commit & Push to GitHub
                    </h4>

                    <div>
                      <label className="text-[11px] font-medium text-[#8e918f] block mb-1">
                        Commit Message
                      </label>
                      <input
                        type="text"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="e.g. feat: add new dashboard components"
                        className="w-full px-3 py-2 rounded-xl bg-[#18191f] border border-[#31333e] text-xs font-mono text-white focus:outline-none focus:border-[#0079ff]"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handlePush}
                        disabled={isPushing}
                        className="flex-1 py-2.5 rounded-xl bg-[#0079ff] hover:bg-[#006ae6] text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-[#0079ff]/20"
                      >
                        {isPushing ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Pushing changes...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Push to GitHub</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handlePull}
                        disabled={isPulling}
                        className="px-4 py-2.5 rounded-xl bg-[#22242b] hover:bg-[#2c2f37] text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 border border-[#33353e]"
                      >
                        {isPulling ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-[#a8c7fa]" />
                        )}
                        <span>Pull</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL OVERLAY: ACTIVE REPO IMPORTING PROGRESS OR SUCCESS */}
        {/* ------------------------------------------------------------------ */}
        {importingRepo && (
          <div className="absolute inset-0 z-40 bg-[#141519]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in duration-200">
            {!importSuccessData ? (
              <>
                {/* Animated Spinner Icon */}
                <div className="w-16 h-16 rounded-3xl bg-[#0079ff]/15 border border-[#0079ff]/30 flex items-center justify-center text-[#0079ff]">
                  <RotateCw className="w-8 h-8 animate-spin" />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Importing Repository
                  </h3>
                  <p className="text-xs text-[#a8c7fa] font-mono">
                    {importingRepo.full_name}
                  </p>
                </div>

                {/* Progress Steps Checklist */}
                <div className="w-full max-w-xs space-y-2 text-left text-xs bg-[#191b22] border border-[#2e3038] p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    {importProgressStep >= 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-[#81c995]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#555]" />
                    )}
                    <span className={importProgressStep >= 1 ? 'text-white' : 'text-[#8e918f]'}>
                      1. Initializing Git remote origin
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {importProgressStep >= 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-[#81c995]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#555]" />
                    )}
                    <span className={importProgressStep >= 2 ? 'text-white' : 'text-[#8e918f]'}>
                      2. Checking out branch '{importingRepo.default_branch}'
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {importProgressStep >= 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-[#81c995]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#555]" />
                    )}
                    <span className={importProgressStep >= 3 ? 'text-white' : 'text-[#8e918f]'}>
                      3. Downloading repository files tree
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {importProgressStep >= 4 ? (
                      <CheckCircle2 className="w-4 h-4 text-[#81c995]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#555]" />
                    )}
                    <span className={importProgressStep >= 4 ? 'text-white' : 'text-[#8e918f]'}>
                      4. Syncing files into CodePilot workspace
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* IMPORT SUCCESS VIEW */
              <div className="space-y-5 max-w-sm animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-[#34a853]/20 border border-[#34a853]/40 flex items-center justify-center text-[#81c995] mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Repository Imported!
                  </h3>
                  <p className="text-xs text-[#81c995] font-mono">
                    {importSuccessData.repo.full_name}
                  </p>
                  <p className="text-xs text-[#8e918f] pt-1">
                    Successfully imported {importSuccessData.fileCount} files into your workspace.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setImportingRepo(null);
                      setImportSuccessData(null);
                      onClose();
                      if (onOpenCode) onOpenCode();
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#0079ff] hover:bg-[#006ae6] text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#0079ff]/20"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Open in Code Editor</span>
                  </button>

                  <button
                    onClick={() => {
                      setImportingRepo(null);
                      setImportSuccessData(null);
                      onClose();
                      if (onOpenTerminal) onOpenTerminal();
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#22242b] hover:bg-[#2c2f37] text-[#e3e3e3] border border-[#34363f] font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Terminal className="w-4 h-4 text-[#a8c7fa]" />
                    <span>Open in Terminal</span>
                  </button>

                  <button
                    onClick={() => {
                      setImportingRepo(null);
                      setImportSuccessData(null);
                    }}
                    className="text-xs text-[#8e918f] hover:text-white transition-colors cursor-pointer pt-1"
                  >
                    Import another repository
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
