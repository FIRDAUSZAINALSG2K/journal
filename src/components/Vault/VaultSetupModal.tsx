import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { KeyRound, ShieldAlert, Eye, EyeOff, Lock, Sparkles, Check } from 'lucide-react';

export const VaultSetupModal: React.FC = () => {
  const { setupVault } = useVault();
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [hint, setHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strength calculation
  const getStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getStrength(passphrase);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passphrase.length < 8) {
      setError('Please choose a passphrase with at least 8 characters for your security.');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError('The passphrases do not match. Please verify and retype.');
      return;
    }

    try {
      setIsSubmitting(true);
      await setupVault(passphrase, hint);
    } catch (err: any) {
      console.error('Vault setup error:', err);
      setError(err.message || 'Failed to initialize encrypted vault. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-stone-900 dark:text-stone-100">
            Create Your Encryption Passphrase
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
            Your journal entries are encrypted client-side using <strong>AES-256-GCM</strong>. Your passphrase is never sent to the server.
          </p>
        </div>

        <div className="mb-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <p className="leading-relaxed">
            <strong>Important:</strong> Because this is zero-knowledge encryption, if you forget your passphrase, nobody can recover your entries. Write it down or save it in your password manager.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Master Passphrase (min 8 characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Choose a strong, memorable passphrase..."
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

            {/* Passphrase strength meter */}
            {passphrase.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      strength <= 2
                        ? 'bg-red-500 w-1/3'
                        : strength <= 3
                        ? 'bg-amber-500 w-2/3'
                        : 'bg-emerald-500 w-full'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  {strength <= 2 ? 'Weak passphrase' : strength <= 3 ? 'Good passphrase' : 'Very strong passphrase'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Confirm Passphrase
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              placeholder="Confirm your passphrase..."
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Passphrase Hint (Optional)
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. Favorite book + lucky number..."
              className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              The hint is stored to assist your memory if you ever forget.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Initialize Encrypted Sanctuary</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
