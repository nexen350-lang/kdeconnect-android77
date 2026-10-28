/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FolderTree, 
  MessageSquare, 
  Send, 
  Bell, 
  Volume2, 
  Clipboard, 
  PlayCircle, 
  Smartphone, 
  Battery, 
  BatteryCharging, 
  ChevronLeft, 
  HardDrive, 
  Wifi, 
  ShieldCheck, 
  Sparkles,
  Download,
  Bookmark
} from 'lucide-react';
import { AndroidDevice } from '../../types/kdeConnectApp';

interface DevicePluginGridProps {
  currentDevice: AndroidDevice;
  targetDevice: AndroidDevice;
  onOpenRemoteFiles: () => void;
  onOpenChat: () => void;
  onSendFile: () => void;
  onPing: () => void;
  onFindPhone: () => void;
  onOpenClipboard: () => void;
  onOpenMedia: () => void;
}

export const DevicePluginGrid: React.FC<DevicePluginGridProps> = ({
  currentDevice,
  targetDevice,
  onOpenRemoteFiles,
  onOpenChat,
  onSendFile,
  onPing,
  onFindPhone,
  onOpenClipboard,
  onOpenMedia
}) => {
  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto" dir="rtl">
      {/* Device Status Card (Material 3 style) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-md text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-tight flex items-center gap-2">
                <span>{targetDevice.name}</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {targetDevice.androidVersion} • {targetDevice.model}
              </p>
            </div>
          </div>

          {/* Battery pill */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-700/80 px-2.5 py-1 rounded-full text-xs font-mono">
            {targetDevice.isCharging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className="font-semibold text-slate-200">{targetDevice.battery}%</span>
          </div>
        </div>

        {/* Quick Connection Details */}
        <div className="mt-3.5 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 font-mono">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>IP: {targetDevice.ip}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-left" dir="ltr">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>{targetDevice.storageUsedGb}GB / {targetDevice.storageTotalGb}GB</span>
          </div>
        </div>
      </div>

      {/* New Requested Features Highlight Banner */}
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
        الميزات الرئيسية المتكاملة (Android ⇄ Android)
      </div>

      {/* Primary Feature 1: Remote File Browser & Downloader */}
      <button
        onClick={onOpenRemoteFiles}
        className="w-full bg-gradient-to-l from-blue-900/30 via-slate-900 to-slate-900 hover:from-blue-900/50 border-2 border-blue-500/50 hover:border-blue-400 rounded-2xl p-4 text-right transition-all group shadow-md hover:shadow-blue-500/10 cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0 group-hover:scale-105 transition-transform">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                تصفح وتحميل ملفات الهاتف المتصل
              </h3>
              <span className="text-[10px] bg-blue-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                جديد
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              استعراض مجلدات ({targetDevice.model})، صور الكاميرا، والتنزيلات، مع إمكانية تحميل أي ملف لهاتفك فوراً.
            </p>
          </div>
        </div>
        <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:-translate-x-1 transition-all shrink-0" />
      </button>

      {/* Primary Feature 2: Bulletin Chat & Persistent Notes */}
      <button
        onClick={onOpenChat}
        className="w-full bg-gradient-to-l from-purple-900/30 via-slate-900 to-slate-900 hover:from-purple-900/50 border-2 border-purple-500/50 hover:border-purple-400 rounded-2xl p-4 text-right transition-all group shadow-md hover:shadow-purple-500/10 cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                محادثة وملاحظات Bulletin بين الهاتفين
              </h3>
              <span className="text-[10px] bg-purple-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                جديد
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              شات مباشر P2P، مشاركة صور، ولوحة إعلانات للملاحظات وكلمات السر الدائمة المشتركة.
            </p>
          </div>
        </div>
        <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:-translate-x-1 transition-all shrink-0" />
      </button>

      {/* Standard KDE Connect Android Plugins */}
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-2">
        وظائف KDE Connect الأساسية
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Multimedia Control (MPRIS) */}
        <button
          onClick={onOpenMedia}
          className="col-span-2 bg-gradient-to-l from-rose-950/40 via-slate-900 to-slate-900 hover:from-rose-900/50 border border-rose-500/30 hover:border-rose-400/60 rounded-2xl p-3.5 text-right transition-all flex items-center justify-between group shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-100 group-hover:text-rose-300 transition-colors">
                  التحكم في الوسائط (Multimedia MPRIS)
                </span>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 font-mono px-1.5 py-0.5 rounded">
                  أساسي
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                تشغيل/إيقاف الأغاني، التخطي، وضبط مستوى صوت {targetDevice.model}
              </p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:-translate-x-1 transition-all" />
        </button>

        {/* Send Files */}
        <button
          onClick={onSendFile}
          className="bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 text-right transition-all flex flex-col justify-between h-28 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-200 group-hover:text-cyan-400 transition-colors">
              إرسال ملفات
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              مشاركة سريعة
            </div>
          </div>
        </button>

        {/* Ring phone (Find my phone) */}
        <button
          onClick={onFindPhone}
          className="bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 text-right transition-all flex flex-col justify-between h-28 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-200 group-hover:text-amber-400 transition-colors">
              رنين الهاتف
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              إيجاد الهاتف الآخر
            </div>
          </div>
        </button>

        {/* Send Ping */}
        <button
          onClick={onPing}
          className="bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 text-right transition-all flex flex-col justify-between h-28 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-200 group-hover:text-purple-400 transition-colors">
              إرسال تنبيه (Ping)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              إشعار فوري
            </div>
          </div>
        </button>

        {/* Shared Clipboard */}
        <button
          onClick={onOpenClipboard}
          className="bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 text-right transition-all flex flex-col justify-between h-28 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <Clipboard className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
              الحافظة المشتركة
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              مزامنة النصوص
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
