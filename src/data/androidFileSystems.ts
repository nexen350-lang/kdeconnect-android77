/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AndroidDevice, AndroidFile } from '../types/kdeConnectApp';

export const DEVICE_LOCAL_S24: AndroidDevice = {
  id: 'device-samsung-s24',
  name: 'Galaxy S24 Ultra (هذا الهاتف)',
  model: 'SM-S928B',
  androidVersion: 'Android 15 (One UI 7.0)',
  ip: '192.168.1.105',
  battery: 89,
  isCharging: false,
  status: 'connected',
  tlsFingerprint: 'SHA256:88:fe:32:11:09:aa:74:bc:55:23:44:89:12:00:dd:ea',
  storageTotalGb: 512,
  storageUsedGb: 142
};

export const DEVICE_REMOTE_PIXEL8: AndroidDevice = {
  id: 'device-pixel-8-pro',
  name: 'Pixel 8 Pro (الهاتف المتصل)',
  model: 'Google Pixel 8 Pro',
  androidVersion: 'Android 15 (Vanilla Ice Cream)',
  ip: '192.168.1.140',
  battery: 74,
  isCharging: true,
  status: 'connected',
  tlsFingerprint: 'SHA256:1a:2b:3c:4d:5e:6f:70:81:92:a3:b4:c5:d6:e7:f8:09',
  storageTotalGb: 256,
  storageUsedGb: 88
};

// Storage tree on Pixel 8 Pro (the remote device we browse and download from)
export const PIXEL_STORAGE_FILES: Record<string, AndroidFile[]> = {
  '/storage/emulated/0': [
    {
      id: 'dir-dcim',
      name: 'DCIM',
      path: '/storage/emulated/0/DCIM',
      parentPath: '/storage/emulated/0',
      isDirectory: true,
      sizeBytes: 4096,
      lastModified: Date.now() - 3600000 * 4,
      mimeType: 'inode/directory'
    },
    {
      id: 'dir-download',
      name: 'Download',
      path: '/storage/emulated/0/Download',
      parentPath: '/storage/emulated/0',
      isDirectory: true,
      sizeBytes: 8192,
      lastModified: Date.now() - 3600000 * 1,
      mimeType: 'inode/directory'
    },
    {
      id: 'dir-documents',
      name: 'Documents',
      path: '/storage/emulated/0/Documents',
      parentPath: '/storage/emulated/0',
      isDirectory: true,
      sizeBytes: 4096,
      lastModified: Date.now() - 3600000 * 20,
      mimeType: 'inode/directory'
    },
    {
      id: 'dir-pictures',
      name: 'Pictures',
      path: '/storage/emulated/0/Pictures',
      parentPath: '/storage/emulated/0',
      isDirectory: true,
      sizeBytes: 4096,
      lastModified: Date.now() - 3600000 * 48,
      mimeType: 'inode/directory'
    },
    {
      id: 'dir-music',
      name: 'Music',
      path: '/storage/emulated/0/Music',
      parentPath: '/storage/emulated/0',
      isDirectory: true,
      sizeBytes: 4096,
      lastModified: Date.now() - 3600000 * 72,
      mimeType: 'inode/directory'
    },
    {
      id: 'file-quick-memo',
      name: 'Network_Credentials_WiFi.txt',
      path: '/storage/emulated/0/Network_Credentials_WiFi.txt',
      parentPath: '/storage/emulated/0',
      isDirectory: false,
      sizeBytes: 420,
      lastModified: Date.now() - 3600000 * 2,
      mimeType: 'text/plain'
    }
  ],
  '/storage/emulated/0/DCIM': [
    {
      id: 'dir-camera',
      name: 'Camera',
      path: '/storage/emulated/0/DCIM/Camera',
      parentPath: '/storage/emulated/0/DCIM',
      isDirectory: true,
      sizeBytes: 4096,
      lastModified: Date.now() - 3600000 * 3,
      mimeType: 'inode/directory'
    },
    {
      id: 'dir-screenshots',
      name: 'Screenshots',
      path: '/storage/emulated/0/DCIM/Screenshots',
      parentPath: '/storage/emulated/0/DCIM',
      isDirectory: true,
      sizeBytes: 4096,
      lastModified: Date.now() - 3600000 * 10,
      mimeType: 'inode/directory'
    }
  ],
  '/storage/emulated/0/DCIM/Camera': [
    {
      id: 'photo-sunset-pixel',
      name: 'PXL_20261027_174205.jpg',
      path: '/storage/emulated/0/DCIM/Camera/PXL_20261027_174205.jpg',
      parentPath: '/storage/emulated/0/DCIM/Camera',
      isDirectory: false,
      sizeBytes: 4850200, // 4.85 MB
      lastModified: Date.now() - 3600000 * 2,
      mimeType: 'image/jpeg',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'photo-portrait-pixel',
      name: 'PXL_20261026_142010.PORTRAIT.jpg',
      path: '/storage/emulated/0/DCIM/Camera/PXL_20261026_142010.PORTRAIT.jpg',
      parentPath: '/storage/emulated/0/DCIM/Camera',
      isDirectory: false,
      sizeBytes: 6120400, // 6.12 MB
      lastModified: Date.now() - 3600000 * 22,
      mimeType: 'image/jpeg',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'photo-nature-pixel',
      name: 'PXL_20261025_091530.NIGHT.jpg',
      path: '/storage/emulated/0/DCIM/Camera/PXL_20261025_091530.NIGHT.jpg',
      parentPath: '/storage/emulated/0/DCIM/Camera',
      isDirectory: false,
      sizeBytes: 5240000,
      lastModified: Date.now() - 3600000 * 45,
      mimeType: 'image/jpeg',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
    }
  ],
  '/storage/emulated/0/DCIM/Screenshots': [
    {
      id: 'shot-kdeconnect',
      name: 'Screenshot_KDE_Connect_Settings.png',
      path: '/storage/emulated/0/DCIM/Screenshots/Screenshot_KDE_Connect_Settings.png',
      parentPath: '/storage/emulated/0/DCIM/Screenshots',
      isDirectory: false,
      sizeBytes: 1240500,
      lastModified: Date.now() - 3600000 * 8,
      mimeType: 'image/png',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
    }
  ],
  '/storage/emulated/0/Download': [
    {
      id: 'apk-kdeconnect',
      name: 'kdeconnect-android-v1.32.0-debug.apk',
      path: '/storage/emulated/0/Download/kdeconnect-android-v1.32.0-debug.apk',
      parentPath: '/storage/emulated/0/Download',
      isDirectory: false,
      sizeBytes: 17210000, // 17.2 MB
      lastModified: Date.now() - 3600000 * 1,
      mimeType: 'application/vnd.android.package-archive'
    },
    {
      id: 'pdf-guide',
      name: 'Android_P2P_Sync_Architecture.pdf',
      path: '/storage/emulated/0/Download/Android_P2P_Sync_Architecture.pdf',
      parentPath: '/storage/emulated/0/Download',
      isDirectory: false,
      sizeBytes: 3450000, // 3.45 MB
      lastModified: Date.now() - 3600000 * 5,
      mimeType: 'application/pdf'
    },
    {
      id: 'zip-project',
      name: 'KDE_Connect_Kotlin_Plugins.zip',
      path: '/storage/emulated/0/Download/KDE_Connect_Kotlin_Plugins.zip',
      parentPath: '/storage/emulated/0/Download',
      isDirectory: false,
      sizeBytes: 28900000, // 28.9 MB
      lastModified: Date.now() - 3600000 * 18,
      mimeType: 'application/zip'
    }
  ],
  '/storage/emulated/0/Documents': [
    {
      id: 'doc-notes-meeting',
      name: 'Sprint_Meeting_Notes.md',
      path: '/storage/emulated/0/Documents/Sprint_Meeting_Notes.md',
      parentPath: '/storage/emulated/0/Documents',
      isDirectory: false,
      sizeBytes: 14200,
      lastModified: Date.now() - 3600000 * 12,
      mimeType: 'text/markdown'
    },
    {
      id: 'doc-passwords',
      name: 'Backup_Codes_2026.txt',
      path: '/storage/emulated/0/Documents/Backup_Codes_2026.txt',
      parentPath: '/storage/emulated/0/Documents',
      isDirectory: false,
      sizeBytes: 1840,
      lastModified: Date.now() - 3600000 * 28,
      mimeType: 'text/plain'
    }
  ],
  '/storage/emulated/0/Pictures': [],
  '/storage/emulated/0/Music': [
    {
      id: 'audio-track',
      name: 'Ambient_Chill_KDE.mp3',
      path: '/storage/emulated/0/Music/Ambient_Chill_KDE.mp3',
      parentPath: '/storage/emulated/0/Music',
      isDirectory: false,
      sizeBytes: 7850000,
      lastModified: Date.now() - 3600000 * 60,
      mimeType: 'audio/mpeg'
    }
  ]
};
