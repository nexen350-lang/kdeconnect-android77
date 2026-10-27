/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  FileText, 
  FileImage, 
  FileCode, 
  FileArchive, 
  Download, 
  Upload, 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  Lock, 
  AlertTriangle, 
  FolderOpen, 
  Eye, 
  Check, 
  SlidersHorizontal,
  HardDrive,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PairedDevice, RemoteFileItem, FileTransferProgress } from '../../types/kdeconnect';
import { MOCK_FILE_SYSTEMS } from '../../data/mockFileSystem';
import { packetBus } from '../../services/packetBus';
import { FileTransferModal } from './FileTransferModal';
import { PathTraversalSimulator } from './PathTraversalSimulator';

interface RemoteFileBrowserProps {
  device: PairedDevice;
  isSimulatedOffline: boolean;
}

export const RemoteFileBrowser: React.FC<RemoteFileBrowserProps> = ({
  device,
  isSimulatedOffline
}) => {
  const fileSystem = MOCK_FILE_SYSTEMS[device.id] || {
    rootPath: '/storage/emulated/0',
    allowedRoot: '/storage/emulated/0',
    items: {}
  };

  const [currentPath, setCurrentPath] = useState<string>(fileSystem.rootPath);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTransfer, setActiveTransfer] = useState<FileTransferProgress | null>(null);
  const [previewItem, setPreviewItem] = useState<RemoteFileItem | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showSecurityDrawer, setShowSecurityDrawer] = useState<boolean>(false);

  // Sync path when device changes
  useEffect(() => {
    setCurrentPath(fileSystem.rootPath);
    setPermissionError(null);
  }, [device.id]);

  // Request directory listing packet simulation
  const fetchDirectory = (targetPath: string) => {
    setIsLoading(true);
    setPermissionError(null);

    // Emit outgoing request packet
    packetBus.emitOutgoing('kdeconnect.remotebrowse.request', {
      path: targetPath,
      showHidden: false
    });

    setTimeout(() => {
      setIsLoading(false);
      // Emit incoming response packet
      const currentItems = fileSystem.items[targetPath] || [];
      packetBus.emitIncoming('kdeconnect.remotebrowse.response', {
        path: targetPath,
        filesCount: currentItems.length,
        success: true
      });
    }, 280);
  };

  const navigateTo = (targetPath: string) => {
    if (isSimulatedOffline) return;

    // Check if path is protected
    const currentFiles = fileSystem.items[currentPath] || [];
    const item = currentFiles.find(f => f.path === targetPath);

    if (item && item.isProtected) {
      setPermissionError(`Remote device policy denied access to protected directory: ${targetPath}. (Requires root or system privilege)`);
      packetBus.emitIncoming('kdeconnect.remotebrowse.response', {
        path: targetPath,
        success: false,
        errorCode: 'ERROR_ACCESS_DENIED',
        errorMessage: 'Remote filesystem permission denied'
      });
      return;
    }

    setCurrentPath(targetPath);
    fetchDirectory(targetPath);
  };

  const navigateUp = () => {
    if (currentPath === fileSystem.rootPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parent = parts.length === 0 ? '/' : '/' + parts.join('/');
    // Check root boundary
    if (!parent.startsWith(fileSystem.allowedRoot) && parent !== fileSystem.allowedRoot) {
      setCurrentPath(fileSystem.rootPath);
      fetchDirectory(fileSystem.rootPath);
    } else {
      setCurrentPath(parent);
      fetchDirectory(parent);
    }
  };

  const startDownload = (file: RemoteFileItem) => {
    if (isSimulatedOffline) return;

    packetBus.emitOutgoing('kdeconnect.remotebrowse.download', {
      path: file.path,
      fileName: file.name,
      sizeBytes: file.sizeBytes
    });

    const newTransfer: FileTransferProgress = {
      id: 'dl-' + Date.now(),
      fileName: file.name,
      remotePath: file.path,
      totalBytes: file.sizeBytes,
      transferredBytes: 0,
      type: 'download',
      status: 'transferring',
      speedBytesPerSec: 16 * 1024 * 1024 // 16 MB/s simulated local TLS speed
    };

    setActiveTransfer(newTransfer);

    // Simulate progress loop
    const stepBytes = Math.max(file.sizeBytes / 12, 1024 * 512);
    const interval = setInterval(() => {
      setActiveTransfer(prev => {
        if (!prev || prev.status !== 'transferring') {
          clearInterval(interval);
          return prev;
        }
        const nextBytes = Math.min(prev.totalBytes, prev.transferredBytes + stepBytes);
        if (nextBytes >= prev.totalBytes) {
          clearInterval(interval);
          packetBus.emitIncoming('kdeconnect.share.request', {
            fileName: prev.fileName,
            bytesReceived: prev.totalBytes,
            savedToUri: 'content://downloads/' + prev.fileName,
            status: 'completed'
          });
          return {
            ...prev,
            transferredBytes: prev.totalBytes,
            status: 'completed'
          };
        }
        return {
          ...prev,
          transferredBytes: nextBytes
        };
      });
    }, 180);
  };

  const handleUploadClick = () => {
    if (isSimulatedOffline) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const selected = (e.target as HTMLInputElement).files?.[0];
      if (selected) {
        packetBus.emitOutgoing('kdeconnect.remotebrowse.upload', {
          targetDirectory: currentPath,
          fileName: selected.name,
          sizeBytes: selected.size
        }, selected.size);

        const newTransfer: FileTransferProgress = {
          id: 'up-' + Date.now(),
          fileName: selected.name,
          remotePath: currentPath + '/' + selected.name,
          totalBytes: selected.size,
          transferredBytes: 0,
          type: 'upload',
          status: 'transferring',
          speedBytesPerSec: 14 * 1024 * 1024
        };

        setActiveTransfer(newTransfer);

        const stepBytes = Math.max(selected.size / 10, 1024 * 512);
        const interval = setInterval(() => {
          setActiveTransfer(prev => {
            if (!prev || prev.status !== 'transferring') {
              clearInterval(interval);
              return prev;
            }
            const nextBytes = Math.min(prev.totalBytes, prev.transferredBytes + stepBytes);
            if (nextBytes >= prev.totalBytes) {
              clearInterval(interval);
              return {
                ...prev,
                transferredBytes: prev.totalBytes,
                status: 'completed'
              };
            }
            return {
              ...prev,
              transferredBytes: nextBytes
            };
          });
        }, 180);
      }
    };
    input.click();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (file: RemoteFileItem) => {
    if (file.isDirectory) {
      return file.isProtected ? (
        <Lock className="w-5 h-5 text-amber-400" />
      ) : (
        <Folder className="w-5 h-5 text-blue-400 fill-blue-500/20" />
      );
    }
    const mime = file.mimeType.toLowerCase();
    if (mime.includes('image')) return <FileImage className="w-5 h-5 text-emerald-400" />;
    if (mime.includes('pdf') || mime.includes('text') || mime.includes('markdown')) return <FileText className="w-5 h-5 text-cyan-400" />;
    if (mime.includes('kotlin') || mime.includes('javascript') || mime.includes('diff')) return <FileCode className="w-5 h-5 text-purple-400" />;
    if (mime.includes('zip') || mime.includes('gzip') || mime.includes('tar')) return <FileArchive className="w-5 h-5 text-amber-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  // Get current files
  const itemsInCurrentDir = fileSystem.items[currentPath] || [];
  const filteredItems = itemsInCurrentDir.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Path breadcrumbs parts
  const pathBreadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Offline Alert */}
      {isSimulatedOffline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Remote device link is disconnected. Remote directory navigation and file transfers are paused.
            </span>
          </div>
          <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded">
            Link State: Offline
          </span>
        </div>
      )}

      {/* Permission Denied Alert */}
      {permissionError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{permissionError}</span>
          </div>
          <button
            onClick={() => setPermissionError(null)}
            className="text-xs text-rose-400 hover:text-rose-200 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Browser Main Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3 shadow-xs">
        {/* Breadcrumb Path Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-1 min-w-[280px] bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto no-scrollbar">
            <button
              onClick={() => navigateTo(fileSystem.rootPath)}
              className="text-blue-400 hover:underline flex items-center gap-1 shrink-0 font-medium"
              title="Go to root"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Root</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

            {pathBreadcrumbs.map((crumb, idx) => {
              const crumbPath = '/' + pathBreadcrumbs.slice(0, idx + 1).join('/');
              const isLast = idx === pathBreadcrumbs.length - 1;
              return (
                <React.Fragment key={crumbPath}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                  <button
                    onClick={() => navigateTo(crumbPath)}
                    disabled={isLast}
                    className={`shrink-0 truncate max-w-[150px] ${
                      isLast 
                        ? 'text-white font-bold cursor-default' 
                        : 'text-slate-400 hover:text-blue-400 hover:underline'
                    }`}
                  >
                    {crumb}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={navigateUp}
              disabled={currentPath === fileSystem.rootPath || isSimulatedOffline}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              title="Navigate to parent directory"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Up</span>
            </button>

            <button
              onClick={() => fetchDirectory(currentPath)}
              disabled={isLoading || isSimulatedOffline}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 rounded-lg border border-slate-700 transition-colors"
              title="Refresh directory listing"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleUploadClick}
              disabled={isSimulatedOffline}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Upload file to current remote folder"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Here</span>
            </button>

            <button
              onClick={() => setShowSecurityDrawer(!showSecurityDrawer)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                showSecurityDrawer
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Test path traversal defense against malicious payload"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Test Traversal Defense</span>
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter files in directory…"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span>{filteredItems.length} items</span>
            <span>•</span>
            <span>
              Total: {formatBytes(filteredItems.reduce((acc, f) => acc + (f.isDirectory ? 0 : f.sizeBytes), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Security Defense Sandbox */}
      {showSecurityDrawer && (
        <PathTraversalSimulator currentRoot={fileSystem.allowedRoot} />
      )}

      {/* Directory Contents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-xs font-mono">Emitting kdeconnect.remotebrowse.request…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <FolderOpen className="w-8 h-8 text-slate-600" />
            <p className="text-xs font-medium text-slate-400">This directory is empty</p>
            <p className="text-[11px] text-slate-500">
              No files or subdirectories found under {currentPath}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Permissions</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">Date Modified</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => {
                      if (item.isDirectory) {
                        navigateTo(item.path);
                      }
                    }}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0">{getFileIcon(item)}</div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                            <span className="truncate max-w-[280px] sm:max-w-md">{item.name}</span>
                            {item.isProtected && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                Protected
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[220px]">
                            {item.mimeType}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {item.isDirectory ? '—' : formatBytes(item.sizeBytes)}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] hidden sm:table-cell whitespace-nowrap">
                      {item.permissions}
                    </td>

                    <td className="py-2.5 px-3 text-slate-400 text-[11px] hidden md:table-cell whitespace-nowrap">
                      {formatDate(item.lastModified)}
                    </td>

                    <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {item.previewUrl && (
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Preview image"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!item.isDirectory && (
                          <button
                            onClick={() => startDownload(item)}
                            disabled={isSimulatedOffline}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-700 hover:border-blue-500 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                            title="Download to Android SAF storage"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        )}

                        {item.isDirectory && (
                          <button
                            onClick={() => navigateTo(item.path)}
                            disabled={isSimulatedOffline}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-200 truncate">{previewItem.name}</h4>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>
            {previewItem.previewUrl ? (
              <img
                src={previewItem.previewUrl}
                alt={previewItem.name}
                className="w-full h-64 object-cover rounded-xl border border-slate-800"
              />
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">No preview available</div>
            )}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>{formatBytes(previewItem.sizeBytes)}</span>
              <button
                onClick={() => {
                  startDownload(previewItem);
                  setPreviewItem(null);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to Downloads</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Transfer Modal */}
      <FileTransferModal
        transfer={activeTransfer}
        onCancel={() => {
          setActiveTransfer(prev => prev ? { ...prev, status: 'cancelled' } : null);
        }}
        onClose={() => setActiveTransfer(null)}
        onRetry={() => {
          if (activeTransfer) {
            setActiveTransfer(prev => prev ? { ...prev, status: 'transferring', transferredBytes: 0 } : null);
          }
        }}
      />
    </div>
  );
};
