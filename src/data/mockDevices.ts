/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PairedDevice } from '../types/kdeconnect';

export const LOCAL_DEVICE: PairedDevice = {
  id: 'device-local-pixel8',
  name: 'Pixel 8 Pro (This Android Device)',
  type: 'phone',
  ip: '192.168.1.120',
  port: 1716,
  tlsFingerprint: 'SHA256:4a:89:12:ef:90:bc:34:78:1a:2b:3c:4d:5e:6f:70:81',
  isPaired: true,
  connectionState: 'connected',
  supportedPlugins: [
    'kdeconnect.remotebrowse',
    'kdeconnect.chat',
    'kdeconnect.sftp',
    'kdeconnect.share',
    'kdeconnect.ping',
    'kdeconnect.telephony',
    'kdeconnect.findmyphone'
  ],
  batteryPercent: 88,
  isCharging: false,
  osName: 'Android 15 (Vanilla Ice Cream)',
  kdeConnectVersion: '1.32.0'
};

export const MOCK_PAIRED_DEVICES: PairedDevice[] = [
  {
    id: 'device-fedora-desktop',
    name: 'Archie Desktop (Fedora 41 / KDE Plasma 6.2)',
    type: 'desktop',
    ip: '192.168.1.145',
    port: 1716,
    tlsFingerprint: 'SHA256:7f:32:89:ac:bb:12:44:98:ec:01:23:45:67:89:ab:cd',
    isPaired: true,
    connectionState: 'connected',
    supportedPlugins: [
      'kdeconnect.remotebrowse',
      'kdeconnect.chat',
      'kdeconnect.sftp',
      'kdeconnect.share',
      'kdeconnect.ping',
      'kdeconnect.mousepad',
      'kdeconnect.mpris'
    ],
    batteryPercent: 100,
    isCharging: true,
    osName: 'Linux (Fedora 41 KDE Spin)',
    kdeConnectVersion: '24.08.3'
  },
  {
    id: 'device-galaxy-tab',
    name: 'Galaxy Tab S9 (Android 14 / One UI 6.1)',
    type: 'tablet',
    ip: '192.168.1.189',
    port: 1716,
    tlsFingerprint: 'SHA256:11:44:77:aa:dd:00:22:55:88:bb:ee:11:33:66:99:cc',
    isPaired: true,
    connectionState: 'connected',
    supportedPlugins: [
      'kdeconnect.remotebrowse',
      'kdeconnect.chat',
      'kdeconnect.sftp',
      'kdeconnect.share',
      'kdeconnect.ping'
    ],
    batteryPercent: 64,
    isCharging: false,
    osName: 'Android 14 (One UI 6.1)',
    kdeConnectVersion: '1.32.0'
  },
  {
    id: 'device-macbook-pro',
    name: 'MacBook Pro M3 (Sonoma 14.5)',
    type: 'laptop',
    ip: '192.168.1.102',
    port: 1716,
    tlsFingerprint: 'SHA256:99:88:77:66:55:44:33:22:11:00:ff:ee:dd:cc:bb:aa',
    isPaired: true,
    connectionState: 'disconnected',
    supportedPlugins: [
      'kdeconnect.sftp',
      'kdeconnect.chat',
      'kdeconnect.share'
    ],
    batteryPercent: 92,
    isCharging: true,
    osName: 'macOS Sonoma 14.5',
    kdeConnectVersion: '24.08.2'
  }
];
