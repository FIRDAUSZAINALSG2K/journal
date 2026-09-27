import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Sparkles, Feather, KeyRound, CheckCircle2 } from 'lucide-react';

export const GoogleLoginPage: React.FC = () => {
  const { signInWithGoogle, authError, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      // Handled in context
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-amber-50/30 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex flex-col justify-between p-6">
      {/* Top Brand bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-700 dark:bg-amber-600 flex items-center justify-center text-white shadow-sm">
            <Feather className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-bold text-stone-900 dark:text-stone-100 text-lg tracking-wide">
              Sanctuary
            </span>
            <span className="text-amber-700 dark:text-amber-500 font-serif italic text-xs ml-1.5">
              Journal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 bg-white/70 dark:bg-stone-900/80 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 backdrop-blur-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>AES-256 Client-Side Encryption</span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="max-w-md w-full mx-auto bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 rounded-3xl p-8 sm:p-10 shadow-xl my-auto">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 mb-4 ring-8 ring-amber-50/50 dark:ring-stone-800/40">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-display tracking-tight">
            Your Private Inner World
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-2.5 leading-relaxed font-serif">
            A daily sanctuary for honest thoughts, reflection, and creativity—secured with zero-knowledge encryption.
          </p>
        </div>

        {/* Error notification */}
        {authError && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start justify-between">
            <span>{authError}</span>
            <button onClick={clearError} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3.5 px-6 py-3.5 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-100 font-medium text-sm rounded-xl border border-stone-300 dark:border-stone-700 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-stone-400 border-t-amber-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            )}
            <span>{isSigningIn ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          <p className="text-center text-[11px] text-stone-400 dark:text-stone-500">
            Sign in safely using your Google account to sync your encrypted entries across devices.
          </p>
        </div>

        {/* Security Feature Highlights */}
        <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Zero-Knowledge:</strong> Your entries are encrypted in your browser using AES-GCM 256-bit before being stored.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Master Passphrase:</strong> Only you hold the decryption key. Nobody else can ever read your entries.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Rich Text & Daily Streaks:</strong> Beautiful typography, prompts, moods, and formatting.
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-stone-400 dark:text-stone-600">
        Sanctuary Journal • Web Cryptography API • Powered by Firebase Firestore & Auth
      </footer>
    </div>
  );
};
