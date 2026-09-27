import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  KeyRound, 
  Type, 
  Palette, 
  X, 
  Check, 
  AlertTriangle,
  Lock
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { useJournal } from '../../context/JournalContext';
import { useAuth } from '../../context/AuthContext';
import { db, doc, setDoc } from '../../firebase/config';

interface SettingsModalProps {
  onClose: () => void;
  fontStyle: 'serif' | 'sans';
  onChangeFontStyle: (style: 'serif' | 'sans') => void;
  theme: 'linen' | 'midnight' | 'minimal';
  onChangeTheme: (theme: 'linen' | 'midnight' | 'minimal') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  fontStyle,
  onChangeFontStyle,
  theme,
  onChangeTheme,
}) => {
  const { vaultDoc, changePassphrase } = useVault();
  const { entries } = useJournal();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'security' | 'appearance' | 'passphrase'>('security');

  // Change passphrase state
  const [currentPassphrase, setCurrentPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [isChangingPassphrase, setIsChangingPassphrase] = useState(false);
  const [passphraseStatus, setPassphraseStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hint editing
  const [hintInput, setHintInput] = useState(vaultDoc?.hint || '');
  const [isSavingHint, setIsSavingHint] = useState(false);
  const [hintSaved, setHintSaved] = useState(false);

  const handlePassphraseChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassphraseStatus(null);

    if (newPassphrase.length < 8) {
      setPassphraseStatus({ type: 'error', message: 'New passphrase must be at least 8 characters long.' });
      return;
    }

    if (newPassphrase !== confirmPassphrase) {
      setPassphraseStatus({ type: 'error', message: 'New passphrases do not match.' });
      return;
    }

    try {
      setIsChangingPassphrase(true);
      const success = await changePassphrase(currentPassphrase, newPassphrase, entries);
      if (success) {
        setPassphraseStatus({
          type: 'success',
          message: `Successfully re-encrypted all ${entries.length} entries with your new master passphrase!`,
        });
        setCurrentPassphrase('');
        setNewPassphrase('');
        setConfirmPassphrase('');
      } else {
        setPassphraseStatus({ type: 'error', message: 'Current passphrase was incorrect. Please try again.' });
      }
    } catch (err: any) {
      setPassphraseStatus({ type: 'error', message: err.message || 'Failed to update passphrase' });
    } finally {
      setIsChangingPassphrase(false);
    }
  };

  const handleSaveHint = async () => {
    if (!user) return;
    try {
      setIsSavingHint(true);
      await setDoc(doc(db, 'users', user.uid), { hint: hintInput.trim() }, { merge: true });
      setHintSaved(true);
      setTimeout(() => setHintSaved(false), 2500);
    } catch (err) {
      console.error('Error saving hint:', err);
    } finally {
      setIsSavingHint(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Journal & Vault Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4 pb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Encryption & Security
          </button>
          <button
            onClick={() => setActiveTab('passphrase')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'passphrase'
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Change Passphrase
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'appearance'
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Appearance
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Zero-Knowledge Security Active</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                  Your journal entries are encrypted on your local device before being sent to the cloud. Even if the database is intercepted, only ciphertext is stored.
                </p>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 grid grid-cols-2 gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                  <div>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Cipher:</span> AES-256-GCM
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Derivation:</span> PBKDF2 (100k rounds)
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Auth:</span> Google OAuth 2.0
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Sync:</span> Firebase Firestore
                  </div>
                </div>
              </div>

              {/* Passphrase Hint editor */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Passphrase Recovery Hint
                </label>
                <p className="text-stone-500 dark:text-stone-400 mb-2">
                  A clue shown on the unlock screen if you ever forget your passphrase.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hintInput}
                    onChange={(e) => setHintInput(e.target.value)}
                    placeholder="e.g. Favorite book and childhood pet..."
                    className="flex-1 px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleSaveHint}
                    disabled={isSavingHint}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors cursor-pointer text-xs"
                  >
                    {hintSaved ? <Check className="w-4 h-4" /> : 'Save Hint'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'passphrase' && (
            <form onSubmit={handlePassphraseChange} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Changing your passphrase will decrypt all existing entries with your current key and immediately re-encrypt them with the new key.
                </span>
              </div>

              {passphraseStatus && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    passphraseStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {passphraseStatus.message}
                </div>
              )}

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Current Passphrase
                </label>
                <input
                  type="password"
                  required
                  value={currentPassphrase}
                  onChange={(e) => setCurrentPassphrase(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  New Passphrase (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Confirm New Passphrase
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassphrase}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors cursor-pointer text-xs disabled:opacity-50 mt-2"
              >
                {isChangingPassphrase ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Re-Encrypt Vault with New Key</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4 text-xs">
              {/* Font Style Selection */}
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  Journal Typography
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onChangeFontStyle('serif')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      fontStyle === 'serif'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-serif font-bold text-sm text-stone-800 dark:text-stone-200 mb-1">
                      Classic Serif
                    </div>
                    <p className="text-[11px] text-stone-500 font-serif italic">
                      "Words are seeds of reflection..."
                    </p>
                  </button>

                  <button
                    onClick={() => onChangeFontStyle('sans')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      fontStyle === 'sans'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-sans font-bold text-sm text-stone-800 dark:text-stone-200 mb-1">
                      Modern Clean
                    </div>
                    <p className="text-[11px] text-stone-500 font-sans">
                      Crisp, modern, distraction-free
                    </p>
                  </button>
                </div>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  Sanctuary Theme
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => onChangeTheme('linen')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      theme === 'linen'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                        : 'border-stone-200 bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 mx-auto mb-1" />
                    <span>Linen Paper</span>
                  </button>

                  <button
                    onClick={() => onChangeTheme('minimal')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      theme === 'minimal'
                        ? 'border-amber-500 bg-stone-100 text-stone-900 font-semibold'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white border border-stone-300 mx-auto mb-1" />
                    <span>Pure White</span>
                  </button>

                  <button
                    onClick={() => onChangeTheme('midnight')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      theme === 'midnight'
                        ? 'border-amber-500 bg-stone-900 text-amber-400 font-semibold'
                        : 'border-stone-700 bg-stone-900 text-stone-300'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-stone-950 border border-stone-700 mx-auto mb-1" />
                    <span>Midnight</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
