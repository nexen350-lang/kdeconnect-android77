/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Sliders, 
  Smartphone, 
  Wifi, 
  FolderTree, 
  MessageSquare, 
  Send, 
  Volume2, 
  Clipboard, 
  Check, 
  HelpCircle 
} from 'lucide-react';
import { AndroidDevice } from '../../types/kdeConnectApp';

interface SettingsDrawerProps {
  currentDevice: AndroidDevice;
  targetDevice: AndroidDevice;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  currentDevice,
  targetDevice,
  onClose,
  onNotify
}) => {
  const [plugins, setPlugins] = useState({
    remoteBrowse: true,
    bulletinChat: true,
    share: true,
    findPhone: true,
    ping: true,
    clipboard: true
  });

  const togglePlugin = (key: keyof typeof plugins) => {
    setPlugins(prev => {
      const next = { ...prev, [key]: !prev[key] };
      onNotify('تم تحديث إعدادات الإضافات بنجاح.');
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-white">إعدادات إضافات KDE Connect</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Encryption & Security Card */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>الاتصال مشفر ومؤمن (TLS 1.3)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يتم تشفير وتأمين جميع الملفات والمحادثات المتبادلة بين {currentDevice.model} و {targetDevice.model} عبر مفاتيح تشفير محلية خاصة دون المرور عبر أي خادم سحابي خارجي.
            </p>
            <div className="bg-slate-900 p-2 rounded-lg font-mono text-[10px] text-slate-300 break-all border border-slate-800" dir="ltr">
              Fingerprint: {targetDevice.tlsFingerprint}
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            الإضافات النشطة للجهاز
          </div>

          {/* Plugin list */}
          <div className="space-y-2">
            {/* Remote Browse Plugin */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">متصفح ملفات الهاتف عن بعد</div>
                  <div className="text-[10px] text-slate-400">تصفح وتحميل ملفات هاتف أندرويد الآخر</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={plugins.remoteBrowse}
                onChange={() => togglePlugin('remoteBrowse')}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Bulletin Chat Plugin */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">محادثة ولوحة Bulletin</div>
                  <div className="text-[10px] text-slate-400">شات P2P وملاحظات دائمة مثبتة</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={plugins.bulletinChat}
                onChange={() => togglePlugin('bulletinChat')}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Share Plugin */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">إرسال واستقبال الملفات</div>
                  <div className="text-[10px] text-slate-400">المشاركة السريعة عبر قائمة المشاركة</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={plugins.share}
                onChange={() => togglePlugin('share')}
                className="w-4 h-4 accent-cyan-600 cursor-pointer"
              />
            </div>

            {/* Find Phone */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">رنين الهاتف (Find Phone)</div>
                  <div className="text-[10px] text-slate-400">نغمة صوتية للبحث عن الهاتف المفقود</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={plugins.findPhone}
                onChange={() => togglePlugin('findPhone')}
                className="w-4 h-4 accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Clipboard */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Clipboard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">مزامنة الحافظة التلقائية</div>
                  <div className="text-[10px] text-slate-400">مزامنة النصوص المنسوخة بين الجهازين</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={plugins.clipboard}
                onChange={() => togglePlugin('clipboard')}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
