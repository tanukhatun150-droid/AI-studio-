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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Keys with environment variable or fallback from user input
const GROQ_KEY = process.env.GROQ_API_KEY || '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';
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6Ls0Z-bdzqBRRtzxdTgTrVqV8m_IqCBH0VT4gPxprWUiA';
const OLLAMA_KEY = process.env.OLLAMA_API_KEY || 'b46816c47a914c87af08820434691ec2.OZB7TbwztskChpRPeMx47mRz';
const KIMI_KEY = process.env.KIMI_API_KEY || 'sk-C66WwejK0dwuUfcTPCELAL7bGapnpHgU9f0vVuLoPKUKsg86Xs';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com';

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
    res.json({
      providers: {
        groq: {
          configured: Boolean(GROQ_KEY),
          model: 'openai/gpt-oss-20b',
          name: 'Groq LPU',
          status: 'ready'
        },
        gemini: {
          configured: Boolean(GEMINI_KEY),
          model: 'gemini-3.8-flash',
          name: 'Google AI Gemini',
          status: 'ready'
        },
        ollama: {
          configured: Boolean(OLLAMA_KEY),
          model: 'gpt-oss:20b',
          name: 'Ollama Cloud',
          status: 'ready'
        },
        kimi: {
          configured: Boolean(KIMI_KEY),
          model: 'moonshot-v1-8k',
          name: 'Moonshot Kimi',
          status: 'ready'
        }
      }
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

      // Base system prompt tailored to the selected persona
      let systemPrompt = agentPersona?.systemPrompt ||
        'You are an expert AI development assistant in the AI Agent Home workspace. Provide concise, clear, production-quality code, insights, and solutions.';

      // Multi-Agent Transparent Workflow Instruction & Output Structure
      systemPrompt += `\n\n[MANDATORY MULTI-AGENT WORKFLOW & OUTPUT FORMAT]:
You must structure EVERY response using the following transparent multi-agent workflow layout without exception:

<thinking>
Write a crisp analysis of the user request, logical steps, architectural reasoning, or verification checklist.
</thinking>

⚡ Current Action: [Brief description of what action is being executed, e.g., "Synthesizing UI components and writing code updates"]

### 📋 Task Checklist
- [x] Completed: [Prerequisite or initial completed step]
- [🔄] In Progress: [Active operation or current focus]
- [ ] Pending: [Next phase or testing]

### 💬 Agent Response & Code Updates
[Your conversational response, explanations, and full code blocks]

CRITICAL: Every response MUST begin with the <thinking>...</thinking> block, followed immediately by ⚡ Current Action:, then ### 📋 Task Checklist, and finally ### 💬 Agent Response & Code Updates.`;

      // Multilingual System Instructions
      systemPrompt += `\n\n[MULTILINGUAL CAPABILITIES & INSTRUCTIONS]:
You are a highly skilled, fluent multilingual AI assistant. You can seamlessly understand, process, and respond in:
- Hindi (हिन्दी) - Devanagari script (स्पष्ट, प्रामाणिक और सहज)
- Hinglish (Hindi written using Roman/Latin alphabet, e.g. "haan main aapki poori madad kar sakta hoon, bataiye kya karna hai")
- English (Clear, concise, professional)
- Urdu (اردو), Bengali (বাংলা), Punjabi (ਪੰਜਾਬੀ), Marathi (मराठी), Gujarati (ગુજરાતી), Tamil, Telugu
- Spanish, French, German, Arabic, Chinese, Japanese, and all other global languages.
Rules:
1. Automatic Language Matching: Always detect the language, script, and dialect of the user's latest query. If the user talks to you in Hindi or Hinglish, reply back warmly and naturally in the exact same language (Hindi or Hinglish)!
2. Tone: Friendly, intelligent, and helpful.`;

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

      // ==========================================
      // PROVIDER 1: GEMINI (Google AI)
      // ==========================================
      if (modelId === 'gemini') {
        try {
          const ai = new GoogleGenAI({
            apiKey: GEMINI_KEY,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build'
              }
            }
          });

          // Build contents for Gemini generateContent
          const lastUserMessage = formattedMessages[formattedMessages.length - 1]?.content || 'Hello';
          const historyText = formattedMessages.slice(0, -1).map((m: { role: string; content: string }) =>
            `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
          ).join('\n\n');

          const promptText = historyText
            ? `Conversation history:\n${historyText}\n\nLatest message:\n${lastUserMessage}`
            : lastUserMessage;

          // Check if attachment has dataUrl (image or video inline data)
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

          let geminiResponse;
          try {
            geminiResponse = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: geminiContents,
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.7
              }
            });
          } catch (firstErr: unknown) {
            const errStr = String(firstErr);
            // If 503 or temporary high demand spike, retry with gemini-3.1-flash-lite
            if (errStr.includes('503') || errStr.includes('demand') || errStr.includes('UNAVAILABLE')) {
              console.warn('Retrying with gemini-3.1-flash-lite due to 503 spike...');
              geminiResponse = await ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: geminiContents,
                config: {
                  systemInstruction: systemPrompt,
                  temperature: 0.7
                }
              });
            } else {
              throw firstErr;
            }
          }

          return res.json({
            reply: geminiResponse.text || 'No response generated.',
            modelUsed: 'gemini (Google AI)',
            provider: 'Google AI'
          });
        } catch (geminiErr: unknown) {
          const errMessage = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
          console.error('Gemini error:', errMessage);
          return res.status(500).json({
            error: `Gemini API Error: ${errMessage}`,
            modelUsed: 'gemini-3.8-flash'
          });
        }
      }

      // ==========================================
      // PROVIDER 2: GROQ
      // ==========================================
      if (modelId === 'groq') {
        try {
          const runGroqQuery = async (chosenModel: string) => {
            return await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
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
            });
          };

          let groqRes = await runGroqQuery('qwen/qwen3.8-27b');
          let groqData = await groqRes.json();

          if (!groqRes.ok) {
            console.warn('Groq qwen attempt failed, falling back to openai/gpt-oss-120b:', groqData?.error?.message);
            groqRes = await runGroqQuery('openai/gpt-oss-120b');
            groqData = await groqRes.json();
          }

          if (!groqRes.ok) {
            console.warn('Groq gpt-oss-120b attempt failed, falling back to openai/gpt-oss-20b:', groqData?.error?.message);
            groqRes = await runGroqQuery('openai/gpt-oss-20b');
            groqData = await groqRes.json();
          }

          if (!groqRes.ok) {
            const msg = groqData?.error?.message || `Groq returned status ${groqRes.status}`;
            throw new Error(msg);
          }

          const reply = groqData.choices?.[0]?.message?.content || 'No response from Groq.';
          return res.json({
            reply,
            modelUsed: 'Groq LPU (qwen/qwen3.8-27b)',
            provider: 'Groq LPU'
          });
        } catch (groqErr: unknown) {
          const errMessage = groqErr instanceof Error ? groqErr.message : String(groqErr);
          console.error('Groq error:', errMessage);
          return res.status(500).json({
            error: `Groq API Error: ${errMessage}`,
            modelUsed: 'Groq LPU'
          });
        }
      }

      // ==========================================
      // PROVIDER 3: OLLAMA (Ollama Cloud)
      // ==========================================
      if (modelId === 'ollama') {
        try {
          const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OLLAMA_KEY}`,
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
          });

          const ollamaData = await ollamaRes.json();
          if (!ollamaRes.ok) {
            const msg = ollamaData?.error || `Ollama returned status ${ollamaRes.status}`;
            throw new Error(msg);
          }

          const reply = ollamaData.message?.content || 'No response from Ollama.';
          return res.json({
            reply,
            modelUsed: 'gpt-oss:20b (Ollama Cloud)',
            provider: 'Ollama'
          });
        } catch (ollamaErr: unknown) {
          const errMessage = ollamaErr instanceof Error ? ollamaErr.message : String(ollamaErr);
          console.error('Ollama error:', errMessage);
          return res.status(500).json({
            error: `Ollama API Error: ${errMessage}`,
            modelUsed: 'gpt-oss:20b'
          });
        }
      }

      // ==========================================
      // PROVIDER 4: KIMI (Moonshot AI)
      // ==========================================
      if (modelId === 'kimi') {
        try {
          const kimiRes = await fetch('https://api.moonshot.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${KIMI_KEY}`,
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
          });

          const kimiData = await kimiRes.json();
          if (!kimiRes.ok) {
            const msg = kimiData?.error?.message || `Moonshot/Kimi returned status ${kimiRes.status}`;
            throw new Error(msg);
          }

          const reply = kimiData.choices?.[0]?.message?.content || 'No response from Kimi.';
          return res.json({
            reply,
            modelUsed: 'moonshot-v1-8k (Kimi)',
            provider: 'Moonshot AI'
          });
        } catch (kimiErr: unknown) {
          const errMessage = kimiErr instanceof Error ? kimiErr.message : String(kimiErr);
          console.error('Kimi error:', errMessage);
          return res.status(500).json({
            error: `Kimi/Moonshot API Error: ${errMessage}. Please verify that this Moonshot API key is activated on platform.moonshot.cn.`,
            modelUsed: 'moonshot-v1-8k'
          });
        }
      }

      // Fallback
      return res.status(400).json({ error: `Unsupported model: ${modelId}` });
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.error('Server error:', errMessage);
      res.status(500).json({ error: 'Internal server error occurred.' });
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
