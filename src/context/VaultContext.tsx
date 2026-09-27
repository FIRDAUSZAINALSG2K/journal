import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { 
  db, 
  doc, 
  getDoc, 
  setDoc,
  collection,
  getDocs
} from '../firebase/config';
import { 
  generateSalt, 
  deriveKey, 
  createVaultVerifier, 
  verifyVaultKey, 
  encryptData,
  decryptData
} from '../services/crypto';
import type { UserVaultDoc, JournalEntry, FirestoreEntryDoc, EncryptedEntryPayload } from '../types/journal';

interface VaultContextType {
  isVaultSetup: boolean | null; // null during loading
  isUnlocked: boolean;
  vaultDoc: UserVaultDoc | null;
  cryptoKey: CryptoKey | null;
  loadingVault: boolean;
  setupVault: (passphrase: string, hint?: string) => Promise<void>;
  unlockVault: (passphrase: string) => Promise<boolean>;
  lockVault: () => void;
  updatePreferences: (prefs: Partial<Pick<UserVaultDoc, 'themePreference' | 'fontPreference'>>) => Promise<void>;
  changePassphrase: (
    currentPassphrase: string,
    newPassphrase: string,
    entries: JournalEntry[]
  ) => Promise<boolean>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [vaultDoc, setVaultDoc] = useState<UserVaultDoc | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [loadingVault, setLoadingVault] = useState<boolean>(true);
  const [isVaultSetup, setIsVaultSetup] = useState<boolean | null>(null);

  // Load user's vault metadata when auth state changes
  useEffect(() => {
    let isMounted = true;

    async function loadVault() {
      if (!user) {
        setVaultDoc(null);
        setCryptoKey(null);
        setIsVaultSetup(null);
        setLoadingVault(false);
        return;
      }

      setLoadingVault(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userDocRef);

        if (!isMounted) return;

        if (snapshot.exists()) {
          const data = snapshot.data() as UserVaultDoc;
          setVaultDoc(data);
          setIsVaultSetup(Boolean(data.salt && data.verifier));
        } else {
          setVaultDoc(null);
          setIsVaultSetup(false);
        }
      } catch (err) {
        console.error('Error loading vault config:', err);
        if (isMounted) {
          setIsVaultSetup(false);
        }
      } finally {
        if (isMounted) {
          setLoadingVault(false);
        }
      }
    }

    loadVault();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Set up a new vault for first-time user
  const setupVault = async (passphrase: string, hint?: string) => {
    if (!user) throw new Error('User must be signed in to set up vault');

    const salt = generateSalt();
    const key = await deriveKey(passphrase, salt);
    const verifier = await createVaultVerifier(key);

    const newVaultDoc: UserVaultDoc = {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      salt,
      verifier,
      hint: hint?.trim() || '',
      themePreference: 'linen',
      fontPreference: 'serif',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, newVaultDoc, { merge: true });

    setVaultDoc(newVaultDoc);
    setCryptoKey(key);
    setIsVaultSetup(true);
  };

  // Unlock existing vault with passphrase
  const unlockVault = async (passphrase: string): Promise<boolean> => {
    if (!vaultDoc) return false;

    try {
      const key = await deriveKey(passphrase, vaultDoc.salt);
      const isCorrect = await verifyVaultKey(vaultDoc.verifier, key);

      if (isCorrect) {
        setCryptoKey(key);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to unlock vault:', err);
      return false;
    }
  };

  // Lock vault by clearing in-memory key
  const lockVault = () => {
    setCryptoKey(null);
  };

  // Update vault display preferences
  const updatePreferences = async (
    prefs: Partial<Pick<UserVaultDoc, 'themePreference' | 'fontPreference'>>
  ) => {
    if (!user || !vaultDoc) return;
    const updated = { ...vaultDoc, ...prefs, updatedAt: Date.now() };
    setVaultDoc(updated);
    try {
      await setDoc(doc(db, 'users', user.uid), prefs, { merge: true });
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  // Change vault passphrase and re-encrypt entries
  const changePassphrase = async (
    currentPassphrase: string,
    newPassphrase: string,
    entries: JournalEntry[]
  ): Promise<boolean> => {
    if (!user || !vaultDoc) return false;

    // Verify current passphrase
    const oldKey = await deriveKey(currentPassphrase, vaultDoc.salt);
    const isValid = await verifyVaultKey(vaultDoc.verifier, oldKey);
    if (!isValid) {
      return false;
    }

    // Derive new key with fresh salt
    const newSalt = generateSalt();
    const newKey = await deriveKey(newPassphrase, newSalt);
    const newVerifier = await createVaultVerifier(newKey);

    // Re-encrypt all current entries
    for (const entry of entries) {
      const payload: EncryptedEntryPayload = {
        title: entry.title,
        contentHtml: entry.contentHtml,
        plainText: entry.plainText,
        mood: entry.mood,
        tags: entry.tags,
        wordCount: entry.wordCount,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };

      const encrypted = await encryptData(payload, newKey);
      const entryRef = doc(db, 'users', user.uid, 'entries', entry.id);

      const firestoreDoc: FirestoreEntryDoc = {
        id: entry.id,
        userId: user.uid,
        date: entry.date,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        version: 1,
        isFavorite: entry.isFavorite,
        hasContent: Boolean(entry.plainText.trim() || entry.title.trim()),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };

      await setDoc(entryRef, firestoreDoc);
    }

    // Update user vault doc
    const updatedVaultDoc: UserVaultDoc = {
      ...vaultDoc,
      salt: newSalt,
      verifier: newVerifier,
      updatedAt: Date.now(),
    };

    await setDoc(doc(db, 'users', user.uid), {
      salt: newSalt,
      verifier: newVerifier,
      updatedAt: Date.now(),
    }, { merge: true });

    setVaultDoc(updatedVaultDoc);
    setCryptoKey(newKey);
    return true;
  };

  return (
    <VaultContext.Provider
      value={{
        isVaultSetup,
        isUnlocked: Boolean(cryptoKey),
        vaultDoc,
        cryptoKey,
        loadingVault,
        setupVault,
        unlockVault,
        lockVault,
        updatePreferences,
        changePassphrase,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
