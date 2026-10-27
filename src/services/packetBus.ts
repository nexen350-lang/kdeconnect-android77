/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KDEConnectPacket } from '../types/kdeconnect';

type PacketListener = (packet: KDEConnectPacket) => void;

class PacketBusService {
  private packets: KDEConnectPacket[] = [];
  private listeners: Set<PacketListener> = new Set();
  private maxHistory = 150;

  constructor() {
    // Seed initial handshake packets for realistic trace
    this.recordPacket({
      id: Date.now() - 3600000 * 2,
      type: 'kdeconnect.identity',
      body: {
        deviceId: 'device-fedora-desktop',
        deviceName: 'Archie Desktop',
        deviceType: 'desktop',
        protocolVersion: 7,
        incomingCapabilities: [
          'kdeconnect.remotebrowse',
          'kdeconnect.chat',
          'kdeconnect.sftp',
          'kdeconnect.share'
        ],
        outgoingCapabilities: [
          'kdeconnect.remotebrowse',
          'kdeconnect.chat',
          'kdeconnect.sftp',
          'kdeconnect.share'
        ]
      },
      direction: 'incoming',
      timestamp: Date.now() - 3600000 * 2
    });

    this.recordPacket({
      id: Date.now() - 3600000 * 2 + 150,
      type: 'kdeconnect.pair',
      body: {
        pair: true,
        verificationToken: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384'
      },
      direction: 'outgoing',
      timestamp: Date.now() - 3600000 * 2 + 150
    });
  }

  recordPacket(packet: KDEConnectPacket): void {
    this.packets.unshift(packet);
    if (this.packets.length > this.maxHistory) {
      this.packets.pop();
    }
    this.notifyListeners(packet);
  }

  emitOutgoing(type: string, body: Record<string, any>, payloadSize?: number): KDEConnectPacket {
    const packet: KDEConnectPacket = {
      id: Date.now(),
      type,
      body,
      payloadSize,
      direction: 'outgoing',
      timestamp: Date.now()
    };
    this.recordPacket(packet);
    return packet;
  }

  emitIncoming(type: string, body: Record<string, any>, payloadSize?: number): KDEConnectPacket {
    const packet: KDEConnectPacket = {
      id: Date.now(),
      type,
      body,
      payloadSize,
      direction: 'incoming',
      timestamp: Date.now()
    };
    this.recordPacket(packet);
    return packet;
  }

  getPackets(): KDEConnectPacket[] {
    return [...this.packets];
  }

  clear(): void {
    this.packets = [];
  }

  subscribe(listener: PacketListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(packet: KDEConnectPacket): void {
    this.listeners.forEach(fn => fn(packet));
  }
}

export const packetBus = new PacketBusService();
