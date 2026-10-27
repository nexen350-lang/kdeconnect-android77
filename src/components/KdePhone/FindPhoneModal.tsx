/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Smartphone, Bell, X } from 'lucide-react';
import { AndroidDevice } from '../../types/kdeConnectApp';

interface FindPhoneModalProps {
  targetDevice: AndroidDevice;
  onClose: () => void;
}

export const FindPhoneModal: React.FC<FindPhoneModalProps> = ({
  targetDevice,
  onClose
}) => {
  const [isRinging, setIsRinging] = useState(true);

  // Play synthetic beep sound using Web Audio API
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let interval: any = null;

    if (isRinging) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          interval = setInterval(() => {
            if (!audioCtx) return;
            osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
          }, 450);
        }
      } catch (e) {
        console.warn('AudioContext not allowed or supported', e);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx) audioCtx.close();
    };
  }, [isRinging]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center text-slate-400">
          <span className="text-xs font-bold text-slate-300">وظيفة رنين الهاتف (Find My Phone)</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Pulse Waves */}
        <div className="relative py-6 flex items-center justify-center">
          {isRinging && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-amber-500/20 animate-ping" />
              <div className="absolute w-20 h-20 rounded-full bg-amber-500/30 animate-pulse" />
            </>
          )}
          <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 z-10">
            <Volume2 className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-base text-white">
            {isRinging ? `جاري رنين ${targetDevice.model}...` : `تم إيقاف الرنين على ${targetDevice.model}`}
          </h3>
          <p className="text-xs text-slate-400">
            {isRinging 
              ? 'يتم تشغيل نغمة تنبيه رنين قصوى مع الاهتزاز على هاتف أندرويد الآخر لمساعدتك في إيجاده.' 
              : 'تم كتم صوت التنبيه بنجاح.'}
          </p>
        </div>

        <div className="pt-2">
          {isRinging ? (
            <button
              onClick={() => setIsRinging(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              إيقاف الرنين الآن
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
