/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, SyncStatus } from '../types/kdeconnect';

const STORAGE_KEY_PREFIX = 'kdeconnect_chat_v1_';

const DEFAULT_SEED_MESSAGES: Record<string, ChatMessage[]> = {
  'device-fedora-desktop': [
    {
      id: 'seed-msg-1',
      deviceId: 'device-fedora-desktop',
      senderId: 'device-fedora-desktop',
      senderName: 'Archie Desktop',
      recipientId: 'local',
      messageType: 'text',
      content: 'Hey! I pushed the new kernel patch and KDE Connect v1.32 build into ~/Downloads. Feel free to browse and grab it anytime.',
      timestamp: Date.now() - 3600000 * 3,
      syncStatus: 'delivered'
    },
    {
      id: 'seed-msg-2',
      deviceId: 'device-fedora-desktop',
      senderId: 'local',
      senderName: 'This Android Device',
      recipientId: 'device-fedora-desktop',
      messageType: 'text',
      content: 'Awesome, checking the remote file browser now. Did you configure the SFTP mount port or native browse?',
      timestamp: Date.now() - 3600000 * 2.8,
      syncStatus: 'delivered'
    },
    {
      id: 'seed-msg-3',
      deviceId: 'device-fedora-desktop',
      senderId: 'device-fedora-desktop',
      senderName: 'Archie Desktop',
      recipientId: 'local',
      messageType: 'text',
      content: 'Native kdeconnect.remotebrowse packet protocol! No external SSH server needed, fully sandboxed.',
      timestamp: Date.now() - 3600000 * 2.5,
      syncStatus: 'delivered'
    },
    {
      id: 'seed-note-1',
      deviceId: 'device-fedora-desktop',
      senderId: 'device-fedora-desktop',
      senderName: 'Archie Desktop',
      recipientId: 'local',
      messageType: 'note',
      noteTitle: 'Home Lab Wi-Fi & WireGuard Config',
      content: 'SSID: AuroraNet-5G\nGateway: 192.168.1.1\nWireGuard Peer: 10.14.0.2/32\nDNS: 1.1.1.1, 9.9.9.9\nKDE Connect Listening Port: 1716 UDP/TCP',
      timestamp: Date.now() - 3600000 * 24,
      syncStatus: 'delivered',
      isPinned: true,
      tags: ['Network', 'Credentials', 'Pinned']
    },
    {
      id: 'seed-note-2',
      deviceId: 'device-fedora-desktop',
      senderId: 'local',
      senderName: 'This Android Device',
      recipientId: 'device-fedora-desktop',
      messageType: 'note',
      noteTitle: 'Code Review Checklist',
      content: '1. Verify path traversal sanitization\n2. Test Room DB migration fallback\n3. Verify Android 14 Scoped Storage SAF permissions\n4. Benchmark packet throughput with 50MB file',
      timestamp: Date.now() - 3600000 * 12,
      syncStatus: 'delivered',
      isPinned: true,
      tags: ['Sprint', 'Checklist']
    }
  ],
  'device-galaxy-tab': [
    {
      id: 'seed-tab-1',
      deviceId: 'device-galaxy-tab',
      senderId: 'device-galaxy-tab',
      senderName: 'Galaxy Tab S9',
      recipientId: 'local',
      messageType: 'text',
      content: 'I exported the S-Pen architectural sketch into DCIM. You can download it directly via the Remote Browser tab.',
      timestamp: Date.now() - 3600000 * 1.5,
      syncStatus: 'delivered'
    },
    {
      id: 'seed-tab-note-1',
      deviceId: 'device-galaxy-tab',
      senderId: 'device-galaxy-tab',
      senderName: 'Galaxy Tab S9',
      recipientId: 'local',
      messageType: 'note',
      noteTitle: 'Stylus Calibration Values',
      content: 'Pressure sensitivity: 4096 levels\nLatency target: < 2.8ms\nTilt offset: enabled',
      timestamp: Date.now() - 3600000 * 5,
      syncStatus: 'delivered',
      isPinned: true,
      tags: ['Hardware', 'S-Pen']
    }
  ]
};

export const storageService = {
  getMessages(deviceId: string): ChatMessage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + deviceId);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load chat history from localStorage', e);
    }

    // Return default seed if first time
    const initial = DEFAULT_SEED_MESSAGES[deviceId] || [];
    this.saveMessages(deviceId, initial);
    return initial;
  },

  saveMessages(deviceId: string, messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + deviceId, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history to localStorage', e);
    }
  },

  addMessage(message: ChatMessage): void {
    const list = this.getMessages(message.deviceId);
    // Replace if id exists, otherwise append
    const idx = list.findIndex(m => m.id === message.id);
    if (idx >= 0) {
      list[idx] = message;
    } else {
      list.push(message);
    }
    this.saveMessages(message.deviceId, list);
  },

  updateMessageStatus(deviceId: string, messageId: string, status: SyncStatus): void {
    const list = this.getMessages(deviceId);
    const item = list.find(m => m.id === messageId);
    if (item) {
      item.syncStatus = status;
      this.saveMessages(deviceId, list);
    }
  },

  togglePin(deviceId: string, messageId: string): void {
    const list = this.getMessages(deviceId);
    const item = list.find(m => m.id === messageId);
    if (item) {
      item.isPinned = !item.isPinned;
      this.saveMessages(deviceId, list);
    }
  },

  deleteMessage(deviceId: string, messageId: string): void {
    const list = this.getMessages(deviceId);
    const item = list.find(m => m.id === messageId);
    if (item) {
      item.isDeleted = true;
      this.saveMessages(deviceId, list.filter(m => m.id !== messageId));
    }
  },

  clearHistory(deviceId: string): void {
    this.saveMessages(deviceId, []);
  },

  flushOfflineQueue(deviceId: string): ChatMessage[] {
    const list = this.getMessages(deviceId);
    const updated = list.map(m => {
      if (m.syncStatus === 'queued_offline') {
        return { ...m, syncStatus: 'delivered' as SyncStatus };
      }
      return m;
    });
    this.saveMessages(deviceId, updated);
    return updated.filter(m => m.syncStatus === 'delivered');
  }
};
