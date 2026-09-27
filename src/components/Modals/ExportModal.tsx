import React, { useState } from 'react';
import { Download, FileText, Printer, FileCode, Database, Check, X } from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import { useVault } from '../../context/VaultContext';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { entries, activeEntry, selectedDate } = useJournal();
  const { vaultDoc } = useVault();
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Download helper
  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Export current entry as Markdown
  const exportCurrentMarkdown = () => {
    if (!activeEntry) return;
    const content = `# ${activeEntry.title || 'Journal Entry'}
**Date:** ${activeEntry.date}
${activeEntry.mood ? `**Mood:** ${activeEntry.mood}\n` : ''}${
      activeEntry.tags?.length ? `**Tags:** ${activeEntry.tags.map((t) => `#${t}`).join(' ')}\n` : ''
    }
---

${activeEntry.plainText}
`;
    triggerDownload(`sanctuary-journal-${activeEntry.date}.md`, content, 'text/markdown');
  };

  // 2. Export entire journal as single combined Markdown book
  const exportAllMarkdown = () => {
    let content = `# My Personal Journal Archive\n*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;
    for (const entry of entries) {
      content += `## ${entry.title || entry.date}\n`;
      content += `**Date:** ${entry.date} | **Words:** ${entry.wordCount}\n`;
      if (entry.mood) content += `**Mood:** ${entry.mood}\n`;
      if (entry.tags?.length) content += `**Tags:** ${entry.tags.map((t) => `#${t}`).join(' ')}\n`;
      content += `\n${entry.plainText}\n\n---\n\n`;
    }
    triggerDownload(`sanctuary-complete-archive-${new Date().toISOString().slice(0, 10)}.md`, content, 'text/markdown');
  };

  // 3. Export encrypted vault backup JSON
  const exportVaultBackup = () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      vault: {
        salt: vaultDoc?.salt,
        verifier: vaultDoc?.verifier,
        hint: vaultDoc?.hint,
      },
      entries: entries.map((e) => ({
        date: e.date,
        title: e.title,
        contentHtml: e.contentHtml,
        plainText: e.plainText,
        mood: e.mood,
        tags: e.tags,
        wordCount: e.wordCount,
        isFavorite: e.isFavorite,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    };
    triggerDownload(
      `sanctuary-journal-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backupData, null, 2),
      'application/json'
    );
  };

  // 4. Print current entry
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Export & Backup
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Export Current Entry */}
          <button
            onClick={exportCurrentMarkdown}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Export Day's Entry ({selectedDate})
                </div>
                <div className="text-[11px] text-stone-400">
                  Save current entry as a clean Markdown (.md) file
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-stone-400" />
          </button>

          {/* Export Entire Journal Archive */}
          <button
            onClick={exportAllMarkdown}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Export Entire Journal Archive
                </div>
                <div className="text-[11px] text-stone-400">
                  Compile all {entries.length} decrypted entries into one document
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-stone-400" />
          </button>

          {/* Export Full Backup JSON */}
          <button
            onClick={exportVaultBackup}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Full JSON Vault Backup
                </div>
                <div className="text-[11px] text-stone-400">
                  Complete structured backup with metadata and tags
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-stone-400" />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Print Entry / Save as PDF
                </div>
                <div className="text-[11px] text-stone-400">
                  Clean print-formatted layout without buttons or navigation
                </div>
              </div>
            </div>
            <Printer className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
