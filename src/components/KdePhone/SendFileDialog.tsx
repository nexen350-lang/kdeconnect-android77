/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Send, Upload, X, CheckCircle2, File, FileImage, FileCode } from 'lucide-react';
import { AndroidDevice } from '../../types/kdeConnectApp';

interface SendFileDialogProps {
  targetDevice: AndroidDevice;
  onClose: () => void;
  onSendComplete: (fileName: string) => void;
}

export const SendFileDialog: React.FC<SendFileDialogProps> = ({
  targetDevice,
  onClose,
  onSendComplete
}) => {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const DEMO_PRESETS = [
    { name: 'KDE_Connect_Kotlin_Update.apk', size: '16.4 MB', icon: <FileCode className="w-5 h-5 text-purple-400" /> },
    { name: 'Camera_Sample_PXL.jpg', size: '4.8 MB', icon: <FileImage className="w-5 h-5 text-emerald-400" /> },
    { name: 'Meeting_Summary_Document.pdf', size: '1.2 MB', icon: <File className="w-5 h-5 text-blue-400" /> }
  ];

  const handleStartSend = (fileName: string) => {
    setSelectedFileName(fileName);
    setIsSending(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onSendComplete(fileName);
            onClose();
          }, 300);
          return 100;
        }
        return prev + 15;
      });
    }, 100);
  };

  const handlePickLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleStartSend(file.name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center text-slate-400">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">إرسال ملفات إلى {targetDevice.model}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSending ? (
          <div className="py-8 space-y-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto animate-pulse">
              <Upload className="w-6 h-6 animate-bounce" />
            </div>
            <div className="font-bold text-xs text-white truncate px-4">
              جاري إرسال: {selectedFileName}
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-cyan-400 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[11px] font-mono text-cyan-400">{progress}% • 18 MB/s</div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              اختر ملفاً من هاتفك لإرساله مباشرة عبر شبكة الواي فاي المشفرة وحفظه في مجلد التنزيلات على {targetDevice.model}:
            </p>

            <label className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95">
              <Upload className="w-4 h-4" />
              <span>اختيار ملف من ذاكرة الهاتف</span>
              <input type="file" onChange={handlePickLocalFile} className="hidden" />
            </label>

            <div className="text-[11px] font-bold text-slate-500 pt-1">أو أرسل ملفاً تجريبياً سريعاً:</div>

            <div className="space-y-1.5">
              {DEMO_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handleStartSend(preset.name)}
                  className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between text-right transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {preset.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate max-w-[170px]">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{preset.size}</div>
                    </div>
                  </div>
                  <Send className="w-4 h-4 text-cyan-400 shrink-0 rotate-180" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
