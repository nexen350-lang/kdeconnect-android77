/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KdeTopBar } from './KdeTopBar';
import { DevicePluginGrid } from './DevicePluginGrid';
import { RemoteFileBrowserView } from './RemoteFileBrowserView';
import { BulletinChatView } from './BulletinChatView';
import { FindPhoneModal } from './FindPhoneModal';
import { SendFileDialog } from './SendFileDialog';
import { SettingsDrawer } from './SettingsDrawer';
import { DEVICE_LOCAL_S24, DEVICE_REMOTE_PIXEL8 } from '../../data/androidFileSystems';
import { AndroidDevice } from '../../types/kdeConnectApp';
import { 
  Smartphone, 
  Wifi, 
  Battery, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  CheckCircle2,
  Bell
} from 'lucide-react';

export const KdeConnectApp: React.FC = () => {
  const [deviceA, setDeviceA] = useState<AndroidDevice>(DEVICE_LOCAL_S24);
  const [deviceB, setDeviceB] = useState<AndroidDevice>(DEVICE_REMOTE_PIXEL8);
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'remote_files' | 'chat' | 'settings'>('dashboard');

  const [showFindPhone, setShowFindPhone] = useState(false);
  const [showSendFile, setShowSendFile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleSwitchDevicePerspective = () => {
    const temp = deviceA;
    setDeviceA(deviceB);
    setDeviceB(temp);
    showToast(`تم تبديل منظور الهاتف الحالي إلى: ${deviceB.model}`);
  };

  const handleSendPing = () => {
    showToast(`🔔 تم إرسال تنبيه (Ping) فوري إلى ${deviceB.model}`);
  };

  const handleClipboard = () => {
    showToast(`📋 تم نسخ نص الحافظة بنجاح ومزامنته مع ${deviceB.model}`);
  };

  const handleMediaControl = () => {
    showToast(`🎵 تم إرسال أمر تشغيل/إيقاف الوسائط إلى ${deviceB.model}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 font-sans select-none">
      {/* Top Controller Bar */}
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-4 flex items-center justify-between shadow-lg" dir="rtl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
            KDE
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>تطبيق KDE Connect Android</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                P2P Android ⇄ Android
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">
              الهاتف الحالي: <strong className="text-white">{deviceA.model}</strong> • المتصل: <strong className="text-cyan-300">{deviceB.model}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Switch perspective button */}
          <button
            onClick={handleSwitchDevicePerspective}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="التبديل بين الهاتفين لمشاهدة الاستجابة في كلا الطرفين"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">تبديل الهاتف</span>
          </button>

          {/* Toggle Phone Frame */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title={isPhoneFrame ? 'عرض الشاشة الموسعة' : 'عرض إطار الهاتف'}
          >
            {isPhoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Phone Container */}
      <div
        className={`w-full transition-all duration-200 overflow-hidden ${
          isPhoneFrame
            ? 'max-w-md bg-slate-900 border-[6px] border-slate-800 rounded-[40px] shadow-2xl relative min-h-[720px]'
            : 'max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-xl'
        }`}
      >
        {/* Android Native Status Bar */}
        <div className="bg-[#1b2b34] px-6 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-300 border-b border-slate-700/40" dir="ltr">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">1:21</span>
          </div>

          {/* Camera Punch-hole if in phone frame */}
          {isPhoneFrame && (
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 shadow-inner" />
          )}

          <div className="flex items-center gap-2">
            <Wifi className="w-3 h-3 text-white" />
            <span className="text-[10px]">5G</span>
            <div className="flex items-center gap-1 font-bold">
              <span>{deviceA.battery}%</span>
              <Battery className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* KDE Connect Top Bar */}
        <KdeTopBar
          currentDevice={deviceA}
          targetDevice={deviceB}
          activeScreen={activeScreen}
          onNavigate={(screen) => setActiveScreen(screen)}
          onRefresh={() => showToast('جاري البحث عن أجهزة أندرويد على شبكة الواي فاي…')}
          onOpenSettings={() => setShowSettings(true)}
          onOpenEncryptionInfo={() => setShowSettings(true)}
          onSwitchDevice={handleSwitchDevicePerspective}
        />

        {/* Dynamic App Screens */}
        <div className="min-h-[580px] bg-slate-950">
          {activeScreen === 'dashboard' && (
            <DevicePluginGrid
              currentDevice={deviceA}
              targetDevice={deviceB}
              onOpenRemoteFiles={() => setActiveScreen('remote_files')}
              onOpenChat={() => setActiveScreen('chat')}
              onSendFile={() => setShowSendFile(true)}
              onPing={handleSendPing}
              onFindPhone={() => setShowFindPhone(true)}
              onOpenClipboard={handleClipboard}
              onOpenMedia={handleMediaControl}
            />
          )}

          {activeScreen === 'remote_files' && (
            <RemoteFileBrowserView
              currentDevice={deviceA}
              targetDevice={deviceB}
              onBack={() => setActiveScreen('dashboard')}
              onNotify={showToast}
            />
          )}

          {activeScreen === 'chat' && (
            <BulletinChatView
              currentDevice={deviceA}
              targetDevice={deviceB}
              onBack={() => setActiveScreen('dashboard')}
              onNotify={showToast}
            />
          )}
        </div>

        {/* Android Navigation Gesture Bar */}
        <div className="bg-slate-950 py-2.5 flex items-center justify-center">
          <div className="w-32 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>

      {/* Modals */}
      {showFindPhone && (
        <FindPhoneModal
          targetDevice={deviceB}
          onClose={() => setShowFindPhone(false)}
        />
      )}

      {showSendFile && (
        <SendFileDialog
          targetDevice={deviceB}
          onClose={() => setShowSendFile(false)}
          onSendComplete={(name) => showToast(`تم إرسال "${name}" بنجاح إلى ${deviceB.model}!`)}
        />
      )}

      {showSettings && (
        <SettingsDrawer
          currentDevice={deviceA}
          targetDevice={deviceB}
          onClose={() => setShowSettings(false)}
          onNotify={showToast}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 z-50 bg-slate-800 border border-slate-700 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150" dir="rtl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
