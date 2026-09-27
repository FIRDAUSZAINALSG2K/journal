import React from 'react';
import { 
  Search, 
  Trash2, 
  Star, 
  Calendar, 
  Filter, 
  X, 
  Plus,
  BookOpen
} from 'lucide-react';
import { useJournal, getTodayDateString } from '../../context/JournalContext';
import { MOODS, type MoodType } from '../../types/journal';

interface EntriesSidebarProps {
  onNewToday: () => void;
}

export const EntriesSidebar: React.FC<EntriesSidebarProps> = ({ onNewToday }) => {
  const {
    filteredEntries,
    selectedDate,
    setSelectedDate,
    deleteEntry,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    selectedMoodFilter,
    setSelectedMoodFilter,
    selectedTagFilter,
    setSelectedTagFilter,
    allTags,
  } = useJournal();

  const todayStr = getTodayDateString();

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    
    // Yesterday check
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (dateStr === yStr) return 'Yesterday';

    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleDelete = async (e: React.MouseEvent, entryId: string, title: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Permanently delete this encrypted entry "${title || 'Untitled'}"?`);
    if (confirmed) {
      await deleteEntry(entryId);
    }
  };

  const handleToggleStar = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    await toggleFavorite(entryId);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm overflow-hidden">
      {/* Header & New Today button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-500" />
          <h2 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
            All Entries
          </h2>
        </div>
        <button
          onClick={onNewToday}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Write Today</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search decrypted entries..."
          className="w-full pl-8 pr-7 py-1.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mood Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedMoodFilter('all')}
          className={`px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap transition-colors ${
            selectedMoodFilter === 'all'
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium border border-amber-300'
              : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          All Moods
        </button>
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMoodFilter(selectedMoodFilter === m.id ? 'all' : m.id)}
            title={m.label}
            className={`px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap flex items-center gap-1 transition-colors ${
              selectedMoodFilter === m.id
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium border border-amber-300'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
            }`}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Tag Filters (if tags exist) */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar text-xs">
          <span className="text-[11px] text-stone-400">Tags:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
              className={`px-2 py-0.5 rounded-md text-[11px] transition-colors ${
                selectedTagFilter === tag
                  ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 font-medium'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              #{tag}
            </button>
          ))}
          {selectedTagFilter && (
            <button
              onClick={() => setSelectedTagFilter(null)}
              className="text-[11px] text-amber-600 hover:underline ml-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Calendar className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              No journal entries found
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              {searchQuery ? 'Try a different search keyword' : 'Select a date or click "Write Today" to start'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = entry.date === selectedDate;
            const moodObj = entry.mood ? MOODS.find((m) => m.id === entry.mood) : null;
            const snippet = entry.plainText ? entry.plainText.slice(0, 95) : 'No content written yet...';

            return (
              <div
                key={entry.id}
                onClick={() => setSelectedDate(entry.date)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-xs'
                    : 'bg-stone-50/50 dark:bg-stone-800/40 border-stone-200/80 dark:border-stone-800 hover:border-amber-200 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {formatDateLabel(entry.date)}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {entry.date}
                    </span>
                  </div>

                  {/* Actions: star & delete */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleStar(e, entry.id)}
                      className="p-1 text-stone-400 hover:text-amber-500"
                      title={entry.isFavorite ? 'Starred' : 'Star'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          entry.isFavorite ? 'fill-amber-400 text-amber-500' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, entry.id, entry.title)}
                      className="p-1 text-stone-400 hover:text-red-500"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Entry title */}
                <h4 className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate mb-1">
                  {entry.title || '(Untitled Entry)'}
                </h4>

                {/* Snippet preview */}
                <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                  {snippet}
                </p>

                {/* Metadata footer */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100 dark:border-stone-800/60 text-[10px] text-stone-400">
                  <div className="flex items-center gap-1.5">
                    {moodObj && (
                      <span className="flex items-center gap-0.5">
                        <span>{moodObj.emoji}</span>
                        <span>{moodObj.label}</span>
                      </span>
                    )}
                    {entry.tags.length > 0 && (
                      <span>• {entry.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}</span>
                    )}
                  </div>
                  <span>{entry.wordCount} words</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
