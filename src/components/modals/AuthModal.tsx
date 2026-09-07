import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Github,
  Flame,
  Copy,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  auth,
  googleProvider,
  githubProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  mapFirebaseUserToProfile,
  formatFirebaseError,
  firebaseConfig,
} from '../../lib/firebase';

export type AuthMode = 'signin' | 'signup' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: AuthMode;
  initialEmail?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
  initialEmail = '',
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Sync initial mode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setUnauthorizedDomain(null);
      if (initialEmail) setEmail(initialEmail);
    }
  }, [isOpen, initialMode, initialEmail]);

  if (!isOpen) return null;

  // Real Firebase Google Authentication
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const fbResult = await signInWithPopup(auth, googleProvider);
      if (fbResult?.user) {
        const profile = mapFirebaseUserToProfile(fbResult.user);
        setSuccessMessage(`Signed in via Google as ${profile.name}`);
        setUnauthorizedDomain(null);
        setTimeout(() => {
          onSuccess(profile);
          onClose();
        }, 600);
      }
    } catch (err: unknown) {
      console.error('[Firebase Google Auth Error]:', err);
      const isUnauthDomain =
        (err as { code?: string })?.code === 'auth/unauthorized-domain' ||
        String(err).includes('auth/unauthorized-domain');
      if (isUnauthDomain) {
        setUnauthorizedDomain(typeof window !== 'undefined' ? window.location.hostname : 'current domain');
      }
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Real Firebase GitHub Authentication
  const handleGithubAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const fbResult = await signInWithPopup(auth, githubProvider);
      if (fbResult?.user) {
        const profile = mapFirebaseUserToProfile(fbResult.user);
        setSuccessMessage(`Signed in via GitHub as ${profile.name}`);
        setUnauthorizedDomain(null);
        setTimeout(() => {
          onSuccess(profile);
          onClose();
        }, 600);
      }
    } catch (err: unknown) {
      console.error('[Firebase GitHub Auth Error]:', err);
      const isUnauthDomain =
        (err as { code?: string })?.code === 'auth/unauthorized-domain' ||
        String(err).includes('auth/unauthorized-domain');
      if (isUnauthDomain) {
        setUnauthorizedDomain(typeof window !== 'undefined' ? window.location.hostname : 'current domain');
      }
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Real Firebase Email & Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (result?.user) {
        const profile = mapFirebaseUserToProfile(result.user);
        setSuccessMessage(`Welcome back, ${profile.name}!`);
        setTimeout(() => {
          onSuccess(profile);
          onClose();
        }, 600);
      }
    } catch (err: unknown) {
      console.error('[Firebase SignIn Error]:', err);
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Real Firebase Email & Password Account Registration
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (userCredential?.user) {
        // Update user's display name
        try {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        } catch {
          // Non-blocking profile name update
        }

        // Send real email verification from Firebase
        try {
          await sendEmailVerification(userCredential.user);
        } catch {
          // Non-blocking verification email
        }

        const profile = mapFirebaseUserToProfile(userCredential.user);
        profile.name = name.trim();

        setSuccessMessage('Firebase account created successfully!');
        setTimeout(() => {
          onSuccess(profile);
          onClose();
        }, 700);
      }
    } catch (err: unknown) {
      console.error('[Firebase SignUp Error]:', err);
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Real Firebase Password Reset Email
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage(
        `Firebase password reset link sent to ${email.trim()}. Please check your email inbox.`
      );
    } catch (err: unknown) {
      console.error('[Firebase Reset Password Error]:', err);
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { label: '', percent: 0, color: 'bg-zinc-700' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: 'Weak', percent: 25, color: 'bg-red-500' };
    if (score === 2) return { label: 'Fair', percent: 50, color: 'bg-amber-500' };
    if (score === 3) return { label: 'Good', percent: 75, color: 'bg-sky-500' };
    return { label: 'Strong', percent: 100, color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-[440px] rounded-2xl border border-[#2e313b] bg-[#14161c] p-6 sm:p-7 shadow-2xl text-white overflow-hidden"
      >
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-[#232630] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-md shadow-orange-500/20">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                CodePilot AI
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  Firebase
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Production Cloud Authentication</p>
            </div>
          </div>

          <div
            id="auth-firebase-status-badge"
            title={`Project: ${firebaseConfig.projectId}`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e2029] border border-amber-500/30 text-[10px] text-amber-300 shrink-0 font-mono"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{firebaseConfig.projectId}</span>
          </div>
        </div>

        {/* Firebase Authorized Domain Helper Card */}
        {unauthorizedDomain && (
          <div
            id="auth-unauthorized-domain-card"
            className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 space-y-2.5 animate-in fade-in"
          >
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Firebase Authorized Domain Required</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-300">
              Google/GitHub popup authentication requires adding this app&apos;s domain to your Firebase Authorized Domains whitelist.
            </p>
            <div className="flex items-center gap-2 bg-[#181a20] p-2 rounded-lg border border-amber-500/30">
              <code className="text-[11px] font-mono text-amber-300 flex-1 truncate select-all">
                {unauthorizedDomain}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(unauthorizedDomain);
                  setCopiedDomain(true);
                  setTimeout(() => setCopiedDomain(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedDomain ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 hover:text-amber-200 underline font-medium"
              >
                <span>Add in Firebase Console Settings</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="border-t border-amber-500/20 pt-2 text-[11px] text-amber-100/90">
              ✨ <strong>Quick alternative:</strong> You can create an account or sign in with <strong>Email &amp; Password</strong> below right away without domain setup!
            </div>
          </div>
        )}

        {/* Notification Toasts (Error / Success) */}
        {errorMessage && !unauthorizedDomain && (
          <div
            id="auth-error-banner"
            className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            id="auth-success-banner"
            className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* VIEW 1: SIGN IN (LOGIN) */}
        {mode === 'signin' && (
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">Sign In</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Authenticate with your Firebase project credentials.
              </p>
            </div>

            {/* Social Logins: Google & GitHub via Firebase */}
            <div className="space-y-2.5 mb-5">
              {/* Google Button */}
              <button
                id="btn-auth-google-signin"
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 h-10 px-4 rounded-xl border border-[#30333e] bg-[#1a1d26] hover:bg-[#222530] hover:border-[#424654] text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* GitHub Button */}
              <button
                id="btn-auth-github-signin"
                type="button"
                onClick={handleGithubAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 h-10 px-4 rounded-xl border border-[#30333e] bg-[#1a1d26] hover:bg-[#222530] hover:border-[#424654] text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <Github className="w-4 h-4 text-white" />
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-full border-t border-[#2a2d37]" />
              <span className="absolute bg-[#14161c] px-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                or email and password
              </span>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="input-login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#30333e] bg-[#1a1d26] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-zinc-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#30333e] bg-[#1a1d26] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-400">Remember session</span>
                </label>
              </div>

              <button
                id="btn-submit-signin"
                type="submit"
                disabled={isLoading}
                className="w-full h-10 mt-2 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-[#14161c] font-semibold text-xs transition-all shadow-md shadow-amber-500/25 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In with Firebase</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Sign Up */}
            <div className="mt-5 text-center text-xs text-zinc-400">
              Don&apos;t have an account?{' '}
              <button
                id="btn-switch-to-signup"
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Create an account
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CREATE ACCOUNT (SIGN UP) */}
        {mode === 'signup' && (
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">Create Account</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Register a new user in Firebase project <span className="text-amber-300 font-mono">{firebaseConfig.projectId}</span>.
              </p>
            </div>

            {/* Social Signups */}
            <div className="space-y-2.5 mb-5">
              <button
                id="btn-auth-google-signup"
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 h-10 px-4 rounded-xl border border-[#30333e] bg-[#1a1d26] hover:bg-[#222530] hover:border-[#424654] text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <button
                id="btn-auth-github-signup"
                type="button"
                onClick={handleGithubAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 h-10 px-4 rounded-xl border border-[#30333e] bg-[#1a1d26] hover:bg-[#222530] hover:border-[#424654] text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <Github className="w-4 h-4 text-white" />
                <span>Sign up with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-full border-t border-[#2a2d37]" />
              <span className="absolute bg-[#14161c] px-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                or sign up with email
              </span>
            </div>

            {/* Email Signup Form */}
            <form onSubmit={handleEmailSignUp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="input-signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#30333e] bg-[#1a1d26] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="input-signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#30333e] bg-[#1a1d26] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="input-signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-[#30333e] bg-[#1a1d26] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 text-right">
                      Strength: <span className="font-semibold text-zinc-200">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <button
                id="btn-submit-signup"
                type="submit"
                disabled={isLoading}
                className="w-full h-10 mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-[0.99] text-[#14161c] font-semibold text-xs transition-all shadow-md shadow-amber-500/25 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Create Firebase Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Sign In */}
            <div className="mt-5 text-center text-xs text-zinc-400">
              Already have an account?{' '}
              <button
                id="btn-switch-to-signin"
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">Reset Password</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Enter your registered email and Firebase will send a secure password reset link.
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#30333e] bg-[#1a1d26] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#14161c] font-semibold text-xs transition-all shadow-md shadow-amber-500/25 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Password Reset Email</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
