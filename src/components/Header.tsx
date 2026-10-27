/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FolderTree, 
  MessageSquare, 
  Binary, 
  Code, 
  CheckCircle2, 
  FileText, 
  Wifi, 
  WifiOff, 
  ShieldCheck,
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  Github
} from 'lucide-react';
import { PairedDevice } from '../types/kdeconnect';

interface HeaderProps {
  activeTab: 'browser' | 'chat' | 'inspector' | 'code' | 'tests' | 'analysis' | 'apk';
  setActiveTab: (tab: 'browser' | 'chat' | 'inspector' | 'code' | 'tests' | 'analysis' | 'apk') => void;
  selectedDevice: PairedDevice;
  pairedDevices: PairedDevice[];
  onSelectDevice: (device: PairedDevice) => void;
  isSimulatedOffline: boolean;
  onToggleOffline: () => void;
  packetCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedDevice,
  pairedDevices,
  onSelectDevice,
  isSimulatedOffline,
  onToggleOffline,
  packetCount
}) => {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return <Monitor className="w-4 h-4 text-blue-400" />;
      case 'tablet': return <Tablet className="w-4 h-4 text-emerald-400" />;
      case 'laptop': return <Laptop className="w-4 h-4 text-purple-400" />;
      default: return <Smartphone className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          {/* KDE Connect Icon Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-sm tracking-tighter">
            KDE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">KDE Connect Android</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-medium border border-blue-500/30">
                v1.32.0 Integration
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Remote File Browser &amp; Persistent Device Chat / Bulletin Board (FileApex Reference)
            </p>
          </div>
        </div>

        {/* Device Quick Switcher & Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Paired Device Picker */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
            <span className="text-xs text-slate-400 px-2 flex items-center gap-1.5 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>Target:</span>
            </span>
            <select
              value={selectedDevice.id}
              onChange={(e) => {
                const found = pairedDevices.find(d => d.id === e.target.value);
                if (found) onSelectDevice(found);
              }}
              className="bg-slate-900 text-xs text-slate-200 font-medium rounded-md px-2.5 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {pairedDevices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.ip})
                </option>
              ))}
            </select>
          </div>

          {/* Offline Simulator Toggle */}
          <button
            onClick={onToggleOffline}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              isSimulatedOffline
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
            title="Simulate network disconnection to test Room DB offline queueing and auto-sync"
          >
            {isSimulatedOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate: Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Link: TLS Active</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center overflow-x-auto no-scrollbar gap-1 pt-1">
        <button
          onClick={() => setActiveTab('browser')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'browser'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Remote File Browser</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'chat'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Device Chat &amp; Bulletin</span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'inspector'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Packet Inspector</span>
          {packetCount > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {packetCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'code'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Android Kotlin Source</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
            Ready to Merge
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'tests'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Test Suite Runner</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'analysis'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Phase 1 Architecture Report</span>
        </button>

        <button
          onClick={() => setActiveTab('apk')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'apk'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Github className="w-4 h-4 text-purple-400" />
          <span>GitHub Actions (بناء APK)</span>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono font-semibold">
            APK CI/CD
          </span>
        </button>
      </div>
    </header>
  );
};
