/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RemoteFileItem } from '../types/kdeconnect';

export interface RemoteFileSystem {
  rootPath: string;
  allowedRoot: string;
  items: Record<string, RemoteFileItem[]>; // keyed by path
}

export const MOCK_FILE_SYSTEMS: Record<string, RemoteFileSystem> = {
  'device-fedora-desktop': {
    rootPath: '/home/alexander',
    allowedRoot: '/home/alexander',
    items: {
      '/home/alexander': [
        {
          id: 'desktop-docs',
          name: 'Documents',
          path: '/home/alexander/Documents',
          parentPath: '/home/alexander',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 2,
          permissions: 'rwxr-xr-x'
        },
        {
          id: 'desktop-downloads',
          name: 'Downloads',
          path: '/home/alexander/Downloads',
          parentPath: '/home/alexander',
          isDirectory: true,
          sizeBytes: 8192,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 5,
          permissions: 'rwxr-xr-x'
        },
        {
          id: 'desktop-pictures',
          name: 'Pictures',
          path: '/home/alexander/Pictures',
          parentPath: '/home/alexander',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 24,
          permissions: 'rwxr-xr-x'
        },
        {
          id: 'desktop-projects',
          name: 'Development',
          path: '/home/alexander/Development',
          parentPath: '/home/alexander',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 12,
          permissions: 'rwxr-xr-x'
        },
        {
          id: 'desktop-empty-folder',
          name: 'EmptySharedDir',
          path: '/home/alexander/EmptySharedDir',
          parentPath: '/home/alexander',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 48,
          permissions: 'rwxr-xr-x'
        },
        {
          id: 'desktop-sys-restricted',
          name: '.ssh (Protected)',
          path: '/home/alexander/.ssh',
          parentPath: '/home/alexander',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 120,
          permissions: 'rwx------',
          isProtected: true
        },
        {
          id: 'desktop-quick-notes',
          name: 'README_WIFI_SETUP.txt',
          path: '/home/alexander/README_WIFI_SETUP.txt',
          parentPath: '/home/alexander',
          isDirectory: false,
          sizeBytes: 1420,
          mimeType: 'text/plain',
          lastModified: Date.now() - 3600000 * 8,
          permissions: 'rw-r--r--'
        },
        {
          id: 'desktop-kde-theme',
          name: 'breeze-dark-custom.colors',
          path: '/home/alexander/breeze-dark-custom.colors',
          parentPath: '/home/alexander',
          isDirectory: false,
          sizeBytes: 4520,
          mimeType: 'text/plain',
          lastModified: Date.now() - 3600000 * 72,
          permissions: 'rw-r--r--'
        }
      ],
      '/home/alexander/Documents': [
        {
          id: 'doc-arch-spec',
          name: 'KDEConnect_Architecture_Spec.pdf',
          path: '/home/alexander/Documents/KDEConnect_Architecture_Spec.pdf',
          parentPath: '/home/alexander/Documents',
          isDirectory: false,
          sizeBytes: 2450800, // ~2.4 MB
          mimeType: 'application/pdf',
          lastModified: Date.now() - 3600000 * 18,
          permissions: 'rw-r--r--'
        },
        {
          id: 'doc-meeting-notes',
          name: 'Sprint_Planning_Q4.md',
          path: '/home/alexander/Documents/Sprint_Planning_Q4.md',
          parentPath: '/home/alexander/Documents',
          isDirectory: false,
          sizeBytes: 15320,
          mimeType: 'text/markdown',
          lastModified: Date.now() - 3600000 * 6,
          permissions: 'rw-r--r--'
        },
        {
          id: 'doc-financial-budget',
          name: 'Hardware_Budget_2026.xlsx',
          path: '/home/alexander/Documents/Hardware_Budget_2026.xlsx',
          parentPath: '/home/alexander/Documents',
          isDirectory: false,
          sizeBytes: 89400,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          lastModified: Date.now() - 3600000 * 36,
          permissions: 'rw-r--r--'
        }
      ],
      '/home/alexander/Downloads': [
        {
          id: 'dl-kernel-patch',
          name: 'linux-6.12-kdeconnect-boost.patch',
          path: '/home/alexander/Downloads/linux-6.12-kdeconnect-boost.patch',
          parentPath: '/home/alexander/Downloads',
          isDirectory: false,
          sizeBytes: 34120,
          mimeType: 'text/x-diff',
          lastModified: Date.now() - 3600000 * 3,
          permissions: 'rw-r--r--'
        },
        {
          id: 'dl-alpine-iso',
          name: 'alpine-virt-3.20.0-x86_64.iso',
          path: '/home/alexander/Downloads/alpine-virt-3.20.0-x86_64.iso',
          parentPath: '/home/alexander/Downloads',
          isDirectory: false,
          sizeBytes: 61865984, // ~59 MB
          mimeType: 'application/x-iso9660-image',
          lastModified: Date.now() - 3600000 * 14,
          permissions: 'rw-r--r--'
        },
        {
          id: 'dl-font-bundle',
          name: 'FiraCode-NerdFont.tar.gz',
          path: '/home/alexander/Downloads/FiraCode-NerdFont.tar.gz',
          parentPath: '/home/alexander/Downloads',
          isDirectory: false,
          sizeBytes: 18450120, // ~17.5 MB
          mimeType: 'application/gzip',
          lastModified: Date.now() - 3600000 * 48,
          permissions: 'rw-r--r--'
        }
      ],
      '/home/alexander/Pictures': [
        {
          id: 'pic-aurora-wallpaper',
          name: 'plasma_aurora_6k.png',
          path: '/home/alexander/Pictures/plasma_aurora_6k.png',
          parentPath: '/home/alexander/Pictures',
          isDirectory: false,
          sizeBytes: 4210450, // ~4 MB
          mimeType: 'image/png',
          lastModified: Date.now() - 3600000 * 40,
          permissions: 'rw-r--r--',
          previewUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'pic-diagram',
          name: 'P2P_Sync_Topology_Diagram.svg',
          path: '/home/alexander/Pictures/P2P_Sync_Topology_Diagram.svg',
          parentPath: '/home/alexander/Pictures',
          isDirectory: false,
          sizeBytes: 125600,
          mimeType: 'image/svg+xml',
          lastModified: Date.now() - 3600000 * 15,
          permissions: 'rw-r--r--',
          previewUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'
        }
      ],
      '/home/alexander/Development': [
        {
          id: 'dev-kde-repo',
          name: 'kdeconnect-android',
          path: '/home/alexander/Development/kdeconnect-android',
          parentPath: '/home/alexander/Development',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 1,
          permissions: 'rwxr-xr-x'
        },
        {
          id: 'dev-fileapex-repo',
          name: 'FileApex-reference',
          path: '/home/alexander/Development/FileApex-reference',
          parentPath: '/home/alexander/Development',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 2,
          permissions: 'rwxr-xr-x'
        }
      ],
      '/home/alexander/Development/kdeconnect-android': [
        {
          id: 'dev-src-plugins',
          name: 'src/org/kde/kdeconnect/Plugins',
          path: '/home/alexander/Development/kdeconnect-android/Plugins',
          parentPath: '/home/alexander/Development/kdeconnect-android',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 2,
          permissions: 'rwxr-xr-x'
        },
        {
          id: 'dev-gradle-kts',
          name: 'build.gradle.kts',
          path: '/home/alexander/Development/kdeconnect-android/build.gradle.kts',
          parentPath: '/home/alexander/Development/kdeconnect-android',
          isDirectory: false,
          sizeBytes: 7420,
          mimeType: 'text/x-kotlin',
          lastModified: Date.now() - 3600000 * 4,
          permissions: 'rw-r--r--'
        }
      ],
      '/home/alexander/EmptySharedDir': []
    }
  },
  'device-galaxy-tab': {
    rootPath: '/storage/emulated/0',
    allowedRoot: '/storage/emulated/0',
    items: {
      '/storage/emulated/0': [
        {
          id: 'tab-dcim',
          name: 'DCIM',
          path: '/storage/emulated/0/DCIM',
          parentPath: '/storage/emulated/0',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 10,
          permissions: 'rwxrwx---'
        },
        {
          id: 'tab-download',
          name: 'Download',
          path: '/storage/emulated/0/Download',
          parentPath: '/storage/emulated/0',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 2,
          permissions: 'rwxrwx---'
        },
        {
          id: 'tab-documents',
          name: 'Documents',
          path: '/storage/emulated/0/Documents',
          parentPath: '/storage/emulated/0',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 50,
          permissions: 'rwxrwx---'
        },
        {
          id: 'tab-android-restricted',
          name: 'Android (Scoped Storage Restricted)',
          path: '/storage/emulated/0/Android',
          parentPath: '/storage/emulated/0',
          isDirectory: true,
          sizeBytes: 4096,
          mimeType: 'inode/directory',
          lastModified: Date.now() - 3600000 * 200,
          permissions: 'rwx------',
          isProtected: true
        }
      ],
      '/storage/emulated/0/DCIM': [
        {
          id: 'tab-photo-1',
          name: 'IMG_20261027_112004.jpg',
          path: '/storage/emulated/0/DCIM/IMG_20261027_112004.jpg',
          parentPath: '/storage/emulated/0/DCIM',
          isDirectory: false,
          sizeBytes: 3824000,
          mimeType: 'image/jpeg',
          lastModified: Date.now() - 3600000 * 3,
          permissions: 'rw-rw----',
          previewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'tab-photo-2',
          name: 'S-Pen_Sketch_Concept.png',
          path: '/storage/emulated/0/DCIM/S-Pen_Sketch_Concept.png',
          parentPath: '/storage/emulated/0/DCIM',
          isDirectory: false,
          sizeBytes: 1540000,
          mimeType: 'image/png',
          lastModified: Date.now() - 3600000 * 8,
          permissions: 'rw-rw----',
          previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
        }
      ],
      '/storage/emulated/0/Download': [
        {
          id: 'tab-firmware',
          name: 'KDE_Connect_1.32.0-rc3.apk',
          path: '/storage/emulated/0/Download/KDE_Connect_1.32.0-rc3.apk',
          parentPath: '/storage/emulated/0/Download',
          isDirectory: false,
          sizeBytes: 14200000, // ~14.2 MB
          mimeType: 'application/vnd.android.package-archive',
          lastModified: Date.now() - 3600000 * 1,
          permissions: 'rw-rw----'
        }
      ],
      '/storage/emulated/0/Documents': []
    }
  }
};
