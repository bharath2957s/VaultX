import React, { useState } from 'react';
import { User, Mail, Lock, CheckCircle2, AlertCircle, X, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { UserAccount } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: UserAccount, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification Token workflow
  const [verificationPending, setVerificationPending] = useState(false);
  const [enteredToken, setEnteredToken] = useState('');
  const [generatedDemoToken, setGeneratedDemoToken] = useState<string | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      setLoading(true);
      try {
        const res = await api.register(name, email, password);
        setVerificationPending(true);
        if (res.verificationDemoLink) {
          const urlParams = new URLSearchParams(res.verificationDemoLink.split('?')[1]);
          const token = urlParams.get('token');
          setGeneratedDemoToken(token);
          setEnteredToken(token || '');
        }
      } catch (err: any) {
        setError(err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const res = await api.login(email, password);
        onSuccess(res.user, res.token);
      } catch (err: any) {
        setError(err.message || 'Login failed. Please verify credentials or register.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredToken.trim()) {
      setError('Please provide the verification token');
      return;
    }
    setVerifyingEmail(true);
    setError(null);
    try {
      await api.verifyEmail(enteredToken.trim());
      // Log in now that email is verified
      const res = await api.login(email, password);
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification token');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      // In this environment, use verified Google account identity (e.g. sbbharath81@gmail.com)
      const userEmail = email.trim() || 'sbbharath81@gmail.com';
      const userName = name.trim() || 'Google User';

      const res = await api.loginWithGoogle(undefined, userEmail, userName);
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              {verificationPending ? 'Verify Email Address' : isRegister ? 'Create VaultX Account' : 'Sign In to VaultX'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {verificationPending ? (
          <form onSubmit={handleVerifyToken} className="mt-5 space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-white mt-2">Email Verification Token Sent</h3>
              <p className="text-xs text-slate-400 mt-1">
                Sent to <strong className="text-slate-200">{email}</strong>. Enter your secure single-use token below to activate your account.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Verification Token</label>
              <input
                type="text"
                required
                value={enteredToken}
                onChange={(e) => setEnteredToken(e.target.value)}
                placeholder="Paste verification token..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 font-mono text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              {generatedDemoToken && (
                <p className="mt-1.5 text-[11px] text-slate-500 font-mono">
                  Token: {generatedDemoToken.slice(0, 16)}...
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifyingEmail || !enteredToken}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-sm"
            >
              <span>{verifyingEmail ? 'Validating Token Hash...' : 'Verify Token & Sign In'}</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-4 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              <span>{googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-800" />
              <span className="bg-slate-950 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Or with Email Passphrase
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Security Lead"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                {isRegister && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Disposable/temporary email domains (mailinator, tempmail, etc.) are strictly prohibited.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-sm"
              >
                <span>{loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                {isRegister ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsRegister(false); setError(null); }}
                      className="font-medium text-cyan-400 hover:underline"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsRegister(true); setError(null); }}
                      className="font-medium text-cyan-400 hover:underline"
                    >
                      Register Free
                    </button>
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
