/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DeviceType = 'desktop' | 'laptop' | 'phone' | 'tablet';

export type ConnectionState = 'connected' | 'disconnected' | 'pairing' | 'connecting';

export interface PairedDevice {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  port: number;
  tlsFingerprint: string;
  isPaired: boolean;
  connectionState: ConnectionState;
  supportedPlugins: string[];
  batteryPercent?: number;
  isCharging?: boolean;
  osName: string;
  kdeConnectVersion: string;
}

export interface RemoteFileItem {
  id: string;
  name: string;
  path: string;
  parentPath: string;
  isDirectory: boolean;
  sizeBytes: number;
  mimeType: string;
  lastModified: number;
  permissions: string; // e.g. "rwxr-xr-x"
  isProtected?: boolean; // system or restricted directory
  downloadUrl?: string;
  previewUrl?: string;
}

export type MessageType = 'text' | 'image' | 'note';

export type SyncStatus = 'queued_offline' | 'sending' | 'sent' | 'delivered' | 'failed';

export interface ChatMessage {
  id: string;
  deviceId: string;
  senderId: string; // "local" or deviceId
  senderName: string;
  recipientId: string;
  messageType: MessageType;
  content: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentMime?: string;
  attachmentDataUrl?: string;
  timestamp: number;
  syncStatus: SyncStatus;
  isPinned?: boolean;
  isDeleted?: boolean;
  tags?: string[];
  noteTitle?: string;
}

export interface KDEConnectPacket {
  id: number;
  type: string;
  body: Record<string, any>;
  payloadSize?: number;
  payloadTransferInfo?: {
    port?: number;
    transferId?: string;
  };
  direction: 'incoming' | 'outgoing';
  timestamp: number;
}

export interface FileTransferProgress {
  id: string;
  fileName: string;
  remotePath: string;
  totalBytes: number;
  transferredBytes: number;
  type: 'download' | 'upload';
  status: 'idle' | 'transferring' | 'completed' | 'cancelled' | 'error';
  speedBytesPerSec: number;
  errorMessage?: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'Security' | 'Protocol' | 'Persistence' | 'Sync' | 'SAF';
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  durationMs?: number;
  details?: string;
}
