import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { useJournal, getTodayDateString } from '../../context/JournalContext';
import { MOODS } from '../../types/journal';

export const JournalCalendar: React.FC = () => {
  const { selectedDate, setSelectedDate, datesWithEntries, entries } = useJournal();

  // Selected date components
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    const today = getTodayDateString();
    setSelectedDate(today);
    setViewDate(new Date());
  };

  // Calendar matrix calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthName = viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const todayStr = getTodayDateString();

  // Calculate current streak
  const calculateStreak = () => {
    let streak = 0;
    const checkDate = new Date();
    // Check if wrote today or yesterday to start streak
    const checkTodayStr = getTodayDateString();
    const hasToday = datesWithEntries.get(checkTodayStr)?.hasContent;
    
    if (!hasToday) {
      // Check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      if (datesWithEntries.get(dateKey)?.hasContent) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
      {/* Header: Month / Year & controls */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 text-sm">
          {monthName}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={jumpToToday}
            className="text-xs px-2 py-1 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-stone-400 mb-1">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-xs">
        {/* Previous Month trailing days */}
        {Array.from({ length: firstDayIndex }).map((_, i) => {
          const dayNum = daysInPrevMonth - firstDayIndex + i + 1;
          return (
            <div
              key={`prev-${i}`}
              className="h-8 flex items-center justify-center text-stone-300 dark:text-stone-700 text-[11px]"
            >
              {dayNum}
            </div>
          );
        })}

        {/* Current Month days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayStr = String(dayNum).padStart(2, '0');
          const monthStr = String(month + 1).padStart(2, '0');
          const dateKey = `${year}-${monthStr}-${dayStr}`;

          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayStr;
          const entryInfo = datesWithEntries.get(dateKey);
          const hasEntry = entryInfo?.hasContent;
          const moodInfo = entryInfo?.mood ? MOODS.find((m) => m.id === entryInfo.mood) : null;

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              className={`relative h-8 flex flex-col items-center justify-center rounded-lg transition-all ${
                isSelected
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : isToday
                  ? 'border border-amber-500/80 text-amber-700 dark:text-amber-400 font-semibold'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span className="text-xs leading-none">{dayNum}</span>

              {/* Indicator dot or emoji */}
              {hasEntry && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />
              )}
              {hasEntry && isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Streak & Stats badge */}
      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-1.5">
          <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
          <span>
            {currentStreak} day {currentStreak === 1 ? 'streak' : 'streaks'}
          </span>
        </div>
        <span>{entries.length} entries stored</span>
      </div>
    </div>
  );
};
