import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider, useVault } from './context/VaultContext';
import { JournalProvider } from './context/JournalContext';
import { GoogleLoginPage } from './components/Auth/GoogleLoginPage';
import { VaultSetupModal } from './components/Vault/VaultSetupModal';
import { VaultUnlockScreen } from './components/Vault/VaultUnlockScreen';
import { JournalApp } from './components/JournalApp';
import { Feather, Lock } from 'lucide-react';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { isVaultSetup, isUnlocked, loadingVault, vaultDoc } = useVault();

  // App-level preferences
  const [theme, setTheme] = useState<'linen' | 'midnight' | 'minimal'>('linen');
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans'>('serif');

  // Sync saved preferences from vault doc if available
  useEffect(() => {
    if (vaultDoc?.themePreference) {
      setTheme(vaultDoc.themePreference);
    }
    if (vaultDoc?.fontPreference) {
      setFontStyle(vaultDoc.fontPreference);
    }
  }, [vaultDoc]);

  // Apply dark mode class to document element for Tailwind dark utilities
  useEffect(() => {
    if (theme === 'midnight') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Loading state
  if (authLoading || (user && loadingVault)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-950 p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-amber-700 flex items-center justify-center text-white shadow-lg animate-pulse">
              <Feather className="w-7 h-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-stone-900 text-amber-400 p-1 rounded-full border border-stone-800">
              <Lock className="w-3 h-3" />
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-stone-800 dark:text-stone-200 text-lg">
              Sanctuary Journal
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Securing connection and preparing your vault...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in with Google
  if (!user) {
    return <GoogleLoginPage />;
  }

  // Signed in, but has never set up an encrypted vault passphrase
  if (isVaultSetup === false) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
        <VaultSetupModal />
      </div>
    );
  }

  // Signed in and vault is initialized, but currently locked
  if (!isUnlocked) {
    return <VaultUnlockScreen />;
  }

  // Fully authenticated and unlocked!
  return (
    <JournalProvider>
      <JournalApp
        fontStyle={fontStyle}
        onChangeFontStyle={setFontStyle}
        theme={theme}
        onChangeTheme={setTheme}
      />
    </JournalProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </AuthProvider>
  );
}
