import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useVault } from './VaultContext';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from '../firebase/config';
import { encryptData, decryptData } from '../services/crypto';
import type { 
  JournalEntry, 
  FirestoreEntryDoc, 
  EncryptedEntryPayload, 
  MoodType 
} from '../types/journal';

interface SaveStatus {
  state: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt?: Date;
  error?: string;
}

interface JournalContextType {
  entries: JournalEntry[];
  loadingEntries: boolean;
  selectedDate: string; // 'YYYY-MM-DD'
  activeEntry: JournalEntry | null;
  saveStatus: SaveStatus;
  setSelectedDate: (date: string) => void;
  saveCurrentEntry: (data: {
    title: string;
    contentHtml: string;
    plainText: string;
    mood?: MoodType;
    tags: string[];
    isFavorite?: boolean;
  }) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  toggleFavorite: (entryId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedMoodFilter: MoodType | 'all';
  setSelectedMoodFilter: (mood: MoodType | 'all') => void;
  selectedTagFilter: string | null;
  setSelectedTagFilter: (tag: string | null) => void;
  filteredEntries: JournalEntry[];
  allTags: string[];
  datesWithEntries: Map<string, { mood?: MoodType; wordCount: number; hasContent: boolean }>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

// Helper to get today's date in 'YYYY-MM-DD' format
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { cryptoKey, isUnlocked } = useVault();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: 'idle' });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<MoodType | 'all'>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Real-time synchronization and client-side decryption
  useEffect(() => {
    if (!user || !isUnlocked || !cryptoKey) {
      setEntries([]);
      setLoadingEntries(false);
      return;
    }

    setLoadingEntries(true);
    const entriesRef = collection(db, 'users', user.uid, 'entries');

    const unsubscribe = onSnapshot(entriesRef, async (snapshot) => {
      const decryptedList: JournalEntry[] = [];

      for (const docSnapshot of snapshot.docs) {
        const raw = docSnapshot.data() as FirestoreEntryDoc;
        try {
          const payload = await decryptData<EncryptedEntryPayload>(
            raw.ciphertext,
            raw.iv,
            cryptoKey
          );

          decryptedList.push({
            id: raw.id || docSnapshot.id,
            date: raw.date,
            title: payload.title || '',
            contentHtml: payload.contentHtml || '',
            plainText: payload.plainText || '',
            mood: payload.mood,
            tags: payload.tags || [],
            wordCount: payload.wordCount || 0,
            createdAt: payload.createdAt || raw.createdAt || Date.now(),
            updatedAt: payload.updatedAt || raw.updatedAt || Date.now(),
            isFavorite: raw.isFavorite ?? false,
          });
        } catch (decryptErr) {
          console.warn(`Could not decrypt entry ${docSnapshot.id}:`, decryptErr);
          // If decryption fails for single entry, still show metadata fallback
          decryptedList.push({
            id: raw.id || docSnapshot.id,
            date: raw.date,
            title: '🔒 Encrypted Entry',
            contentHtml: '<p><em>Unable to decrypt with current key</em></p>',
            plainText: '',
            tags: [],
            wordCount: 0,
            createdAt: raw.createdAt || Date.now(),
            updatedAt: raw.updatedAt || Date.now(),
            isFavorite: raw.isFavorite ?? false,
          });
        }
      }

      // Sort entries descending by date and updated timestamp
      decryptedList.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.updatedAt - a.updatedAt;
      });

      setEntries(decryptedList);
      setLoadingEntries(false);
    }, (error) => {
      console.error('Firestore entries subscription error:', error);
      setLoadingEntries(false);
    });

    return () => unsubscribe();
  }, [user, isUnlocked, cryptoKey]);

  // Find or generate active entry for selected date
  const activeEntry = useMemo(() => {
    const existing = entries.find((e) => e.date === selectedDate);
    if (existing) return existing;

    // Return empty draft skeleton
    return {
      id: `entry_${selectedDate}`,
      date: selectedDate,
      title: '',
      contentHtml: '',
      plainText: '',
      tags: [],
      wordCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
    };
  }, [entries, selectedDate]);

  // Map of dates for fast calendar highlighting
  const datesWithEntries = useMemo(() => {
    const map = new Map<string, { mood?: MoodType; wordCount: number; hasContent: boolean }>();
    for (const e of entries) {
      const hasContent = Boolean(e.plainText.trim() || e.title.trim());
      map.set(e.date, {
        mood: e.mood,
        wordCount: e.wordCount,
        hasContent,
      });
    }
    return map;
  }, [entries]);

  // Aggregate all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Mood filter
      if (selectedMoodFilter !== 'all' && entry.mood !== selectedMoodFilter) {
        return false;
      }

      // Tag filter
      if (selectedTagFilter && !entry.tags.includes(selectedTagFilter)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesContent = entry.plainText.toLowerCase().includes(q);
        const matchesDate = entry.date.includes(q);
        const matchesTag = entry.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesDate && !matchesTag) {
          return false;
        }
      }

      return true;
    });
  }, [entries, selectedMoodFilter, selectedTagFilter, searchQuery]);

  // Save current entry encrypted
  const saveCurrentEntry = useCallback(async (data: {
    title: string;
    contentHtml: string;
    plainText: string;
    mood?: MoodType;
    tags: string[];
    isFavorite?: boolean;
  }) => {
    if (!user || !cryptoKey) {
      setSaveStatus({ state: 'error', error: 'Vault must be unlocked to save encrypted entries.' });
      return;
    }

    setSaveStatus({ state: 'saving' });

    try {
      const entryId = `entry_${selectedDate}`;
      const now = Date.now();
      const existing = entries.find((e) => e.id === entryId || e.date === selectedDate);

      // Clean calculate word count
      const wordCount = data.plainText
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

      const payload: EncryptedEntryPayload = {
        title: data.title.trim(),
        contentHtml: data.contentHtml,
        plainText: data.plainText,
        mood: data.mood,
        tags: data.tags,
        wordCount,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      // Client-side AES-GCM encryption
      const encrypted = await encryptData(payload, cryptoKey);

      const firestoreDoc: FirestoreEntryDoc = {
        id: entryId,
        userId: user.uid,
        date: selectedDate,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        version: 1,
        isFavorite: data.isFavorite ?? existing?.isFavorite ?? false,
        hasContent: Boolean(data.plainText.trim() || data.title.trim()),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
      await setDoc(entryRef, firestoreDoc);

      setSaveStatus({ state: 'saved', lastSavedAt: new Date() });
    } catch (err: any) {
      console.error('Error saving encrypted entry:', err);
      setSaveStatus({ state: 'error', error: err.message || 'Failed to encrypt and save entry' });
    }
  }, [user, cryptoKey, selectedDate, entries]);

  // Delete an entry
  const deleteEntry = useCallback(async (entryId: string) => {
    if (!user) return;
    try {
      const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
      await deleteDoc(entryRef);
    } catch (err) {
      console.error('Failed to delete entry:', err);
      throw err;
    }
  }, [user]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (entryId: string) => {
    if (!user) return;
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    try {
      const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
      await setDoc(entryRef, { isFavorite: !entry.isFavorite }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  }, [user, entries]);

  return (
    <JournalContext.Provider
      value={{
        entries,
        loadingEntries,
        selectedDate,
        activeEntry,
        saveStatus,
        setSelectedDate,
        saveCurrentEntry,
        deleteEntry,
        toggleFavorite,
        searchQuery,
        setSearchQuery,
        selectedMoodFilter,
        setSelectedMoodFilter,
        selectedTagFilter,
        setSelectedTagFilter,
        filteredEntries,
        allTags,
        datesWithEntries,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};
