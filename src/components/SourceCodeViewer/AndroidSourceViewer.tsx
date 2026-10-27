/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FolderTree, 
  Layers, 
  FileCheck, 
  GitCommit,
  ExternalLink
} from 'lucide-react';
import { ANDROID_SOURCE_FILES, SourceFileEntry } from '../../data/androidSourceCode';

export const AndroidSourceViewer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const currentFile: SourceFileEntry = ANDROID_SOURCE_FILES[selectedFileIndex] || ANDROID_SOURCE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = currentFile.path.split('/').pop() || 'kdeconnect_file';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllBundle = () => {
    const combined = ANDROID_SOURCE_FILES.map(f => `
================================================================================
FILE: ${f.path}
CATEGORY: ${f.category}
DESCRIPTION: ${f.description}
================================================================================
${f.code}
`).join('\n\n');

    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kdeconnect_android_remote_browser_and_chat_bundle_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* Top Banner */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              KDE Connect Android: Mergeable Kotlin &amp; Room Source Code
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
              Ready for Upstream Review
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-grade implementations for <code className="text-cyan-300 font-mono">RemoteBrowsePlugin</code>, <code className="text-purple-300 font-mono">ChatPlugin</code>, Room Database, DAOs, and unified git patch.
          </p>
        </div>

        <button
          onClick={handleDownloadAllBundle}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download All Files (.bundle)</span>
        </button>
      </div>

      {/* Main Layout: Sidebar & Code Editor */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* File Tree Sidebar */}
        <div className="md:col-span-4 bg-slate-950 border-r border-slate-800 p-3 space-y-1 overflow-y-auto max-h-[580px] no-scrollbar">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Project File Tree</span>
            <span className="font-mono text-slate-500">{ANDROID_SOURCE_FILES.length} Files</span>
          </div>

          {ANDROID_SOURCE_FILES.map((file, idx) => {
            const isSelected = selectedFileIndex === idx;
            const fileName = file.path.split('/').pop();

            return (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col gap-1 border ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/40 text-blue-200'
                    : 'bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-xs font-semibold truncate text-slate-200">
                    {fileName}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    file.category === 'Plugin'
                      ? 'bg-blue-500/20 text-blue-300'
                      : file.category === 'Database / Room'
                      ? 'bg-purple-500/20 text-purple-300'
                      : file.category === 'Patch Diff'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {file.category}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 truncate">
                  {file.path}
                </span>
              </button>
            );
          })}
        </div>

        {/* Code Content Area */}
        <div className="md:col-span-8 bg-slate-900 flex flex-col">
          {/* File Header Bar */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="font-mono text-xs font-bold text-slate-200 truncate">
                {currentFile.path}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {currentFile.description}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
                title="Download this file"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 p-4 overflow-x-auto max-h-[520px] bg-black/40">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed">
              <code>{currentFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
