/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MoreVertical, 
  RefreshCw, 
  Smartphone, 
  Battery, 
  BatteryCharging, 
  ShieldCheck, 
  Settings, 
  Info, 
  ArrowLeft,
  Wifi,
  ChevronDown,
  Layers
} from 'lucide-react';
import { AndroidDevice } from '../../types/kdeConnectApp';

interface KdeTopBarProps {
  currentDevice: AndroidDevice;
  targetDevice: AndroidDevice;
  activeScreen: 'dashboard' | 'remote_files' | 'chat' | 'settings';
  onNavigate: (screen: 'dashboard' | 'remote_files' | 'chat' | 'settings') => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenEncryptionInfo: () => void;
  onSwitchDevice: () => void;
  isRtl?: boolean;
}

export const KdeTopBar: React.FC<KdeTopBarProps> = ({
  currentDevice,
  targetDevice,
  activeScreen,
  onNavigate,
  onRefresh,
  onOpenSettings,
  onOpenEncryptionInfo,
  onSwitchDevice,
  isRtl = true
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'remote_files': return 'تصفح ملفات ' + targetDevice.model;
      case 'chat': return 'المحادثة ولوحة الملاحظات (Bulletin)';
      case 'settings': return 'إعدادات KDE Connect';
      default: return 'KDE Connect';
    }
  };

  return (
    <div className="bg-[#1b2b34] text-white shadow-md border-b border-slate-700/60 sticky top-0 z-30 select-none">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeScreen !== 'dashboard' ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-full hover:bg-slate-700/60 transition-colors"
              title="رجوع للقائمة الرئيسية"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1d99f3] to-[#2980b9] flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-xs tracking-tighter">
              KDE
            </div>
          )}

          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>{getScreenTitle()}</span>
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>متصل بـ {targetDevice.model}</span>
              </span>
              <span>•</span>
              <span className="text-slate-400 font-mono text-[10px]">{targetDevice.ip}</span>
            </div>
          </div>
        </div>

        {/* Actions right */}
        <div className="flex items-center gap-1.5">
          {/* Refresh discovery */}
          <button
            onClick={handleRefresh}
            className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-700/60 transition-colors"
            title="تحديث الأجهزة المتصلة"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* 3-dots overflow menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-700/60 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full text-right px-3.5 py-2 hover:bg-slate-800 flex items-center justify-between gap-2"
                  >
                    <span>إعدادات الإضافات (Plugins)</span>
                    <Settings className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenEncryptionInfo();
                    }}
                    className="w-full text-right px-3.5 py-2 hover:bg-slate-800 flex items-center justify-between gap-2"
                  >
                    <span>بيانات تشفير TLS والبصمة</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onSwitchDevice();
                    }}
                    className="w-full text-right px-3.5 py-2 hover:bg-slate-800 flex items-center justify-between gap-2 text-blue-400"
                  >
                    <span>التبديل لهاتف ({targetDevice.model})</span>
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
