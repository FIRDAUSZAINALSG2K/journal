export type MoodType = 
  | 'peaceful'
  | 'grateful'
  | 'thoughtful'
  | 'energetic'
  | 'creative'
  | 'anxious'
  | 'melancholy'
  | 'accomplished';

export interface MoodConfig {
  id: MoodType;
  label: string;
  emoji: string;
  color: string;
}

export const MOODS: MoodConfig[] = [
  { id: 'peaceful', label: 'Peaceful', emoji: '🌿', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'grateful', label: 'Grateful', emoji: '✨', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'thoughtful', label: 'Reflective', emoji: '🌊', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { id: 'creative', label: 'Inspired', emoji: '🎨', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'accomplished', label: 'Accomplished', emoji: '🏆', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { id: 'anxious', label: 'Anxious', emoji: '🌧️', color: 'text-stone-700 bg-stone-100 border-stone-300' },
  { id: 'melancholy', label: 'Heavy-hearted', emoji: '🍂', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
];

/**
 * Decrypted in-memory representation of an entry
 */
export interface JournalEntry {
  id: string;             // Typically format "entry_YYYY-MM-DD" or unique ID
  date: string;           // "YYYY-MM-DD"
  title: string;
  contentHtml: string;
  plainText: string;
  mood?: MoodType;
  tags: string[];
  wordCount: number;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
}

/**
 * Encrypted payload that gets stored in Firestore
 */
export interface EncryptedEntryPayload {
  title: string;
  contentHtml: string;
  plainText: string;
  mood?: MoodType;
  tags: string[];
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Firestore Document schema for each entry under /users/{userId}/entries/{entryId}
 */
export interface FirestoreEntryDoc {
  id: string;
  userId: string;
  date: string;           // "YYYY-MM-DD" for calendar & list queries
  ciphertext: string;     // AES-GCM encrypted payload
  iv: string;             // Initialization vector (base64)
  version: number;        // encryption schema version (1)
  isFavorite?: boolean;
  hasContent: boolean;    // boolean flag so calendar knows which days have entries without decrypting
  createdAt: number;
  updatedAt: number;
}

/**
 * Firestore Document schema for user's vault settings under /users/{userId}
 */
export interface UserVaultDoc {
  userId: string;
  email: string;
  displayName?: string;
  salt: string;           // Base64 PBKDF2 salt
  verifier: {
    ciphertext: string;
    iv: string;
  };
  hint?: string;          // Optional user passphrase hint
  themePreference?: 'linen' | 'midnight' | 'minimal';
  fontPreference?: 'serif' | 'sans';
  createdAt: number;
  updatedAt: number;
}
