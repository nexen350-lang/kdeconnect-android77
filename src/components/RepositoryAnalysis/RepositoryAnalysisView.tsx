/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileText, 
  GitBranch, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Database, 
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';

export const RepositoryAnalysisView: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-xs text-slate-300 space-y-6 shadow-sm leading-relaxed">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Phase 1: Mandatory Repository Analysis &amp; Architecture Specification
          </h2>
        </div>
        <p className="text-slate-400 text-xs mt-1">
          Comparative technical analysis of <strong>KDE Connect Android</strong> (<code className="text-blue-300 font-mono">KDE/kdeconnect-android</code>) and <strong>FileApex</strong> (<code className="text-purple-300 font-mono">byhowiecreations/FileApex</code>).
        </p>
      </div>

      {/* Grid of Key Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KDE Connect Android Architecture */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>KDE Connect Android Architecture</span>
          </div>
          <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
            <li>
              <strong>Build &amp; Language:</strong> Gradle multi-module project (<code className="text-blue-300 font-mono">:core</code>, <code className="text-blue-300 font-mono">:app</code>), mixed Kotlin + Java, target SDK 34/35, min SDK 21.
            </li>
            <li>
              <strong>Discovery &amp; Identity:</strong> UDP broadcasts on port <strong>1716</strong> via <code className="text-blue-300 font-mono">LanLinkProvider</code>. Devices identified by unique UUID, name, and RSA/ECDSA public keys.
            </li>
            <li>
              <strong>Encryption &amp; Transport:</strong> Mutual TLS 1.2/1.3 with custom KeyStore/TrustStore. Packets are newline-delimited JSON objects over secure TCP socket.
            </li>
            <li>
              <strong>Plugin Model:</strong> Extends <code className="text-blue-300 font-mono">BasePlugin</code>. Routes incoming <code className="text-blue-300 font-mono">NetworkPacket</code> by <code className="text-blue-300 font-mono">packet.type</code>.
            </li>
            <li>
              <strong>Current File Transfer / SFTP:</strong> <code className="text-blue-300 font-mono">SftpPlugin</code> runs an embedded SSHD server (Apache Mina SSHD) on ports 1739–1764 so <em>desktops</em> can mount the phone. <strong>Android phone cannot browse remote files</strong> in the UI!
            </li>
          </ul>
        </div>

        {/* FileApex Reference Analysis */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <Layers className="w-4 h-4" />
            <span>FileApex Technical Architecture</span>
          </div>
          <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
            <li>
              <strong>Core Specialization:</strong> Local-first P2P file manager, live filesystem tree querying, and cross-platform shared bulletin boards.
            </li>
            <li>
              <strong>Remote Browsing Mechanism:</strong> Implements a client-server query/response protocol for requesting directory contents (<code className="text-purple-300 font-mono">get_directory_contents</code>) returning names, sizes, permissions, and MIME types.
            </li>
            <li>
              <strong>Bulletin Board &amp; Notes:</strong> Dedicated persistent board with <strong>Smart Delta Sync</strong> to catch up on missed posts, edits, and deletions via timestamp vectors.
            </li>
            <li>
              <strong>Independence:</strong> FileApex implements its own socket/WebRTC layer rather than relying on KDE Connect, but its <strong>protocol abstraction and Room entity schemas</strong> map cleanly into KDE Connect plugins.
            </li>
            <li>
              <strong>Reusability:</strong> We reuse its conceptual directory protocol, smart delta sync algorithm, and persistence model, ported natively to KDE Connect's packet-based architecture.
            </li>
          </ul>
        </div>
      </div>

      {/* Feature 1 Architecture */}
      <div className="space-y-2 border-t border-slate-800 pt-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span>Feature 1: Remote File Browser Architecture</span>
        </h3>
        <p className="text-slate-400">
          Rather than forcing a heavyweight SFTP client library onto Android (which suffers from high battery overhead and complex key management), we introduce a native plugin: <code className="text-cyan-300 font-mono">RemoteBrowsePlugin.kt</code>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-mono text-cyan-400 font-bold block mb-1">Packet Types</span>
            <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
              <li>• kdeconnect.remotebrowse.request</li>
              <li>• kdeconnect.remotebrowse.response</li>
              <li>• kdeconnect.remotebrowse.download</li>
              <li>• kdeconnect.remotebrowse.upload</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-mono text-cyan-400 font-bold block mb-1">Android SAF Storage</span>
            <p className="text-[11px] text-slate-400">
              Integrates with Android's <code className="text-slate-300 font-mono">Storage Access Framework (SAF)</code> and <code className="text-slate-300 font-mono">DocumentFile</code>. Downloads save to user-selected tree URIs with progress feedback and cancellation.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-mono text-rose-400 font-bold block mb-1">Path Traversal Defense</span>
            <p className="text-[11px] text-slate-400">
              Strict path canonicalization (<code className="text-slate-300 font-mono">resolveAndSanitizePath</code>) blocks relative directory escapes (<code className="text-slate-300 font-mono">..</code>) and prevents access outside <code className="text-slate-300 font-mono">AUTHORIZED_STORAGE_ROOT</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Feature 2 Architecture */}
      <div className="space-y-2 border-t border-slate-800 pt-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          <span>Feature 2: Persistent Device Chat &amp; Shared Bulletin Board</span>
        </h3>
        <p className="text-slate-400">
          KDE Connect previously only possessed transient notifications (<code className="text-slate-300 font-mono">PingPlugin</code>) and SMS relay (<code className="text-slate-300 font-mono">SmsPlugin</code>). <code className="text-purple-300 font-mono">ChatPlugin.kt</code> introduces dedicated, persistent inter-device conversations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-mono text-purple-400 font-bold block mb-1">Room Persistence</span>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Table: <code className="text-purple-300 font-mono">kdeconnect_chat_messages</code></li>
              <li>• Scoped by <code className="text-slate-300 font-mono">deviceId</code></li>
              <li>• Indices on timestamp, syncStatus, isPinned</li>
              <li>• Preserves message history across app restarts</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-mono text-purple-400 font-bold block mb-1">Smart Delta Sync</span>
            <p className="text-[11px] text-slate-400">
              When a device reconnects, <code className="text-slate-300 font-mono">ChatPlugin</code> queries its DAO for the last message timestamp and transmits a delta sync request (<code className="text-purple-300 font-mono">kdeconnect.chat.sync_request</code>), avoiding redundant data retransmissions.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-mono text-purple-400 font-bold block mb-1">Offline Queueing</span>
            <p className="text-[11px] text-slate-400">
              Messages drafted while a device is offline are persisted locally with status <code className="text-amber-300 font-mono">QUEUED_OFFLINE</code>. Upon link resumption (<code className="text-slate-300 font-mono">onDeviceConnected</code>), the queue flushes in strict FIFO order.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Verification Table */}
      <div className="border-t border-slate-800 pt-4 space-y-2">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Security, Privacy, and Scoped Storage Guardrails</span>
        </h3>

        <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2 px-3">Security Vector</th>
                <th className="py-2 px-3">KDE Connect Android Defense</th>
                <th className="py-2 px-3">Standard Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              <tr>
                <td className="py-2 px-3 text-rose-300">Path Traversal (CWE-22)</td>
                <td className="py-2 px-3 text-slate-300">File.getCanonicalPath() boundary verification + forbidden ".." check</td>
                <td className="py-2 px-3 text-slate-500">OWASP Top 10 A01:2021</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-amber-300">Android Scoped Storage</td>
                <td className="py-2 px-3 text-slate-300">SAF DocumentFile URI resolution, no raw /Android/data access</td>
                <td className="py-2 px-3 text-slate-500">Android 11+ API 30+</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-blue-300">Network Transport Snooping</td>
                <td className="py-2 px-3 text-slate-300">Mutual TLS 1.3 encryption with certificate fingerprint pinning</td>
                <td className="py-2 px-3 text-slate-500">RFC 8446</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-300">Attachment OOM Crash</td>
                <td className="py-2 px-3 text-slate-300">Binary payload streaming via TCP port instead of inline Base64</td>
                <td className="py-2 px-3 text-slate-500">KDE Connect Wire Spec</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
