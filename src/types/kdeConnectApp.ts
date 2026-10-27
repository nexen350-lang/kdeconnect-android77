/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AndroidDevice {
  id: string;
  name: string;
  model: string;
  androidVersion: string;
  ip: string;
  battery: number;
  isCharging: boolean;
  status: 'connected' | 'pairing' | 'disconnected';
  tlsFingerprint: string;
  storageTotalGb: number;
  storageUsedGb: number;
}

export interface AndroidFile {
  id: string;
  name: string;
  path: string;
  parentPath: string;
  isDirectory: boolean;
  sizeBytes: number;
  lastModified: number;
  mimeType: string;
  thumbnailUrl?: string;
  contentUrl?: string;
}

export interface ChatMessage {
  id: string;
  senderDeviceId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'text' | 'image' | 'bulletin_note' | 'file';
  attachment?: {
    name: string;
    sizeBytes: number;
    mimeType: string;
    url: string;
  };
  noteTitle?: string;
  isPinned?: boolean;
  tags?: string[];
  status: 'sent' | 'delivered' | 'read';
}

export interface ActiveTransfer {
  id: string;
  fileName: string;
  totalBytes: number;
  transferredBytes: number;
  speed: string;
  direction: 'download' | 'upload';
  status: 'active' | 'completed' | 'cancelled';
}
