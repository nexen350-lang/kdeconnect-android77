/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  FileText, 
  FileImage, 
  FileArchive, 
  Download, 
  Upload, 
  ArrowRight, 
  ArrowLeft,
  ChevronLeft, 
  Search, 
  CheckCircle2, 
  Clock, 
  Activity, 
  X, 
  Eye,
  RefreshCw,
  HardDrive,
  FileCode
} from 'lucide-react';
import { AndroidDevice, AndroidFile, ActiveTransfer } from '../../types/kdeConnectApp';
import { PIXEL_STORAGE_FILES } from '../../data/androidFileSystems';

interface RemoteFileBrowserViewProps {
  currentDevice: AndroidDevice;
  targetDevice: AndroidDevice;
  onBack: () => void;
  onNotify: (msg: string) => void;
}

export const RemoteFileBrowserView: React.FC<RemoteFileBrowserViewProps> = ({
  currentDevice,
  targetDevice,
  onBack,
  onNotify
}) => {
  const [currentPath, setCurrentPath] = useState<string>('/storage/emulated/0');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTransfer, setActiveTransfer] = useState<ActiveTransfer | null>(null);
  const [previewFile, setPreviewFile] = useState<AndroidFile | null>(null);
  const [storageTree, setStorageTree] = useState(PIXEL_STORAGE_FILES);

  const currentFiles: AndroidFile[] = storageTree[currentPath] || [];

  const filteredFiles = currentFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateTo = (path: string) => {
    setCurrentPath(path);
  };

  const navigateUp = () => {
    if (currentPath === '/storage/emulated/0') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parent = '/' + parts.join('/');
    setCurrentPath(parent.startsWith('/storage/emulated/0') ? parent : '/storage/emulated/0');
  };

  const handleDownload = (file: AndroidFile) => {
    const transfer: ActiveTransfer = {
      id: 'dl-' + Date.now(),
      fileName: file.name,
      totalBytes: file.sizeBytes,
      transferredBytes: 0,
      speed: '18.4 MB/s',
      direction: 'download',
      status: 'active'
    };

    setActiveTransfer(transfer);

    const step = Math.max(file.sizeBytes / 10, 512 * 1024);
    const interval = setInterval(() => {
      setActiveTransfer(prev => {
        if (!prev || prev.status !== 'active') {
          clearInterval(interval);
          return prev;
        }

        const next = Math.min(prev.totalBytes, prev.transferredBytes + step);
        if (next >= prev.totalBytes) {
          clearInterval(interval);
          onNotify(`تم تحميل "${file.name}" وحفظه في مجلد التنزيلات بنجاح!`);

          // Trigger real browser download for immediate testing
          triggerBrowserDownload(file);

          return {
            ...prev,
            transferredBytes: prev.totalBytes,
            status: 'completed'
          };
        }
        return {
          ...prev,
          transferredBytes: next
        };
      });
    }, 120);
  };

  const triggerBrowserDownload = (file: AndroidFile) => {
    try {
      const content = `ملف تم تحميله من ${targetDevice.name} عبر KDE Connect
اسم الملف: ${file.name}
المسار: ${file.path}
الحجم: ${(file.sizeBytes / 1024).toFixed(1)} KB
تاريخ التحميل: ${new Date().toLocaleString('ar')}
`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadFromPhone = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const selected = (e.target as HTMLInputElement).files?.[0];
      if (selected) {
        const newFile: AndroidFile = {
          id: 'uploaded-' + Date.now(),
          name: selected.name,
          path: `${currentPath}/${selected.name}`,
          parentPath: currentPath,
          isDirectory: false,
          sizeBytes: selected.size,
          lastModified: Date.now(),
          mimeType: selected.type || 'application/octet-stream'
        };

        const transfer: ActiveTransfer = {
          id: 'up-' + Date.now(),
          fileName: selected.name,
          totalBytes: selected.size,
          transferredBytes: 0,
          speed: '16.8 MB/s',
          direction: 'upload',
          status: 'active'
        };

        setActiveTransfer(transfer);

        const step = Math.max(selected.size / 8, 256 * 1024);
        const interval = setInterval(() => {
          setActiveTransfer(prev => {
            if (!prev || prev.status !== 'active') {
              clearInterval(interval);
              return prev;
            }
            const next = Math.min(prev.totalBytes, prev.transferredBytes + step);
            if (next >= prev.totalBytes) {
              clearInterval(interval);
              // Add to current path files
              setStorageTree(currentTree => ({
                ...currentTree,
                [currentPath]: [...(currentTree[currentPath] || []), newFile]
              }));
              onNotify(`تم رفع "${selected.name}" بنجاح إلى مجلد ${currentPath} في ${targetDevice.model}!`);
              return {
                ...prev,
                transferredBytes: prev.totalBytes,
                status: 'completed'
              };
            }
            return { ...prev, transferredBytes: next };
          });
        }, 120);
      }
    };
    input.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (file: AndroidFile) => {
    if (file.isDirectory) {
      return <Folder className="w-6 h-6 text-blue-400 fill-blue-500/20" />;
    }
    const mime = file.mimeType.toLowerCase();
    if (mime.includes('image')) return <FileImage className="w-6 h-6 text-emerald-400" />;
    if (mime.includes('pdf') || mime.includes('text') || mime.includes('markdown')) return <FileText className="w-6 h-6 text-cyan-400" />;
    if (mime.includes('zip') || mime.includes('archive')) return <FileArchive className="w-6 h-6 text-amber-400" />;
    if (mime.includes('android.package-archive')) return <FileCode className="w-6 h-6 text-purple-400" />;
    return <File className="w-6 h-6 text-slate-400" />;
  };

  // Breadcrumbs
  const pathClean = currentPath.replace('/storage/emulated/0', 'وحدة التخزين الداخلية');
  const pathParts = pathClean.split('/').filter(Boolean);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-lg mx-auto bg-slate-950 text-white" dir="rtl">
      {/* Path Breadcrumbs Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 space-y-2 select-none shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar font-mono text-xs text-slate-300">
            <button
              onClick={() => setCurrentPath('/storage/emulated/0')}
              className="text-blue-400 font-bold hover:underline flex items-center gap-1 shrink-0"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>ذاكرة {targetDevice.model}</span>
            </button>

            {pathParts.slice(1).map((part, idx) => (
              <React.Fragment key={part}>
                <span className="text-slate-600">/</span>
                <span className="text-slate-200 font-semibold truncate max-w-[120px]">
                  {part}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={navigateUp}
              disabled={currentPath === '/storage/emulated/0'}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-slate-200"
              title="المجلد السابق (أعلى)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleUploadFromPhone}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs"
              title="رفع ملف من هاتفي إلى هذا المجلد"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع ملف</span>
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في هذا المجلد…"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Directory Contents List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1">
        {filteredFiles.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Folder className="w-10 h-10 text-slate-600" />
            <p className="text-xs font-medium text-slate-400">هذا المجلد فارغ</p>
            <p className="text-[11px] text-slate-500">لا توجد ملفات أو مجلدات هنا على هاتف {targetDevice.model}</p>
          </div>
        ) : (
          filteredFiles.map(file => (
            <div
              key={file.id}
              onClick={() => {
                if (file.isDirectory) {
                  navigateTo(file.path);
                } else if (file.thumbnailUrl) {
                  setPreviewFile(file);
                }
              }}
              className="p-3 hover:bg-slate-900/60 rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {file.thumbnailUrl ? (
                  <img
                    src={file.thumbnailUrl}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded-xl border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {getFileIcon(file)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-100 group-hover:text-blue-400 transition-colors truncate max-w-[220px]">
                    {file.name}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{file.isDirectory ? 'مجلد' : formatSize(file.sizeBytes)}</span>
                    <span>•</span>
                    <span>{formatDate(file.lastModified)}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                {file.thumbnailUrl && (
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    title="معاينة"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                {!file.isDirectory ? (
                  <button
                    onClick={() => handleDownload(file)}
                    className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    title="تحميل إلى هاتفي"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل</span>
                  </button>
                ) : (
                  <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Active Transfer Floating Card */}
      {activeTransfer && (
        <div className="bg-slate-900 border-t border-slate-800 p-3 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
              <span className="font-bold text-slate-200 truncate max-w-[180px]">
                {activeTransfer.direction === 'download' ? 'جاري التحميل:' : 'جاري الرفع:'} {activeTransfer.fileName}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="text-cyan-400 font-bold">
                {Math.round((activeTransfer.transferredBytes / Math.max(1, activeTransfer.totalBytes)) * 100)}%
              </span>
              {activeTransfer.status === 'completed' && (
                <button
                  onClick={() => setActiveTransfer(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                activeTransfer.status === 'completed' 
                  ? 'bg-emerald-500' 
                  : 'bg-gradient-to-l from-blue-500 to-cyan-400'
              }`}
              style={{
                width: `${Math.round((activeTransfer.transferredBytes / Math.max(1, activeTransfer.totalBytes)) * 100)}%`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>{formatSize(activeTransfer.transferredBytes)} من {formatSize(activeTransfer.totalBytes)}</span>
            <span className="text-emerald-400">السرعة: {activeTransfer.speed} (Wi-Fi TLS)</span>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-white truncate max-w-[240px]">
                {previewFile.name}
              </h4>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewFile.thumbnailUrl && (
              <img
                src={previewFile.thumbnailUrl}
                alt={previewFile.name}
                className="w-full h-64 object-cover rounded-xl border border-slate-800"
              />
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400 font-mono">{formatSize(previewFile.sizeBytes)}</span>
              <button
                onClick={() => {
                  handleDownload(previewFile);
                  setPreviewFile(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>تحميل هذه الصورة لهاتفي</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
