/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  Terminal, 
  AlertTriangle, 
  Lock, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { packetBus } from '../../services/packetBus';

interface PathTraversalSimulatorProps {
  currentRoot: string;
}

export const PathTraversalSimulator: React.FC<PathTraversalSimulatorProps> = ({ currentRoot }) => {
  const [testPayload, setTestPayload] = useState<string>('../../../../etc/shadow');
  const [result, setResult] = useState<{
    tested: boolean;
    blocked: boolean;
    canonicalPath: string;
    violationType?: string;
    pluginLog?: string;
  } | null>(null);

  const PRESET_EXPLOITS = [
    { label: 'Relative Parent Escapes', path: '../../../../etc/shadow' },
    { label: 'URL-Encoded Traversal', path: '..%2F..%2F..%2Froot%2F.bash_history' },
    { label: 'Android Scoped Storage Escape', path: '../../../../Android/data/com.private.app' },
    { label: 'Absolute Path Hijack', path: '/var/log/secure' }
  ];

  const handleExecuteAttack = () => {
    const rawPath = testPayload.trim();
    let decoded = rawPath;
    try {
      decoded = decodeURIComponent(rawPath);
    } catch (e) {
      // ignore
    }

    // Emit simulated request packet to PacketInspector
    packetBus.emitOutgoing('kdeconnect.remotebrowse.request', {
      path: rawPath,
      showHidden: true,
      simulationContext: 'Security Traversal Audit'
    });

    // Run RemoteBrowsePlugin.kt validation logic
    const containsTraversal = decoded.includes('..');
    const isOutsideRoot = !decoded.startsWith(currentRoot);

    if (containsTraversal) {
      packetBus.emitIncoming('kdeconnect.remotebrowse.response', {
        success: false,
        errorCode: 'ERROR_INVALID_PATH_TRAVERSAL',
        errorMessage: 'SecurityException: Illegal directory traversal sequence detected (CWE-22)',
        requestedPath: rawPath
      });

      setResult({
        tested: true,
        blocked: true,
        canonicalPath: currentRoot + '/[REJECTED_TRAVERSAL]',
        violationType: 'Relative path traversal character sequence ("..")',
        pluginLog: 'RemoteBrowsePlugin.kt: [WARN] resolveAndSanitizePath rejected traversal pattern: forbidden sub-token found'
      });
      return;
    }

    if (isOutsideRoot) {
      packetBus.emitIncoming('kdeconnect.remotebrowse.response', {
        success: false,
        errorCode: 'ERROR_ACCESS_DENIED',
        errorMessage: `Path outside authorized storage boundary: ${currentRoot}`,
        requestedPath: rawPath
      });

      setResult({
        tested: true,
        blocked: true,
        canonicalPath: rawPath,
        violationType: 'Canonical boundary escape outside authorized root directory',
        pluginLog: `RemoteBrowsePlugin.kt: [SECURITY] Access to path outside authorized root denied: ${rawPath}`
      });
      return;
    }

    setResult({
      tested: true,
      blocked: false,
      canonicalPath: decoded,
      pluginLog: 'Path is within authorized boundary.'
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h4 className="font-bold text-slate-200">
            Path Traversal Security Defense Sandbox (CWE-22)
          </h4>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
          Authorized Root: {currentRoot}
        </span>
      </div>

      <p className="text-slate-400 leading-relaxed">
        Test how KDE Connect Android's <code className="text-cyan-300 font-mono">RemoteBrowsePlugin.kt</code> canonicalizes input paths, enforces storage boundaries, and neutralizes path traversal payloads before filesystem operations.
      </p>

      {/* Preset Exploit Buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {PRESET_EXPLOITS.map(exploit => (
          <button
            key={exploit.path}
            onClick={() => setTestPayload(exploit.path)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
              testPayload === exploit.path
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-semibold'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {exploit.label}
          </button>
        ))}
      </div>

      {/* Input and Action */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Terminal className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            placeholder="e.g. ../../../../etc/shadow"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
        <button
          onClick={handleExecuteAttack}
          className="px-3.5 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Test Defense</span>
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`p-3 rounded-xl border mt-2 ${
          result.blocked 
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-2 font-bold mb-1">
            {result.blocked ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Exploit Blocked &amp; Neutralized by RemoteBrowsePlugin</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Path Allowed (In authorized root)</span>
              </>
            )}
          </div>
          {result.violationType && (
            <p className="text-[11px] text-slate-300 mt-1">
              <strong>Security Rule Triggered:</strong> {result.violationType}
            </p>
          )}
          <div className="bg-slate-950/80 p-2 rounded-lg font-mono text-[10px] text-slate-400 mt-2 border border-slate-800">
            {result.pluginLog}
          </div>
        </div>
      )}
    </div>
  );
};
