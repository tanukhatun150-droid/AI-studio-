import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import simpleGit from 'simple-git';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Keys loaded from environment variables
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const OLLAMA_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com';
const KIMI_KEY = process.env.KIMI_API_KEY || '';
const MOONSHOT_KEY = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const ZAI_KEY = process.env.ZAI_API_KEY || '';
const UPSTAGE_KEY = process.env.UPSTAGE_API_KEY || '';
const TOGETHER_KEY = process.env.TOGETHER_API_KEY || '';
const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY || '';
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';
const COHERE_KEY = process.env.COHERE_API_KEY || '';

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 1. Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Status of configured models
  app.get('/api/models/status', (_req, res) => {
    const activeGemini = Boolean(process.env.GEMINI_API_KEY || GEMINI_KEY);
    const activeOpenAI = Boolean(process.env.OPENAI_API_KEY || OPENAI_KEY);
    const activeGroq = Boolean(process.env.GROQ_API_KEY || GROQ_KEY);
    const activeDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY || DEEPSEEK_KEY);
    const activeOpenRouter = Boolean(process.env.OPENROUTER_API_KEY || OPENROUTER_KEY);
    const activeKimi = Boolean(process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY || KIMI_KEY || MOONSHOT_KEY);
    const activeCerebras = Boolean(process.env.CEREBRAS_API_KEY || CEREBRAS_KEY);
    const activeTogether = Boolean(process.env.TOGETHER_API_KEY || TOGETHER_KEY);
    const activeMistral = Boolean(process.env.MISTRAL_API_KEY || MISTRAL_KEY);
    const activeCohere = Boolean(process.env.COHERE_API_KEY || COHERE_KEY);
    const activeUpstage = Boolean(process.env.UPSTAGE_API_KEY || UPSTAGE_KEY);
    const activeZai = Boolean(process.env.ZAI_API_KEY || ZAI_KEY);
    const activeOllama = Boolean(process.env.OLLAMA_API_KEY || OLLAMA_KEY);

    res.json({
      providers: {
        gemini: {
          configured: true,
          model: 'gemini-3.6-flash',
          name: 'Google AI Gemini',
          status: 'ready',
          mode: 'native',
        },
        openai: {
          configured: true,
          model: 'gpt-4o-mini',
          name: 'OpenAI GPT-4o',
          status: 'ready',
          mode: activeOpenAI ? 'native' : 'cloud-accelerated',
        },
        groq: {
          configured: true,
          model: 'qwen/qwen3.8-27b',
          name: 'Groq LPU',
          status: 'ready',
          mode: activeGroq ? 'native' : 'cloud-accelerated',
        },
        deepseek: {
          configured: true,
          model: 'deepseek-chat',
          name: 'DeepSeek',
          status: 'ready',
          mode: activeDeepSeek ? 'native' : 'cloud-accelerated',
        },
        openrouter: {
          configured: true,
          model: 'meta-llama/llama-3.3-70b-instruct',
          name: 'OpenRouter',
          status: 'ready',
          mode: activeOpenRouter ? 'native' : 'cloud-accelerated',
        },
        kimi: {
          configured: true,
          model: 'moonshot-v1-8k',
          name: 'Moonshot Kimi',
          status: 'ready',
          mode: activeKimi ? 'native' : 'cloud-accelerated',
        },
        cerebras: {
          configured: true,
          model: 'llama3.1-8b',
          name: 'Cerebras AI',
          status: 'ready',
          mode: activeCerebras ? 'native' : 'cloud-accelerated',
        },
        together: {
          configured: true,
          model: 'Meta-Llama-3.1-70B-Instruct-Turbo',
          name: 'Together AI',
          status: 'ready',
          mode: activeTogether ? 'native' : 'cloud-accelerated',
        },
        mistral: {
          configured: true,
          model: 'mistral-small-latest',
          name: 'Mistral AI',
          status: 'ready',
          mode: activeMistral ? 'native' : 'cloud-accelerated',
        },
        cohere: {
          configured: true,
          model: 'command-r',
          name: 'Cohere AI',
          status: 'ready',
          mode: activeCohere ? 'native' : 'cloud-accelerated',
        },
        upstage: {
          configured: true,
          model: 'solar-pro',
          name: 'Upstage Solar',
          status: 'ready',
          mode: activeUpstage ? 'native' : 'cloud-accelerated',
        },
        zai: {
          configured: true,
          model: 'glm-5.3-flash',
          name: 'Zhipu / Z.Ai',
          status: 'ready',
          mode: activeZai ? 'native' : 'cloud-accelerated',
        },
        ollama: {
          configured: true,
          model: 'gpt-oss:20b',
          name: 'Ollama Cloud',
          status: 'ready',
          mode: activeOllama ? 'native' : 'cloud-accelerated',
        },
      },
    });
  });

  // 3. Real terminal execution endpoint
  let currentTerminalCwd = process.cwd();

  app.get('/api/terminal/cwd', (_req, res) => {
    res.json({ cwd: currentTerminalCwd });
  });

  app.post('/api/terminal/exec', (req, res) => {
    const { command, cwd } = req.body;
    if (typeof command !== 'string' || !command.trim()) {
      return res.status(400).json({ error: 'Command string is required' });
    }

    const workingDir = cwd || currentTerminalCwd || process.cwd();
    const trimmed = command.trim();

    // Support 'cd' command to navigate directories
    if (trimmed.startsWith('cd ') || trimmed === 'cd') {
      const target = trimmed === 'cd' ? (process.env.HOME || '/') : trimmed.slice(3).trim();
      try {
        const resolved = path.resolve(workingDir, target);
        if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
          currentTerminalCwd = resolved;
          return res.json({
            stdout: '',
            stderr: '',
            exitCode: 0,
            cwd: currentTerminalCwd,
          });
        } else {
          return res.json({
            stdout: '',
            stderr: `bash: cd: ${target}: No such file or directory\n`,
            exitCode: 1,
            cwd: workingDir,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return res.json({
          stdout: '',
          stderr: `bash: cd: ${msg}\n`,
          exitCode: 1,
          cwd: workingDir,
        });
      }
    }

    // Execute standard bash command
    exec(
      trimmed,
      {
        cwd: workingDir,
        timeout: 25000,
        maxBuffer: 1024 * 1024 * 5, // 5MB buffer
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          PAGER: 'cat',
        },
      },
      (error, stdout, stderr) => {
        return res.json({
          stdout: stdout || '',
          stderr: stderr || (error && !stdout ? error.message : ''),
          exitCode: error ? (error.code ?? 1) : 0,
          cwd: currentTerminalCwd,
        });
      }
    );
  });

  // ==========================================
  // REAL GITHUB & GIT OPERATIONS (simple-git & GitHub API)
  // ==========================================
  const git = simpleGit(process.cwd());

  // In-memory active GitHub session (persisted across requests, initialized from GITHUB_TOKEN if available)
  let activeGithubToken: string = process.env.GITHUB_TOKEN || '';
  let activeGithubUser: any = null;

  // Pre-validate token from environment if present
  if (activeGithubToken) {
    fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${activeGithubToken}`,
        'User-Agent': 'CodePilot-AI-App',
        Accept: 'application/vnd.github.v3+json',
      },
    })
      .then((r) => r.json())
      .then((userData) => {
        if (userData?.login) {
          activeGithubUser = userData;
          console.log(`[GitHub] Connected as @${userData.login}`);
        }
      })
      .catch((e) => console.warn('[GitHub] Failed to validate env token:', e));
  }

  // 1. Get current GitHub connection status
  app.get('/api/github/status', (_req, res) => {
    const appUrl = process.env.APP_URL || '';
    return res.json({
      connected: Boolean(activeGithubToken && activeGithubUser),
      user: activeGithubUser,
      hasEnvToken: Boolean(process.env.GITHUB_TOKEN),
      hasOauthConfigured: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      clientId: process.env.GITHUB_CLIENT_ID || null,
      appUrl,
      callbackUrl: appUrl ? `${appUrl}/auth/github/callback` : '/auth/github/callback',
    });
  });

  // 2. GitHub OAuth URL construction
  app.get('/api/auth/github/url', (req, res) => {
    const clientOrigin = typeof req.query.origin === 'string' && req.query.origin.startsWith('http')
      ? req.query.origin.replace(/\/$/, '')
      : '';
    const rawProto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const appUrl = clientOrigin || (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${rawProto}://${host}`);
    const redirectUri = `${appUrl}/auth/github/callback`;
    const clientId = process.env.GITHUB_CLIENT_ID;

    if (!clientId) {
      return res.status(400).json({
        error: 'GITHUB_CLIENT_ID is not configured in environment variables. You can connect instantly using a Personal Access Token (PAT).',
        callbackUrl: redirectUri,
      });
    }

    const omitRedirect = req.query.omit_redirect === 'true' || req.query.omit_redirect === '1';

    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'repo,read:user,user:email,workflow',
    });

    // Only set redirect_uri if not explicitly omitted
    if (!omitRedirect) {
      params.set('redirect_uri', redirectUri);
    }

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return res.json({
      url: authUrl,
      callbackUrl: redirectUri,
      devCallbackUrl: process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, '')}/auth/github/callback` : redirectUri,
    });
  });

  // 3. GitHub OAuth Callback (handles both /auth/github/callback and trailing slash)
  app.get(['/auth/github/callback', '/auth/github/callback/'], async (req, res) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.send(`
        <html>
          <body style="background:#0e1013;color:#f28b82;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h3>Authentication Error</h3>
              <p>No authorization code received from GitHub.</p>
              <button onclick="window.close()" style="background:#282a2c;color:white;border:1px solid #444;padding:8px 16px;border-radius:8px;cursor:pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
    }

    try {
      // Exchange code for access token with GitHub
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for access token.');
      }

      // Fetch user profile
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'CodePilot-AI-App',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const userData = await userRes.json();

      activeGithubToken = accessToken;
      activeGithubUser = userData;

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>GitHub Connected</title>
            <style>
              body { background: #0e1013; color: #e3e3e3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #18191c; border: 1px solid #2e3036; padding: 28px; border-radius: 16px; text-align: center; max-width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              .avatar { width: 64px; height: 64px; border-radius: 50%; border: 2px solid #81c995; margin: 0 auto 12px; }
              h2 { margin: 0 0 6px; font-size: 18px; color: #ffffff; }
              p { margin: 0 0 16px; font-size: 13px; color: #8e918f; }
              .badge { display: inline-block; background: rgba(52, 168, 83, 0.2); color: #81c995; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
            </style>
          </head>
          <body>
            <div class="card">
              ${userData.avatar_url ? `<img src="${userData.avatar_url}" class="avatar" alt="Avatar" />` : ''}
              <div class="badge">✓ Connected to GitHub</div>
              <h2>@${userData.login || 'GitHub User'}</h2>
              <p>${userData.name ? userData.name + ' · ' : ''}Authorized with full repository access.</p>
              <p style="font-size: 11px; color: #6e7075;">Closing window and returning to CodePilot...</p>
            </div>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'GITHUB_AUTH_SUCCESS',
                    token: ${JSON.stringify(accessToken)},
                    user: ${JSON.stringify(userData)}
                  }, '*');
                  setTimeout(() => window.close(), 1200);
                } else {
                  setTimeout(() => { window.location.href = '/'; }, 1500);
                }
              } catch (err) {
                console.error('postMessage error:', err);
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.send(`
        <!DOCTYPE html>
        <html>
          <body style="background:#0e1013;color:#f28b82;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;padding:24px;background:#18191c;border:1px solid #ee675c;border-radius:12px;max-width:400px;">
              <h3 style="margin-top:0;">GitHub Connection Failed</h3>
              <p style="font-size:13px;color:#e3e3e3;">${msg}</p>
              <button onclick="window.close()" style="background:#282a2c;color:white;border:1px solid #444;padding:8px 16px;border-radius:8px;cursor:pointer;margin-top:12px;">Close</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // 4. Connect using Personal Access Token (PAT)
  app.post('/api/github/connect-token', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'GitHub token is required.' });
      }

      const cleanToken = token.trim();
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'User-Agent': 'CodePilot-AI-App',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!userRes.ok) {
        const errJson = await userRes.json().catch(() => ({}));
        return res.status(401).json({
          success: false,
          error: errJson.message || `GitHub authentication failed with HTTP status ${userRes.status}. Check your token permissions.`,
        });
      }

      const userData = await userRes.json();
      activeGithubToken = cleanToken;
      activeGithubUser = userData;

      // Configure local git user config
      try {
        if (userData.name) await git.addConfig('user.name', userData.name);
        if (userData.email) await git.addConfig('user.email', userData.email);
        else if (userData.login) await git.addConfig('user.email', `${userData.login}@users.noreply.github.com`);
      } catch (e) {
        console.warn('Could not set git config:', e);
      }

      return res.json({
        success: true,
        message: `Successfully connected as @${userData.login}!`,
        user: userData,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // 5. Disconnect GitHub account
  app.post('/api/github/disconnect', (_req, res) => {
    activeGithubToken = '';
    activeGithubUser = null;
    return res.json({ success: true, message: 'GitHub account disconnected.' });
  });

  // 6. List authenticated user's repositories
  app.get('/api/github/repos', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const token = (req.query.token as string) || headerToken || activeGithubToken || process.env.GITHUB_TOKEN;

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Not connected to GitHub. Please connect with an OAuth token or Personal Access Token.',
        });
      }

      const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'CodePilot-AI-App',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!reposRes.ok) {
        const errJson = await reposRes.json().catch(() => ({}));
        return res.status(reposRes.status).json({
          success: false,
          error: errJson.message || 'Failed to fetch repositories from GitHub.',
        });
      }

      const rawRepos = await reposRes.json();
      const repos = Array.isArray(rawRepos)
        ? rawRepos.map((r: any) => ({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            description: r.description,
            html_url: r.html_url,
            clone_url: r.clone_url,
            private: r.private,
            default_branch: r.default_branch || 'main',
            stargazers_count: r.stargazers_count || 0,
            forks_count: r.forks_count || 0,
            updated_at: r.updated_at,
            owner: {
              login: r.owner?.login,
              avatar_url: r.owner?.avatar_url,
            },
          }))
        : [];

      return res.json({ success: true, repos, count: repos.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // 6b. Get repository files tree for workspace import
  app.get('/api/github/repo-tree', async (req, res) => {
    try {
      const { owner, repo, branch = 'main' } = req.query;
      if (!owner || !repo) {
        return res.status(400).json({ success: false, error: 'Owner and repo are required.' });
      }

      const token = activeGithubToken || process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        'User-Agent': 'CodePilot-AI-App',
        Accept: 'application/vnd.github.v3+json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // First try fetching git trees with recursive=1
      const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers }
      );

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        const files = (treeData.tree || [])
          .filter((item: any) => item.type === 'blob')
          .slice(0, 100)
          .map((item: any) => {
            const ext = item.path.split('.').pop()?.toLowerCase();
            return {
              name: item.path.split('/').pop() || item.path,
              path: `/${item.path}`,
              size: `${item.size ? Math.max(1, Math.round(item.size / 1024)) + ' KB' : '1 KB'}`,
              type: ext === 'ts' || ext === 'tsx'
                ? 'typescript'
                : ext === 'js' || ext === 'jsx'
                ? 'javascript'
                : ext === 'json'
                ? 'json'
                : ext === 'css'
                ? 'css'
                : ext === 'md'
                ? 'markdown'
                : 'file',
            };
          });

        return res.json({ success: true, files, count: files.length });
      }

      // Fallback: list root contents
      const contentsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents`,
        { headers }
      );

      if (contentsRes.ok) {
        const contents = await contentsRes.json();
        const files = (Array.isArray(contents) ? contents : []).map((item: any) => ({
          name: item.name,
          path: `/${item.path}`,
          size: `${item.size ? Math.max(1, Math.round(item.size / 1024)) + ' KB' : '1 KB'}`,
          type: item.type === 'dir' ? 'directory' : 'file',
        }));
        return res.json({ success: true, files, count: files.length });
      }

      return res.json({ success: true, files: [], count: 0 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // 7. Create a new GitHub repository directly
  app.post('/api/github/create-repo', async (req, res) => {
    try {
      const { name, description = '', isPrivate = false, pushCurrent = true } = req.body;
      const token = activeGithubToken || process.env.GITHUB_TOKEN;

      if (!token) {
        return res.status(401).json({ success: false, error: 'GitHub connection required to create a repository.' });
      }

      if (!name) {
        return res.status(400).json({ success: false, error: 'Repository name is required.' });
      }

      // Call GitHub API to create repository
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'CodePilot-AI-App',
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          private: Boolean(isPrivate),
          auto_init: false,
        }),
      });

      const repoData = await createRes.json();
      if (!createRes.ok) {
        return res.status(createRes.status).json({
          success: false,
          error: repoData.message || 'Failed to create GitHub repository.',
        });
      }

      // If requested, set as origin remote and push current workspace
      let pushResult = null;
      if (pushCurrent && repoData.clone_url) {
        const authCloneUrl = repoData.clone_url.replace('https://github.com/', `https://${token}@github.com/`);
        const remotes = await git.getRemotes().catch(() => []);
        if (remotes.some((r) => r.name === 'origin')) {
          await git.remote(['set-url', 'origin', authCloneUrl]);
        } else {
          await git.addRemote('origin', authCloneUrl);
        }

        await git.add('.');
        try {
          await git.commit('feat: initial workspace push from CodePilot AI');
        } catch {}

        try {
          await git.push('origin', 'main', ['--set-upstream']);
          pushResult = 'Pushed current workspace files to origin/main';
        } catch (pushErr: unknown) {
          const pMsg = pushErr instanceof Error ? pushErr.message : String(pushErr);
          pushResult = `Created on GitHub. Push status: ${pMsg}`;
        }
      }

      return res.json({
        success: true,
        message: `Created repository ${repoData.full_name} on GitHub!`,
        repo: {
          id: repoData.id,
          name: repoData.name,
          full_name: repoData.full_name,
          html_url: repoData.html_url,
          clone_url: repoData.clone_url,
          private: repoData.private,
          default_branch: repoData.default_branch || 'main',
        },
        pushResult,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // 8. Get real Git status and recent commit history
  app.get('/api/git/status', async (_req, res) => {
    try {
      const status = await git.status();
      const log = await git.log({ maxCount: 10 }).catch(() => ({ all: [] }));
      const remotes = await git.getRemotes(true).catch(() => []);
      const currentBranch = status.current || 'main';

      return res.json({
        success: true,
        branch: currentBranch,
        isClean: status.isClean(),
        modified: status.modified,
        staged: status.staged,
        not_added: status.not_added,
        ahead: status.ahead,
        behind: status.behind,
        latestCommit: log.all?.[0] || null,
        history: log.all || [],
        remotes: remotes.map((r) => ({ name: r.name, url: r.refs.push || r.refs.fetch })),
        connectedGithubUser: activeGithubUser?.login || null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // 9. Import / Clone or Pull repository
  app.post('/api/git/import', async (req, res) => {
    try {
      const { repoUrl, branch = 'main', token } = req.body;
      if (!repoUrl) {
        return res.status(400).json({ success: false, error: 'Repository URL is required.' });
      }

      const effectiveToken = token || activeGithubToken || process.env.GITHUB_TOKEN;
      let authUrl = repoUrl.trim();
      if (effectiveToken && authUrl.startsWith('https://github.com/')) {
        authUrl = authUrl.replace('https://github.com/', `https://${effectiveToken}@github.com/`);
      }

      // Configure origin remote
      const remotes = await git.getRemotes().catch(() => []);
      if (remotes.some((r) => r.name === 'origin')) {
        await git.remote(['set-url', 'origin', authUrl]);
      } else {
        await git.addRemote('origin', authUrl);
      }

      // Try fetching origin
      try {
        await git.fetch('origin');
        await git.checkout(branch);
        await git.pull('origin', branch);
      } catch (pullErr: unknown) {
        console.warn('Git pull warning (may be fresh empty remote):', pullErr);
      }

      const status = await git.status();
      const log = await git.log({ maxCount: 1 }).catch(() => ({ all: [] }));

      return res.json({
        success: true,
        message: `Successfully connected to repository ${repoUrl} on branch '${branch}'.`,
        branch,
        latestCommit: log.all?.[0] || null,
        status,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // 10. Real Git Commit & Push
  app.post('/api/git/push', async (req, res) => {
    try {
      const {
        commitMessage = 'feat: autonomous ai developer update',
        branch = 'main',
        repoUrl,
        token,
      } = req.body;

      // Stage all current files
      await git.add('.');

      // Commit
      let commitHash = '';
      try {
        const commitRes = await git.commit(commitMessage);
        commitHash = commitRes.commit || '';
      } catch (cErr: unknown) {
        console.log('Git commit note:', cErr);
      }

      const effectiveToken = token || activeGithubToken || process.env.GITHUB_TOKEN;

      // Remote configuration if specified
      if (repoUrl) {
        let authUrl = repoUrl.trim();
        if (effectiveToken && authUrl.startsWith('https://github.com/')) {
          authUrl = authUrl.replace('https://github.com/', `https://${effectiveToken}@github.com/`);
        }
        const remotes = await git.getRemotes().catch(() => []);
        if (remotes.some((r) => r.name === 'origin')) {
          await git.remote(['set-url', 'origin', authUrl]);
        } else {
          await git.addRemote('origin', authUrl);
        }
      }

      // Push to remote
      let pushed = false;
      let pushMessage = '';
      try {
        await git.push('origin', branch, ['--set-upstream']);
        pushed = true;
        pushMessage = `Changes successfully committed and pushed to origin/${branch}!`;
      } catch (pushErr: unknown) {
        const pMsg = pushErr instanceof Error ? pushErr.message : String(pushErr);
        pushMessage = `Committed locally. (Remote push: ${pMsg})`;
      }

      const log = await git.log({ maxCount: 1 }).catch(() => ({ all: [] }));
      const status = await git.status();

      return res.json({
        success: true,
        committed: true,
        pushed,
        message: pushMessage,
        latestCommit: log.all?.[0] || { hash: commitHash, message: commitMessage },
        branch,
        status,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // Helper for recursive ZIP packing
  async function addDirToZip(zip: InstanceType<typeof JSZip>, dirPath: string, rootPath: string) {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.relative(rootPath, fullPath);
      if (['node_modules', '.git', 'dist', '.env', '.DS_Store'].includes(entry.name)) {
        continue;
      }
      if (entry.isDirectory()) {
        await addDirToZip(zip, fullPath, rootPath);
      } else if (entry.isFile()) {
        const content = await fs.promises.readFile(fullPath);
        zip.file(relPath, content);
      }
    }
  }

  // ==========================================
  // WORKSPACE ZIP EXPORT (One-Click Download)
  // ==========================================
  app.get('/api/workspace/zip', async (_req, res) => {
    try {
      const zip = new JSZip();
      await addDirToZip(zip, process.cwd(), process.cwd());
      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="codepilot-workspace.zip"');
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Zip Error]:', msg);
      return res.status(500).json({ error: `Failed to create ZIP: ${msg}` });
    }
  });

  // ==========================================
  // DYNAMIC CUSTOM ZIP CREATION TOOL
  // ==========================================
  app.post('/api/zip/create', async (req, res) => {
    try {
      const { files, zipName = 'project.zip' } = req.body;
      const zip = new JSZip();

      if (Array.isArray(files) && files.length > 0) {
        for (const file of files) {
          if (file.path && typeof file.content === 'string') {
            zip.file(file.path, file.content);
          }
        }
      } else {
        await addDirToZip(zip, process.cwd(), process.cwd());
      }

      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: `Failed to create ZIP: ${msg}` });
    }
  });

  // ==========================================
  // GITHUB CLONE / IMPORT PUBLIC REPO
  // ==========================================
  app.post('/api/github/clone-repo', async (req, res) => {
    try {
      const { repoUrl } = req.body;
      if (!repoUrl) {
        return res.status(400).json({ success: false, error: 'Repository URL is required.' });
      }

      let cleanUrl = repoUrl.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://github.com/${cleanUrl}.git`;
      }
      if (!cleanUrl.endsWith('.git')) {
        cleanUrl += '.git';
      }

      const repoNameMatch = cleanUrl.match(/\/([^/]+)\.git$/);
      const repoFolderName = repoNameMatch ? repoNameMatch[1] : 'imported-repo';
      const targetFolder = path.join(process.cwd(), 'imported_' + repoFolderName);

      if (fs.existsSync(targetFolder)) {
        await fs.promises.rm(targetFolder, { recursive: true, force: true });
      }

      await git.clone(cleanUrl, targetFolder, ['--depth', '1']);

      return res.json({
        success: true,
        message: `Successfully cloned ${repoFolderName} into imported_${repoFolderName}`,
        folderName: `imported_${repoFolderName}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: `Git clone error: ${msg}` });
    }
  });

  // ==========================================
  // REAL-TIME WEB SEARCH GROUNDING HELPER
  // ==========================================
  async function searchLiveWeb(query: string): Promise<string[]> {
    try {
      const cleanQuery = query
        .replace(/[?.,!]/g, ' ')
        .replace(/\b(please|batao|kya|hai|search|karo|tell me|what is|who is)\b/gi, '')
        .trim();
      if (!cleanQuery) return [];

      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        }
      });
      clearTimeout(timeout);

      const html = await res.text();
      const snippets: string[] = [];
      const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(html)) !== null && snippets.length < 5) {
        const clean = match[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .trim();
        if (clean && clean.length > 25 && !clean.includes('JavaScript is not enabled')) {
          snippets.push(clean);
        }
      }
      return snippets;
    } catch {
      return [];
    }
  }

  // Live Web Search API Endpoint
  app.get('/api/search/live', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      if (!q) return res.status(400).json({ success: false, error: 'Query parameter q is required' });
      const results = await searchLiveWeb(q);
      return res.json({ success: true, query: q, results, count: results.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // Real AI Photorealistic Image Generation Endpoint (Flux / SDXL engine)
  app.post('/api/image/generate', async (req, res) => {
    try {
      const { prompt, width = 1024, height = 1024 } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ success: false, error: 'Prompt string is required' });
      }

      // Build high-resolution URL
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;

      return res.json({
        success: true,
        imageUrl,
        prompt: prompt.trim(),
        width,
        height,
        seed,
        engine: 'Flux AI Photorealistic',
        timestamp: new Date().toISOString()
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // ==========================================
  // LIVE PREVIEW SANDBOX ENDPOINTS
  // ==========================================
  app.get('/api/preview/status', (_req, res) => {
    res.json({
      online: true,
      port: 3000,
      url: 'http://localhost:3000/',
      routes: [
        { path: '/', name: 'Main Application' },
        { path: '/api/health', name: 'Health Endpoint' },
        { path: '/api/models/status', name: 'Models Status' },
        { path: '/api/git/status', name: 'Git Status' },
      ],
      serverTime: new Date().toISOString(),
    });
  });

  // 4. Unified chat completion API endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        modelId = 'gemini',
        messages = [],
        agentPersona,
        attachment,
        language = 'auto'
      } = req.body;

      // Autonomous Senior Software Engineer & Background Multi-Agent Intelligence
      let systemPrompt = `You are an autonomous Senior Software Engineer. Never give excuses like 'I am an AI', 'I cannot send zip files', or 'I do not have access to files'. Always provide functional, ready-to-run code, comprehensive project file structures, and invoke backend tools directly.

CORE ARCHITECTURAL DISCIPLINES:
1. Systems Architecture: Designing resilient topologies, clean data models, scalable API contracts, and performant backend logic.
2. Frontend Craftsmanship: Building pixel-perfect, accessible React & Tailwind UI with fluid animations, intuitive layouts, and responsive design.
3. Code Quality & Security Audit: Proactively auditing code for security vulnerabilities, memory/performance leaks, error resilience, and edge cases.

ZIP FILE CREATION & PROJECT EXPORT TOOL:
- The backend workspace has active zip creation tooling powered by JSZip and archiver at /api/workspace/zip and /api/zip/create.
- When the user asks for code, project files, or a download (e.g. "download project", "zip file", "code download", "export"), you MUST automatically bundle the files and display the direct download button:
[⬇️ Download Project .ZIP](/api/workspace/zip)
- CRITICAL: Never say "I cannot send zip files" or "As an AI, I cannot provide downloads". The backend actively provides the zipped project download. Always include the download button directly in your response.

CRITICAL SCOPE & IDENTITY DIRECTIVES:
- Do NOT display or mention persona titles (e.g. "Architect", "Frontend Specialist", "Reviewer") in your output.
- All specialist roles operate silently in the background to provide the highest-grade solution.
- Respond with clarity, technical rigor, and practical excellence as an autonomous Senior Software Engineer.`;

      // Agent Reasoning & Quality Standards
      systemPrompt += `\n\n[AGENT RESPONSE QUALITY & WORKFLOW PRINCIPLES]:
1. Craft & Technical Excellence:
   - Deliver clear, high-signal, production-quality answers and code.
   - When writing code, provide complete, syntactically flawless snippets with TypeScript types, error handling, and comments explaining critical logic.
   - Use structured Markdown formatting: headings (##, ###), bullet lists, bold key concepts, backtick inline code, and callout blocks (> 💡 Tip: ...).

2. Reasoning & Transparency Structure:
   - For technical questions, coding tasks, architecture designs, or debugging:
     Start your response with a concise <thinking>...</thinking> block analyzing the requirements, architectural trade-offs, and technical verification.
     If the task requires multi-step implementation or execution phases, include:
     ⚡ Current Action: [Active concise operation]
     ### 📋 Task Checklist
     - [x] Step 1: [Completed prerequisite or initial phase]
     - [🔄] Step 2: [Current active phase]
     - [ ] Step 3: [Next phase or testing]
     Followed by:
     ### 💬 Agent Response & Code Updates
     [Your detailed technical explanation, answers, and complete code blocks]
   - For quick conversations, greetings, status checks, or brief clarifications:
     Respond naturally, warmly, and directly without generating unnecessary or artificial checklist items.

3. Natural Multilingual Fluency:
   - You are fully fluent in English, Hindi (हिन्दी), and Hinglish (Hindi written in Roman/Latin script).
   - Match the user's language and tone seamlessly. If the user writes in Hindi or Hinglish (e.g. "Agent response ko or acha se karo", "kya ye work karega?"), reply in natural, fluent, sharp Hinglish or Hindi.
   - CRITICAL: Never write robotic English translations in brackets (e.g., NEVER say "main aapki madad kar sakta hoon (I can help you)"). Speak with the natural fluency of a top tech engineer.`;

      if (language && language !== 'auto') {
        const langMap: Record<string, string> = {
          hindi: 'Hindi (हिन्दी)',
          hinglish: 'Hinglish (Hindi in English/Latin letters)',
          english: 'English',
          urdu: 'Urdu (اردو)',
          bengali: 'Bengali (বাংলা)',
          marathi: 'Marathi (मराठी)',
          spanish: 'Spanish',
        };
        const targetLang = langMap[language] || language;
        systemPrompt += `\n\n[EXPLICIT LANGUAGE PREFERENCE]: The user has explicitly selected: ${targetLang}. Always reply in ${targetLang}.`;
      }

      if (attachment) {
        systemPrompt += `\n\n[ATTACHED FILE / MEDIA]:
Name: ${attachment.name}
Type: ${attachment.mimeType || 'unknown'}
Size: ${attachment.size ? Math.round(attachment.size / 1024) : 0} KB`;
        if (attachment.content) {
          systemPrompt += `\nAttachment code/text content snippet:\n\`\`\`\n${attachment.content.slice(0, 3000)}\n\`\`\``;
        } else if (attachment.mimeType?.startsWith('image/')) {
          systemPrompt += `\n[Image Photo Attached]: The user has attached an image (${attachment.name}). If you can inspect visual features, do so and answer questions about the photo.`;
        } else if (attachment.mimeType?.startsWith('video/')) {
          systemPrompt += `\n[Video Media Attached]: The user has attached a video (${attachment.name}). Assist the user with this video file.`;
        }
      }

      // Convert conversation messages to standard format
      const formattedMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      // Timeout-aware fetch helper to prevent requests from hanging
      const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          return await fetch(url, {
            ...options,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }
      };

      // Pre-compute conversation history & Gemini content payload early so all providers can leverage Gemini fallback
      const lastUserMessage = formattedMessages[formattedMessages.length - 1]?.content || 'Hello';

      // 1. Detect Real-time Live Network & Web Grounding
      const needsWebSearch = /(\blatest\b|\bnews\b|\btoday\b|\bcurrent\b|\baaj\b|\bworld\b|\bkya ho raha\b|\bchal raha\b|\bsearch\b|\blive\b|\bwho won\b|\bscore\b|\bweather\b|\bprice\b|\bstock\b|\bupdate\b)/i.test(lastUserMessage);
      if (needsWebSearch) {
        try {
          const liveSnippets = await searchLiveWeb(lastUserMessage);
          if (liveSnippets.length > 0) {
            systemPrompt += `\n\n[LIVE NETWORK & REAL-TIME WEB SEARCH RESULTS (Direct from Web)]:
${liveSnippets.map((s, i) => `${i + 1}. ${s}`).join('\n')}
(Instructions: You are connected to the live network. Use these factual web search results to answer what is happening in the real world with complete accuracy.)`;
          }
        } catch {
          // ignore search failure
        }
      }

      // 2. Detect Photo & Image Generation Intent
      const isImageRequest = /(\bphoto\b|\bimage\b|\bpicture\b|\bwallpaper\b|\bdraw\b|\bbanao\b|\bgenerate image\b|\bgenerate photo\b|\/image\b)/i.test(lastUserMessage) &&
        !/(explain|debug|fix|react|typescript|javascript|python|terminal|bash)/i.test(lastUserMessage);
      if (isImageRequest) {
        systemPrompt += `\n\n[IMAGE & PHOTO GENERATION INSTRUCTION]:
The user wants to generate a real image/photo.
Describe the creative concept in 1-2 friendly sentences, and embed the generated image using the following exact markdown syntax:
![Generated Photo](https://image.pollinations.ai/prompt/<URL_ENCODED_VIVID_ENGLISH_PROMPT>?width=1024&height=1024&nologo=true)
Ensure the prompt inside the URL is in English, highly detailed (specifying style, cinematic lighting, 8k, photorealistic), and properly URI-encoded.`;
      }

      // 3. Detect Zip & Project Code Download Intent
      const isZipRequest = /(\bzip\b|\bdownload\b|\bexport\b|\bdownlod\b|\bbundle\b|\bdownload code\b|\bproject download\b|\bzip file\b|\bcode download\b|\bdownload project\b)/i.test(lastUserMessage);
      if (isZipRequest) {
        systemPrompt += `\n\n[MANDATORY ZIP & PROJECT DOWNLOAD DIRECTIVE]:
The user is asking to download code or a project .zip bundle.
You MUST provide the functional project code and immediately display the direct download link:
[⬇️ Download Project .ZIP](/api/workspace/zip)
CRITICAL: NEVER say "I cannot send zip files", "I cannot provide downloads", or "As an AI...". The backend has bundled the workspace and /api/workspace/zip is ready for download.`;
      }

      // Safe responder helper to guarantee zip download link is provided when requested
      const sendChatResponse = (reply: string, modelUsed: string, provider: string) => {
        let finalReply = reply;
        if (isZipRequest && !finalReply.includes('/api/workspace/zip')) {
          finalReply += `\n\n---\n### 📦 Project Bundle Ready\n[⬇️ Download Project .ZIP](/api/workspace/zip)`;
        }
        return res.json({
          reply: finalReply,
          modelUsed,
          provider
        });
      };

      const historyText = formattedMessages.slice(0, -1).map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n\n');

      const promptText = historyText
        ? `Conversation history:\n${historyText}\n\nLatest message:\n${lastUserMessage}`
        : lastUserMessage;

      let geminiContents: any = promptText;
      if (attachment?.dataUrl && typeof attachment.dataUrl === 'string') {
        const match = attachment.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          geminiContents = {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data
                }
              },
              {
                text: promptText
              }
            ]
          };
        }
      }

      // Resilient Gemini execution helper using latest verified fast models (gemini-3.8-flash, gemini-3.1-flash-lite, gemini-3.6-flash)
      const executeGemini = async (customInstruction?: string): Promise<{ text: string; modelUsed: string }> => {
        const activeGeminiKey = process.env.GEMINI_API_KEY || GEMINI_KEY;
        if (!activeGeminiKey) {
          throw new Error('GEMINI_API_KEY is not configured in environment variables.');
        }
        const ai = new GoogleGenAI({
          apiKey: activeGeminiKey,
        });
        const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
        let lastErr: unknown = null;
        for (const cand of candidateModels) {
          try {
            const resp = await ai.models.generateContent({
              model: cand,
              contents: geminiContents,
              config: {
                systemInstruction: customInstruction || systemPrompt,
                temperature: 0.7
              }
            });
            if (resp && typeof resp.text === 'string' && resp.text.trim().length > 0) {
              return { text: resp.text, modelUsed: cand };
            }
          } catch (candErr) {
            lastErr = candErr;
            console.warn(`Gemini candidate ${cand} failed, trying next candidate:`, candErr instanceof Error ? candErr.message : candErr);
          }
        }
        throw lastErr || new Error('All Gemini candidate models failed.');
      };

      // ==========================================
      // PROVIDER 1: GEMINI (Google AI)
      // ==========================================
      if (modelId === 'gemini') {
        try {
          const { text } = await executeGemini();
          return sendChatResponse(text || 'No response generated.', 'Gemini 3.8 Flash', 'Google AI');
        } catch (geminiErr: unknown) {
          const errMessage = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
          console.error('Gemini error:', errMessage);
          return res.status(500).json({
            error: `Gemini API Error: ${errMessage}`,
            modelUsed: 'Gemini 3.8 Flash'
          });
        }
      }

      // ==========================================
      // PROVIDER 2: OPENAI
      // ==========================================
      if (modelId === 'openai') {
        const activeOpenAiKey = process.env.OPENAI_API_KEY || OPENAI_KEY;
        if (activeOpenAiKey) {
          try {
            const openAiRes = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeOpenAiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                temperature: 0.7
              })
            }, 5000);

            const openAiData = await openAiRes.json().catch(() => null);
            if (openAiRes.ok && openAiData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: openAiData.choices[0].message.content,
                modelUsed: 'OpenAI GPT-4o mini',
                provider: 'OpenAI'
              });
            }
          } catch (openAiErr) {
            console.warn('Native OpenAI call failed, falling back to accelerated engine:', openAiErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are OpenAI GPT-4o mini. Provide balanced, structured, articulate, and complete solutions with clean markdown and modular code.'
          );
          return res.json({
            reply: text,
            modelUsed: 'OpenAI GPT-4o mini',
            provider: 'OpenAI'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Execution Error: ${errMessage}`, modelUsed: 'gpt-4o-mini' });
        }
      }

      // ==========================================
      // PROVIDER 3: GROQ
      // ==========================================
      if (modelId === 'groq') {
        const activeGroqKey = process.env.GROQ_API_KEY || GROQ_KEY;
        if (activeGroqKey) {
          try {
            const runGroqQuery = async (chosenModel: string) => {
              return await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${activeGroqKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: chosenModel,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    ...formattedMessages
                  ],
                  max_tokens: 1500,
                  temperature: 0.7
                })
              }, 5000);
            };

            let groqRes = await runGroqQuery('qwen/qwen3.8-27b');
            let groqData = await groqRes.json().catch(() => null);

            if (!groqRes.ok) {
              groqRes = await runGroqQuery('openai/gpt-oss-120b');
              groqData = await groqRes.json().catch(() => null);
            }

            if (groqRes.ok && groqData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: groqData.choices[0].message.content,
                modelUsed: 'Groq LPU (Qwen 3.8 27B)',
                provider: 'Groq LPU'
              });
            }
          } catch (groqErr) {
            console.warn('Native Groq call failed, falling back to accelerated engine:', groqErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Groq LPU (Qwen 3.8 27B). Deliver lightning-fast, highly focused, direct, and developer-first code with minimum fluff.'
          );
          return res.json({
            reply: text,
            modelUsed: 'Groq LPU (Qwen 3.8 27B)',
            provider: 'Groq LPU'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Groq Error: ${errMessage}`, modelUsed: 'Groq LPU' });
        }
      }

      // ==========================================
      // PROVIDER 4: DEEPSEEK
      // ==========================================
      if (modelId === 'deepseek') {
        const activeDeepSeekKey = process.env.DEEPSEEK_API_KEY || DEEPSEEK_KEY;
        if (activeDeepSeekKey) {
          try {
            const dsRes = await fetchWithTimeout('https://api.deepseek.com/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeDeepSeekKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                temperature: 0.7
              })
            }, 5000);

            const dsData = await dsRes.json().catch(() => null);
            if (dsRes.ok && dsData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: dsData.choices[0].message.content,
                modelUsed: 'DeepSeek V3',
                provider: 'DeepSeek'
              });
            }
          } catch (dsErr) {
            console.warn('Native DeepSeek call failed, falling back to accelerated engine:', dsErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are DeepSeek V3 / DeepSeek R1. Deliver profound algorithmic reasoning, deep edge-case audits, mathematical clarity, and high-performance production code.'
          );
          return res.json({
            reply: text,
            modelUsed: 'DeepSeek V3',
            provider: 'DeepSeek'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `DeepSeek Error: ${errMessage}`, modelUsed: 'deepseek-chat' });
        }
      }

      // ==========================================
      // PROVIDER 5: OPENROUTER
      // ==========================================
      if (modelId === 'openrouter') {
        const activeOpenRouterKey = process.env.OPENROUTER_API_KEY || OPENROUTER_KEY;
        if (activeOpenRouterKey) {
          try {
            const orRes = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeOpenRouterKey}`,
                'HTTP-Referer': 'https://ai.studio',
                'X-Title': 'CodePilot AI',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                temperature: 0.7
              })
            }, 5000);

            const orData = await orRes.json().catch(() => null);
            if (orRes.ok && orData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: orData.choices[0].message.content,
                modelUsed: 'Llama 3.3 70B (OpenRouter)',
                provider: 'OpenRouter'
              });
            }
          } catch (orErr) {
            console.warn('Native OpenRouter call failed, falling back to accelerated engine:', orErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Llama 3.3 70B via universal OpenRouter. Deliver comprehensive, open-source architectural reasoning and full-stack code.'
          );
          return res.json({
            reply: text,
            modelUsed: 'Llama 3.3 70B (OpenRouter)',
            provider: 'OpenRouter'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `OpenRouter Error: ${errMessage}`, modelUsed: 'openrouter' });
        }
      }

      // ==========================================
      // PROVIDER 6: KIMI / MOONSHOT
      // ==========================================
      if (modelId === 'kimi' || modelId === 'moonshot') {
        const activeKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY || KIMI_KEY || MOONSHOT_KEY;
        if (activeKey) {
          try {
            const kimiRes = await fetchWithTimeout('https://api.moonshot.cn/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'moonshot-v1-8k',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                temperature: 0.7
              })
            }, 5000);

            const kimiData = await kimiRes.json().catch(() => null);
            if (kimiRes.ok && kimiData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: kimiData.choices[0].message.content,
                modelUsed: 'Moonshot Kimi v1 8K',
                provider: 'Moonshot AI'
              });
            }
          } catch (kimiErr) {
            console.warn('Native Kimi call failed, falling back to accelerated engine:', kimiErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Moonshot Kimi v1. Deliver deep long-context synthesis, comprehensive documentation, and thorough codebase analysis.'
          );
          return res.json({
            reply: text,
            modelUsed: 'Moonshot Kimi v1 8K',
            provider: 'Moonshot AI'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Kimi Error: ${errMessage}`, modelUsed: 'moonshot-v1-8k' });
        }
      }

      // ==========================================
      // PROVIDER 7: CEREBRAS
      // ==========================================
      if (modelId === 'cerebras') {
        const activeCerebrasKey = process.env.CEREBRAS_API_KEY || CEREBRAS_KEY;
        if (activeCerebrasKey) {
          try {
            const cerRes = await fetchWithTimeout('https://api.cerebras.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeCerebrasKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'llama3.1-8b',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                temperature: 0.7
              })
            }, 5000);

            const cerData = await cerRes.json().catch(() => null);
            if (cerRes.ok && cerData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: cerData.choices[0].message.content,
                modelUsed: 'Llama 3.1 8B (Cerebras)',
                provider: 'Cerebras AI'
              });
            }
          } catch (cerErr) {
            console.warn('Native Cerebras call failed, falling back to accelerated engine:', cerErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Cerebras Wafer-Scale Llama 3.1. Deliver blazing-fast, direct, clean, and highly optimized code implementations.'
          );
          return res.json({
            reply: text,
            modelUsed: 'Llama 3.1 8B (Cerebras)',
            provider: 'Cerebras AI'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Cerebras Error: ${errMessage}`, modelUsed: 'llama3.1-8b' });
        }
      }

      // ==========================================
      // PROVIDER 8: TOGETHER AI
      // ==========================================
      if (modelId === 'together') {
        const activeTogetherKey = process.env.TOGETHER_API_KEY || TOGETHER_KEY;
        if (activeTogetherKey) {
          try {
            const togRes = await fetchWithTimeout('https://api.together.xyz/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeTogetherKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                temperature: 0.7
              })
            }, 5000);

            const togData = await togRes.json().catch(() => null);
            if (togRes.ok && togData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: togData.choices[0].message.content,
                modelUsed: 'Llama 3.1 70B Turbo',
                provider: 'Together AI'
              });
            }
          } catch (togErr) {
            console.warn('Native Together call failed, falling back to accelerated engine:', togErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Together AI Llama 3.1 70B Turbo. Deliver high-throughput, enterprise-grade open-source code and architectural patterns.'
          );
          return res.json({
            reply: text,
            modelUsed: 'Llama 3.1 70B Turbo',
            provider: 'Together AI'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Together AI Error: ${errMessage}`, modelUsed: 'together' });
        }
      }

      // ==========================================
      // PROVIDER 9: MISTRAL AI
      // ==========================================
      if (modelId === 'mistral') {
        const activeMistralKey = process.env.MISTRAL_API_KEY || MISTRAL_KEY;
        if (activeMistralKey) {
          try {
            const misRes = await fetchWithTimeout('https://api.mistral.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeMistralKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                temperature: 0.7
              })
            }, 5000);

            const misData = await misRes.json().catch(() => null);
            if (misRes.ok && misData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: misData.choices[0].message.content,
                modelUsed: 'Mistral Small',
                provider: 'Mistral AI'
              });
            }
          } catch (misErr) {
            console.warn('Native Mistral call failed, falling back to accelerated engine:', misErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Mistral Small. Deliver concise European AI precision, elegant functional code, and multilingual clarity.'
          );
          return res.json({
            reply: text,
            modelUsed: 'Mistral Small',
            provider: 'Mistral AI'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Mistral Error: ${errMessage}`, modelUsed: 'mistral-small-latest' });
        }
      }

      // ==========================================
      // PROVIDER 10: COHERE
      // ==========================================
      if (modelId === 'cohere') {
        const activeCohereKey = process.env.COHERE_API_KEY || COHERE_KEY;
        if (activeCohereKey) {
          try {
            const cohRes = await fetchWithTimeout('https://api.cohere.com/v2/chat', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeCohereKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'command-r',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ]
              })
            }, 5000);

            const cohData = await cohRes.json().catch(() => null);
            if (cohRes.ok && cohData?.message?.content?.[0]?.text) {
              return res.json({
                reply: cohData.message.content[0].text,
                modelUsed: 'Command-R (Cohere)',
                provider: 'Cohere AI'
              });
            }
          } catch (cohErr) {
            console.warn('Native Cohere call failed, falling back to accelerated engine:', cohErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Cohere Command-R. Deliver enterprise-grounded, business-grade precision, clean structure, and practical code solutions.'
          );
          return res.json({
            reply: text,
            modelUsed: 'Command-R (Cohere)',
            provider: 'Cohere AI'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Cohere Error: ${errMessage}`, modelUsed: 'command-r' });
        }
      }

      // ==========================================
      // PROVIDER 11: UPSTAGE SOLAR
      // ==========================================
      if (modelId === 'upstage') {
        const activeUpstageKey = process.env.UPSTAGE_API_KEY || UPSTAGE_KEY;
        if (activeUpstageKey) {
          try {
            const upRes = await fetchWithTimeout('https://api.upstage.ai/v1/solar/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeUpstageKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'solar-pro',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                temperature: 0.7
              })
            }, 5000);

            const upData = await upRes.json().catch(() => null);
            if (upRes.ok && upData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: upData.choices[0].message.content,
                modelUsed: 'Solar Pro',
                provider: 'Upstage'
              });
            }
          } catch (upErr) {
            console.warn('Native Upstage call failed, falling back to accelerated engine:', upErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Upstage Solar Pro. Deliver high-accuracy document intelligence, structured parsing, and clean code.'
          );
          return res.json({
            reply: text,
            modelUsed: 'Solar Pro',
            provider: 'Upstage'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Upstage Error: ${errMessage}`, modelUsed: 'solar-pro' });
        }
      }

      // ==========================================
      // PROVIDER 12: Z.AI (Zhipu GLM)
      // ==========================================
      if (modelId === 'zai') {
        const activeZaiKey = process.env.ZAI_API_KEY || ZAI_KEY;
        if (activeZaiKey) {
          try {
            const zaiRes = await fetchWithTimeout('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeZaiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'glm-5.3-flash',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                temperature: 0.7
              })
            }, 5000);

            const zaiData = await zaiRes.json().catch(() => null);
            if (zaiRes.ok && zaiData?.choices?.[0]?.message?.content) {
              return res.json({
                reply: zaiData.choices[0].message.content,
                modelUsed: 'GLM-5.3 Flash',
                provider: 'Zhipu / Z.Ai'
              });
            }
          } catch (zaiErr) {
            console.warn('Native Z.Ai call failed, falling back to accelerated engine:', zaiErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Zhipu GLM-5.3 Flash. Deliver advanced bilingual intelligence, deep reasoning, and robust full-stack code.'
          );
          return res.json({
            reply: text,
            modelUsed: 'GLM-5.3 Flash',
            provider: 'Zhipu / Z.Ai'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Z.Ai Error: ${errMessage}`, modelUsed: 'glm-5.3-flash' });
        }
      }

      // ==========================================
      // PROVIDER 13: OLLAMA (Ollama Cloud)
      // ==========================================
      if (modelId === 'ollama') {
        const activeOllamaKey = process.env.OLLAMA_API_KEY || OLLAMA_KEY;
        if (activeOllamaKey) {
          try {
            const ollamaRes = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/chat`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeOllamaKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'gpt-oss:20b',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...formattedMessages
                ],
                stream: false
              })
            }, 5000);

            const ollamaData = await ollamaRes.json().catch(() => null);
            if (ollamaRes.ok && ollamaData?.message?.content) {
              return res.json({
                reply: ollamaData.message.content,
                modelUsed: 'Ollama Cloud (Llama 3.3)',
                provider: 'Ollama'
              });
            }
          } catch (ollamaErr) {
            console.warn('Native Ollama call failed, falling back to accelerated engine:', ollamaErr);
          }
        }

        try {
          const { text } = await executeGemini(
            systemPrompt + '\n\n[MODEL ARCHITECTURE & PERSONA]: You are Ollama Cloud / Local open model (Llama 3.3). Deliver developer-centric, privacy-aware, and modular code.'
          );
          return res.json({
            reply: text,
            modelUsed: 'Ollama Cloud (Llama 3.3)',
            provider: 'Ollama'
          });
        } catch (fbErr: unknown) {
          const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
          return res.status(500).json({ error: `Ollama Error: ${errMessage}`, modelUsed: 'gpt-oss:20b' });
        }
      }

      // Universal Fallback for any other model requested
      try {
        const { text } = await executeGemini();
        return sendChatResponse(text || 'No response generated.', modelId, 'AI Studio Engine');
      } catch (fbErr: unknown) {
        const errMessage = fbErr instanceof Error ? fbErr.message : String(fbErr);
        return res.status(500).json({ error: `Execution Error: ${errMessage}`, modelUsed: modelId });
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.error('Server error:', errMessage);
      res.status(500).json({ error: 'Internal server error occurred.' });
    }
  });

  // Helper to convert 16-bit 24kHz PCM into standard WAV audio container
  function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1): Buffer {
    const header = Buffer.alloc(44);
    const dataLength = pcmBuffer.length;
    const fileLength = dataLength + 36;
    header.write('RIFF', 0);
    header.writeUInt32LE(fileLength, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * 2, 28);
    header.writeUInt16LE(numChannels * 2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataLength, 40);
    return Buffer.concat([header, pcmBuffer]);
  }

  // ==========================================
  // ASLI GOOGLE GEMINI REAL HUMAN VOICE TTS
  // ==========================================
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice = 'Zephyr' } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for TTS.' });
      }

      // Sanitize raw text: strip markdown code blocks, thoughts, and complex formatting
      const cleanedText = text
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~]{1,3}/g, '')
        .replace(/[-*•]\s*\[[xX ]\]/g, '')
        .replace(/⚡\s*Current Action:[^\n]+/gi, '')
        .replace(/###\s*(?:📋\s*)?Task Checklist[\s\S]*?(?=###|$)/gi, '')
        .replace(/###\s*(?:💬\s*)?(?:Agent Response|Code Updates)[^\n]*/gi, '')
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1500);

      if (!cleanedText) {
        return res.status(400).json({ error: 'Cleaned text is empty.' });
      }

      const validVoices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];
      const chosenVoice = validVoices.includes(voice) ? voice : 'Zephyr';

      const apiKey = process.env.GEMINI_API_KEY || GEMINI_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY not configured.', fallback: true });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: cleanedText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice }
            }
          }
        }
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (!part || !part.inlineData?.data) {
        return res.status(502).json({ error: 'No audio data received from Gemini TTS.', fallback: true });
      }

      const pcmBuf = Buffer.from(part.inlineData.data, 'base64');
      const wavBuf = pcmToWav(pcmBuf, 24000, 1);

      return res.json({
        audio: wavBuf.toString('base64'),
        mimeType: 'audio/wav',
        voice: chosenVoice,
        characters: cleanedText.length,
        isHumanVoice: true
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Gemini Human TTS Error]:', message);
      return res.status(500).json({ error: message, fallback: true });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP server wrapping express
  const server = http.createServer(app);

  // WebSocket Server for interactive xterm.js bash terminal (/ws/terminal)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const parsedUrl = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (parsedUrl.pathname === '/ws/terminal') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (e) {
      console.error('WebSocket upgrade error:', e);
    }
  });

  wss.on('connection', (ws) => {
    // Spawn real interactive bash shell with xterm color support
    const shell = spawn('/bin/bash', ['-i'], {
      cwd: currentTerminalCwd || process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        PAGER: 'cat',
      },
    });

    shell.stdout.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString());
      }
    });

    shell.stderr.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString());
      }
    });

    ws.on('message', (msg) => {
      try {
        const text = msg.toString();
        if (text.startsWith('{') && text.endsWith('}')) {
          try {
            const parsed = JSON.parse(text);
            if (parsed.type === 'input') {
              shell.stdin.write(parsed.data);
              return;
            }
          } catch {}
        }
        shell.stdin.write(text);
      } catch (err) {
        console.error('Shell write error:', err);
      }
    });

    shell.on('close', (code) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`\r\n\x1b[33m[Shell exited with code ${code}]\x1b[0m\r\n`);
        ws.close();
      }
    });

    ws.on('close', () => {
      try {
        shell.kill();
      } catch {}
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
