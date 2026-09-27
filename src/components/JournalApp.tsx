import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { useJournal, getTodayDateString } from '../context/JournalContext';
import { RichTextEditor } from './Editor/RichTextEditor';
import { JournalCalendar } from './Calendar/JournalCalendar';
import { EntriesSidebar } from './Sidebar/EntriesSidebar';
import { ExportModal } from './Modals/ExportModal';
import { SettingsModal } from './Modals/SettingsModal';
import { 
  Feather, 
  Lock, 
  Settings, 
  Download, 
  LogOut, 
  PanelLeftClose, 
  PanelLeftOpen, 
  ShieldCheck, 
  Maximize2, 
  Minimize2,
  Calendar as CalendarIcon,
  Sun,
  Moon
} from 'lucide-react';

interface JournalAppProps {
  fontStyle: 'serif' | 'sans';
  onChangeFontStyle: (style: 'serif' | 'sans') => void;
  theme: 'linen' | 'midnight' | 'minimal';
  onChangeTheme: (theme: 'linen' | 'midnight' | 'minimal') => void;
}

export const JournalApp: React.FC<JournalAppProps> = ({
  fontStyle,
  onChangeFontStyle,
  theme,
  onChangeTheme,
}) => {
  const { user, logout } = useAuth();
  const { lockVault } = useVault();
  const { setSelectedDate } = useJournal();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [distractionFree, setDistractionFree] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleWriteToday = () => {
    setSelectedDate(getTodayDateString());
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'midnight' ? 'dark bg-stone-950 text-stone-100' : theme === 'linen' ? 'bg-[#FAF8F5] text-stone-900' : 'bg-stone-50 text-stone-900'}`}>
      {/* Top Header Bar */}
      {!distractionFree && (
        <header className="no-print h-14 border-b border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Hide entries panel' : 'Show entries panel'}
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300 transition-colors"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-700 dark:bg-amber-600 flex items-center justify-center text-white shadow-xs">
                <Feather className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-stone-800 dark:text-stone-100 text-base tracking-wide hidden sm:inline">
                Sanctuary Journal
              </span>
            </div>

            {/* Zero-knowledge indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 ml-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Zero-Knowledge Encrypted</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Lock Vault Button */}
            <button
              onClick={lockVault}
              title="Lock encrypted vault now"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-100/70 hover:bg-amber-200/80 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Vault</span>
            </button>

            {/* Distraction free toggle */}
            <button
              onClick={() => setDistractionFree(true)}
              title="Focus Mode (Full screen writing)"
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Export & Backup */}
            <button
              onClick={() => setShowExportModal(true)}
              title="Export & Vault Backup"
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettingsModal(true)}
              title="Journal & Encryption Settings"
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 mx-1 hidden sm:block" />

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2">
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

              <button
                onClick={logout}
                title="Sign out of Google"
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Floating Exit Distraction-Free Button */}
      {distractionFree && (
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={() => setDistractionFree(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white text-xs backdrop-blur-md shadow-lg transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Focus Mode</span>
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden p-3 sm:p-4 gap-4 max-w-7xl mx-auto w-full">
        {/* Left Sidebar (Calendar & Entries list) */}
        {!distractionFree && sidebarOpen && (
          <aside className="w-80 shrink-0 hidden md:flex flex-col gap-4 overflow-hidden">
            {/* Interactive Calendar widget */}
            <JournalCalendar />

            {/* Entries list & search */}
            <div className="flex-1 overflow-hidden">
              <EntriesSidebar onNewToday={handleWriteToday} />
            </div>
          </aside>
        )}

        {/* Center Writing Canvas */}
        <section className="flex-1 h-full overflow-hidden flex flex-col">
          <RichTextEditor fontStyle={fontStyle} />
        </section>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          fontStyle={fontStyle}
          onChangeFontStyle={onChangeFontStyle}
          theme={theme}
          onChangeTheme={onChangeTheme}
        />
      )}
    </div>
  );
};
