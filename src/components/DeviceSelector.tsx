/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Battery, 
  BatteryCharging, 
  Server, 
  Radio, 
  Layers, 
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Laptop
} from 'lucide-react';
import { PairedDevice } from '../types/kdeconnect';

interface DeviceSelectorProps {
  device: PairedDevice;
  isSimulatedOffline: boolean;
  onSendPing: () => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  device,
  isSimulatedOffline,
  onSendPing
}) => {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return <Monitor className="w-5 h-5 text-blue-400" />;
      case 'tablet': return <Tablet className="w-5 h-5 text-emerald-400" />;
      case 'laptop': return <Laptop className="w-5 h-4 text-purple-400" />;
      default: return <Smartphone className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Device Info Header */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 mt-0.5">
            {getDeviceIcon(device.type)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">{device.name}</h2>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isSimulatedOffline
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {isSimulatedOffline ? 'Link: Offline (Simulated)' : 'Link: Paired & TLS Encrypted'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1 font-mono">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                {device.ip}:{device.port}
              </span>
              <span>•</span>
              <span>{device.osName}</span>
              <span>•</span>
              <span className="text-slate-400">KDE Connect {device.kdeConnectVersion}</span>
              {device.batteryPercent !== undefined && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    {device.isCharging ? (
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Battery className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {device.batteryPercent}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Security Signature */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <button
            onClick={onSendPing}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            title="Send kdeconnect.ping packet"
          >
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Send Ping</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-mono bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-400" title={device.tlsFingerprint}>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Fingerprint:</span>
            <span className="text-slate-300 truncate max-w-[120px]">
              {device.tlsFingerprint.replace('SHA256:', '').substring(0, 11)}…
            </span>
          </div>
        </div>
      </div>

      {/* Supported Capabilities Badges */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-500" /> Active Plugins:
        </span>
        {device.supportedPlugins.map(plugin => (
          <span
            key={plugin}
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
              plugin.includes('remotebrowse')
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-semibold'
                : plugin.includes('chat')
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-semibold'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
          >
            {plugin.replace('kdeconnect.', '')}
          </span>
        ))}
      </div>
    </div>
  );
};
