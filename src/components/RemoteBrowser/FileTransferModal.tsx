/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  HardDrive,
  Activity
} from 'lucide-react';
import { FileTransferProgress } from '../../types/kdeconnect';

interface FileTransferModalProps {
  transfer: FileTransferProgress | null;
  onCancel: () => void;
  onClose: () => void;
  onRetry: () => void;
}

export const FileTransferModal: React.FC<FileTransferModalProps> = ({
  transfer,
  onCancel,
  onClose,
  onRetry
}) => {
  if (!transfer) return null;

  const percent = transfer.totalBytes > 0 
    ? Math.min(100, Math.round((transfer.transferredBytes / transfer.totalBytes) * 100))
    : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isCompleted = transfer.status === 'completed';
  const isError = transfer.status === 'error';
  const isCancelled = transfer.status === 'cancelled';
  const isTransferring = transfer.status === 'transferring';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              transfer.type === 'download' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}>
              {transfer.type === 'download' ? (
                <Download className="w-5 h-5" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                {transfer.type === 'download' ? 'Downloading Remote File' : 'Uploading Local File'}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-[260px]">
                {transfer.fileName}
              </p>
            </div>
          </div>
          {(isCompleted || isError || isCancelled) && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Destination Info */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Remote Source:</span>
            <span className="font-mono text-slate-300 truncate max-w-[220px]">
              {transfer.remotePath}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Destination (Android SAF):</span>
            <span className="font-mono text-blue-400 truncate max-w-[220px]">
              content://downloads/{transfer.fileName}
            </span>
          </div>
        </div>

        {/* Transfer Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              {formatBytes(transfer.transferredBytes)} of {formatBytes(transfer.totalBytes)}
            </span>
            <span className="font-mono font-bold text-slate-200">
              {percent}%
            </span>
          </div>

          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                isCompleted 
                  ? 'bg-emerald-500' 
                  : isError 
                  ? 'bg-rose-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Speed & Stats */}
          {isTransferring && (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-mono text-cyan-400">
                <Activity className="w-3 h-3" />
                {formatBytes(transfer.speedBytesPerSec)}/s (LAN TLS Stream)
              </span>
              <span>Estimated: ~{Math.max(1, Math.round((transfer.totalBytes - transfer.transferredBytes) / Math.max(1, transfer.speedBytesPerSec)))}s</span>
            </div>
          )}
        </div>

        {/* Status Callout */}
        {isCompleted && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-300 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Transfer complete! File successfully persisted to Android Storage Access Framework URI.</span>
          </div>
        )}

        {isError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-300 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{transfer.errorMessage || 'Transfer failed: Stream interrupted or remote permission denied.'}</span>
          </div>
        )}

        {isCancelled && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-300 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Transfer cancelled by user. Partial cache file cleaned up.</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5">
          {isTransferring && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
            >
              Cancel Transfer
            </button>
          )}

          {isError && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
            >
              Retry
            </button>
          )}

          {(isCompleted || isCancelled || isError) && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
