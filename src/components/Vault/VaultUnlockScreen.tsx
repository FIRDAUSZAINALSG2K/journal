import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVault } from '../../context/VaultContext';
import { Lock, Unlock, Eye, EyeOff, LogOut, HelpCircle, ShieldCheck } from 'lucide-react';

export const VaultUnlockScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { vaultDoc, unlockVault } = useVault();

  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passphrase) {
      setError('Please enter your vault passphrase.');
      return;
    }

    try {
      setIsUnlocking(true);
      const success = await unlockVault(passphrase);
      if (!success) {
        setError('Incorrect passphrase. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to decrypt vault. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-between p-6">
      {/* Top Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-700 dark:bg-amber-600 flex items-center justify-center text-white">
            <Lock className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-stone-800 dark:text-stone-200 text-base">
            Sanctuary Journal
          </span>
        </div>

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-7 h-7 rounded-full border border-stone-300 dark:border-stone-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">
                {user?.displayName ? user.displayName[0] : 'U'}
              </div>
            )}
            <span className="hidden sm:inline font-medium text-stone-700 dark:text-stone-300">
              {user?.displayName || user?.email}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Unlock Card */}
      <main className="max-w-md w-full mx-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-xl my-auto">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mb-3 ring-8 ring-amber-50 dark:ring-stone-800/40">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-stone-900 dark:text-stone-100">
            Journal Locked
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
            Enter your master passphrase to decrypt your daily entries.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Master Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase to unlock..."
                className="w-full px-4 py-2.5 pr-10 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Hint support */}
          {vaultDoc?.hint && (
            <div className="text-right">
              {showHint ? (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/50 text-left">
                  <span className="font-semibold">Passphrase Hint:</span> {vaultDoc.hint}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>View passphrase hint</span>
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUnlocking ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Decrypt & Open Journal</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Decryption occurs 100% locally on your machine</span>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-stone-400">
        Sanctuary Journal • Zero-Knowledge Architecture
      </footer>
    </div>
  );
};
