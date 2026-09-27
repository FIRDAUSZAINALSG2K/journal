import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Minus, 
  Highlighter, 
  Link as LinkIcon, 
  Undo, 
  Redo, 
  Sparkles, 
  Clock, 
  Check, 
  Lock, 
  Save, 
  Star, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Tag,
  X,
  Type
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import { MOODS, type MoodType } from '../../types/journal';

// Journaling prompt questions
const DAILY_PROMPTS = [
  "What is one small moment that brought unexpected joy or gratitude today?",
  "What challenged you today, and how did you handle or respond to it?",
  "What is a thought or feeling you've been carrying that you want to release onto the page?",
  "Who did you connect with today, and how did that interaction make you feel?",
  "What is one thing you did today that your future self will thank you for?",
  "Describe the sights, sounds, and atmosphere of your day in sensory detail.",
  "What are three things you are sincerely grateful for in this exact moment?"
];

interface RichTextEditorProps {
  fontStyle: 'serif' | 'sans';
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ fontStyle }) => {
  const { 
    activeEntry, 
    selectedDate, 
    setSelectedDate, 
    saveCurrentEntry, 
    saveStatus 
  } = useJournal();

  const editorRef = useRef<HTMLDivElement>(null);
  
  // Local entry states
  const [title, setTitle] = useState(activeEntry?.title || '');
  const [mood, setMood] = useState<MoodType | undefined>(activeEntry?.mood);
  const [tags, setTags] = useState<string[]>(activeEntry?.tags || []);
  const [isFavorite, setIsFavorite] = useState(activeEntry?.isFavorite || false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sync state when active entry changes
  useEffect(() => {
    if (activeEntry) {
      setTitle(activeEntry.title || '');
      setMood(activeEntry.mood);
      setTags(activeEntry.tags || []);
      setIsFavorite(activeEntry.isFavorite || false);

      if (editorRef.current) {
        editorRef.current.innerHTML = activeEntry.contentHtml || '';
      }
      setIsDirty(false);
    }
  }, [activeEntry?.id, selectedDate]);

  // Execute formatting command
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleEditorInput();
    }
  };

  // Handle content changes
  const handleEditorInput = () => {
    setIsDirty(true);
  };

  // Format link
  const insertLink = () => {
    const url = prompt('Enter web URL (https://...):');
    if (url) {
      execCmd('createLink', url);
    }
  };

  // Insert current timestamp
  const insertTimestamp = () => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    execCmd('insertHTML', `<strong>[${timeString}]</strong> `);
  };

  // Insert reflection prompt
  const insertPrompt = (promptText: string) => {
    execCmd('insertHTML', `<blockquote><p><strong>Reflective Prompt:</strong> ${promptText}</p></blockquote><p></p>`);
    setShowPrompts(false);
  };

  // Tag management
  const addTag = () => {
    const cleaned = newTagInput.trim().replace(/^#/, '');
    if (cleaned && !tags.includes(cleaned)) {
      const updated = [...tags, cleaned];
      setTags(updated);
      setNewTagInput('');
      setShowTagInput(false);
      setIsDirty(true);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setIsDirty(true);
  };

  // Manual & debounced autosave
  const triggerSave = useCallback(async () => {
    if (!editorRef.current) return;

    const contentHtml = editorRef.current.innerHTML;
    const plainText = editorRef.current.innerText || '';

    await saveCurrentEntry({
      title,
      contentHtml,
      plainText,
      mood,
      tags,
      isFavorite,
    });
    setIsDirty(false);
  }, [title, mood, tags, isFavorite, saveCurrentEntry]);

  // Auto-save debounce effect when changes occur
  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      triggerSave();
    }, 1800);

    return () => clearTimeout(timer);
  }, [isDirty, triggerSave]);

  // Keyboard shortcut Ctrl/Cmd+S for instant saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        triggerSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSave]);

  // Day navigation helpers
  const navigateDay = (offset: number) => {
    // Save existing before jumping if dirty
    if (isDirty) {
      triggerSave();
    }
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + offset);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Compute live stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
      setWordCount(words);
      setCharCount(text.length);
    }
  }, [editorRef.current?.innerHTML, isDirty]);

  // Format friendly date heading
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const isToday = new Date().toISOString().slice(0, 10) === selectedDate;
  const formattedDay = dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Top Header: Date navigation & status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-stone-50/80 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => navigateDay(-1)}
              title="Previous Day"
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateDay(1)}
              title="Next Day"
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-amber-700 dark:text-amber-500" />
            <span className="font-semibold text-stone-800 dark:text-stone-200 text-base">
              {formattedDay}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 rounded-full border border-amber-300/60">
                Today
              </span>
            )}
          </div>
        </div>

        {/* Status indicator & Favorite button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsFavorite(!isFavorite);
              setIsDirty(true);
            }}
            title={isFavorite ? 'Starred entry' : 'Mark as favorite'}
            className={`p-1.5 rounded-lg border transition-colors ${
              isFavorite
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 text-amber-500'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 hover:text-amber-500'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>

          {/* Encryption & Save badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>AES-256 Encrypted</span>
            <span className="text-stone-300 dark:text-stone-600">•</span>
            {saveStatus.state === 'saving' ? (
              <span className="text-amber-600 animate-pulse flex items-center gap-1">
                Saving...
              </span>
            ) : isDirty ? (
              <span className="text-amber-600 dark:text-amber-400">Unsaved edits</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
          </div>

          <button
            onClick={triggerSave}
            disabled={saveStatus.state === 'saving'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Save changes (Ctrl+S / Cmd+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Entry Meta: Title, Mood Picker, and Tags */}
      <div className="px-8 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800/60 bg-white dark:bg-stone-900">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsDirty(true);
          }}
          placeholder="Entry title or guiding thought for the day..."
          className={`w-full text-2xl font-bold bg-transparent border-0 outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 ${
            fontStyle === 'serif' ? 'font-journal-serif' : 'font-journal-sans'
          }`}
        />

        <div className="flex flex-wrap items-center gap-3 mt-4">
          {/* Mood Selector Dropdown / Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-stone-400 font-medium mr-1">Mood:</span>
            {MOODS.map((m) => {
              const active = mood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMood(active ? undefined : m.id);
                    setIsDirty(true);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all ${
                    active
                      ? `${m.color} font-medium shadow-xs scale-105`
                      : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700/80 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block" />

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
              >
                #{tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-500 transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {showTagInput ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="tag name..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    } else if (e.key === 'Escape') {
                      setShowTagInput(false);
                    }
                  }}
                  className="text-xs px-2 py-0.5 border border-amber-400 rounded outline-none w-24 bg-white dark:bg-stone-800 dark:text-stone-200"
                />
                <button
                  onClick={addTag}
                  className="text-xs px-1.5 py-0.5 bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowTagInput(false)}
                  className="text-xs p-0.5 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded border border-dashed border-stone-300 dark:border-stone-700 hover:border-stone-400 transition-colors"
              >
                <Tag className="w-3 h-3" />
                <span>Add Tag</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rich Text Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-6 py-2 bg-stone-50/70 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-xs">
        {/* Undo / Redo */}
        <div className="flex items-center">
          <button
            onClick={() => execCmd('undo')}
            title="Undo (Ctrl+Z)"
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded transition-colors"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCmd('redo')}
            title="Redo (Ctrl+Y)"
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded transition-colors"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

        {/* Headings */}
        <button
          onClick={() => execCmd('formatBlock', '<h1>')}
          title="Heading 1"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded font-bold"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('formatBlock', '<h2>')}
          title="Heading 2"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded font-semibold"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('formatBlock', '<h3>')}
          title="Heading 3"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('formatBlock', '<p>')}
          title="Normal Paragraph"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded"
        >
          <Type className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

        {/* Basic formatting */}
        <button
          onClick={() => execCmd('bold')}
          title="Bold (Ctrl+B)"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded font-bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('italic')}
          title="Italic (Ctrl+I)"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('underline')}
          title="Underline (Ctrl+U)"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('strikeThrough')}
          title="Strikethrough"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded line-through"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('hiliteColor', '#fef08a')}
          title="Highlight Yellow"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded text-amber-600"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

        {/* Lists & Quotes */}
        <button
          onClick={() => execCmd('insertUnorderedList')}
          title="Bullet List"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('insertOrderedList')}
          title="Numbered List"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('formatBlock', '<blockquote>')}
          title="Blockquote"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('formatBlock', '<pre>')}
          title="Code Block"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded font-mono"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('insertHorizontalRule')}
          title="Divider Line"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

        {/* Insert Utilities: Link, Timestamp, Prompt */}
        <button
          onClick={insertLink}
          title="Insert Link"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          onClick={insertTimestamp}
          title="Insert Time Stamp"
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded flex items-center gap-1 text-xs"
        >
          <Clock className="w-4 h-4" />
          <span className="hidden md:inline">Time</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            title="Reflection Prompt Ideas"
            className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded flex items-center gap-1 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Reflection Prompt</span>
          </button>

          {showPrompts && (
            <div className="absolute left-0 mt-2 w-80 max-h-72 overflow-y-auto bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 p-2 z-30">
              <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 px-2 py-1 mb-1">
                Choose a Daily Question:
              </div>
              {DAILY_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => insertPrompt(p)}
                  className="w-full text-left text-xs p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors border-b border-stone-100 dark:border-stone-700/50 last:border-b-0"
                >
                  "{p}"
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="relative flex-1 p-8 overflow-y-auto bg-white dark:bg-stone-900">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          data-placeholder="Write your personal reflections, gratitude, ideas, or stream of consciousness here... Everything you write is encrypted on your device before saving."
          className={`journal-editor-content w-full h-full text-stone-800 dark:text-stone-100 text-lg leading-relaxed focus:outline-none ${
            fontStyle === 'serif' ? 'font-journal-serif' : 'font-journal-sans'
          }`}
        />
      </div>

      {/* Bottom Footer Bar: Word count & Reading stats */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-stone-50/60 dark:bg-stone-900 border-t border-stone-200/80 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span className="text-stone-300 dark:text-stone-700">•</span>
          <span>{charCount} characters</span>
          <span className="text-stone-300 dark:text-stone-700">•</span>
          <span>~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
        </div>

        <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
          <span>Zero-Knowledge AES-GCM Client Vault</span>
        </div>
      </div>
    </div>
  );
};
