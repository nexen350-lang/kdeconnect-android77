/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Volume1, 
  RotateCcw, 
  RotateCw, 
  Music, 
  Radio, 
  Disc, 
  X, 
  Check, 
  Sliders, 
  Smartphone,
  Sparkles
} from 'lucide-react';
import { AndroidDevice } from '../../types/kdeConnectApp';
import { packetBus } from '../../services/packetBus';

interface MultimediaControlModalProps {
  targetDevice: AndroidDevice;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

interface MediaPlayerState {
  player: string;
  appIcon: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  position: number; // in seconds
  isPlaying: boolean;
  volume: number; // 0 - 100
  isMuted: boolean;
}

const SAMPLE_PLAYERS: Record<string, MediaPlayerState> = {
  spotify: {
    player: 'Spotify',
    appIcon: '🟢',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    position: 72,
    isPlaying: true,
    volume: 75,
    isMuted: false
  },
  youtube: {
    player: 'YouTube Music',
    appIcon: '🔴',
    title: 'Starboy (Feat. Daft Punk)',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: 230,
    position: 110,
    isPlaying: false,
    volume: 60,
    isMuted: false
  },
  vlc: {
    player: 'VLC Media Player',
    appIcon: '🟠',
    title: 'Podcast Episode 42 - Android OS',
    artist: 'Tech Daily Audio',
    album: 'Internal Storage / Podcasts',
    duration: 1800,
    position: 450,
    isPlaying: true,
    volume: 90,
    isMuted: false
  }
};

export const MultimediaControlModal: React.FC<MultimediaControlModalProps> = ({
  targetDevice,
  onClose,
  onNotify
}) => {
  const [selectedPlayerKey, setSelectedPlayerKey] = useState<string>('spotify');
  const [playerState, setPlayerState] = useState<MediaPlayerState>(SAMPLE_PLAYERS['spotify']);
  const [lastAction, setLastAction] = useState<string>('متزامن عبر kdeconnect.mpris');

  // Sync state when active player changes
  const handleSelectPlayer = (key: string) => {
    setSelectedPlayerKey(key);
    setPlayerState(SAMPLE_PLAYERS[key]);
    setLastAction(`تم التبديل لمشغل ${SAMPLE_PLAYERS[key].player}`);
    onNotify(`تم الاتصال بمشغل ${SAMPLE_PLAYERS[key].player} على ${targetDevice.model}`);
  };

  // Simulate playback timer
  useEffect(() => {
    if (!playerState.isPlaying) return;

    const timer = setInterval(() => {
      setPlayerState(prev => {
        if (prev.position >= prev.duration) {
          return { ...prev, position: 0 };
        }
        return { ...prev, position: prev.position + 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playerState.isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlayPause = () => {
    const nextPlay = !playerState.isPlaying;
    setPlayerState(prev => ({ ...prev, isPlaying: nextPlay }));
    const actionName = nextPlay ? 'Play' : 'Pause';
    setLastAction(`أمر: kdeconnect.mpris.request -> ${actionName}`);
    
    packetBus.recordPacket({
      id: Date.now(),
      type: 'kdeconnect.mpris.request',
      body: {
        player: playerState.player,
        action: actionName
      },
      direction: 'outgoing',
      timestamp: Date.now()
    });

    onNotify(`${nextPlay ? '▶️ تشغيل' : '⏸️ إيقاف مؤقت'} على ${targetDevice.model}`);
  };

  const handleNext = () => {
    setPlayerState(prev => ({
      ...prev,
      title: 'Save Your Tears',
      position: 0,
      isPlaying: true
    }));
    setLastAction('أمر: kdeconnect.mpris.request -> Next');

    packetBus.recordPacket({
      id: Date.now(),
      type: 'kdeconnect.mpris.request',
      body: {
        player: playerState.player,
        action: 'Next'
      },
      direction: 'outgoing',
      timestamp: Date.now()
    });

    onNotify(`⏭️ الانتقال للمقطع التالي على ${targetDevice.model}`);
  };

  const handlePrevious = () => {
    setPlayerState(prev => ({
      ...prev,
      title: 'In Your Eyes',
      position: 0,
      isPlaying: true
    }));
    setLastAction('أمر: kdeconnect.mpris.request -> Previous');

    packetBus.recordPacket({
      id: Date.now(),
      type: 'kdeconnect.mpris.request',
      body: {
        player: playerState.player,
        action: 'Previous'
      },
      direction: 'outgoing',
      timestamp: Date.now()
    });

    onNotify(`⏮️ الانتقال للمقطع السابق على ${targetDevice.model}`);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setPlayerState(prev => ({ ...prev, position: val }));
    setLastAction(`أمر: kdeconnect.mpris.request -> Seek (${formatTime(val)})`);

    packetBus.recordPacket({
      id: Date.now(),
      type: 'kdeconnect.mpris.request',
      body: {
        player: playerState.player,
        action: 'SetPosition',
        position: val * 1000
      },
      direction: 'outgoing',
      timestamp: Date.now()
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setPlayerState(prev => ({ ...prev, volume: val, isMuted: val === 0 }));
    setLastAction(`أمر: kdeconnect.mpris.request -> SetVolume (${val}%)`);

    packetBus.recordPacket({
      id: Date.now(),
      type: 'kdeconnect.mpris.request',
      body: {
        player: playerState.player,
        action: 'SetVolume',
        volume: val
      },
      direction: 'outgoing',
      timestamp: Date.now()
    });
  };

  const handleToggleMute = () => {
    const nextMute = !playerState.isMuted;
    setPlayerState(prev => ({ ...prev, isMuted: nextMute }));
    setLastAction(`أمر: kdeconnect.mpris.request -> ${nextMute ? 'Mute' : 'Unmute'}`);
    onNotify(`${nextMute ? '🔇 كتم الصوت' : '🔊 إلغاء الكتم'} على ${targetDevice.model}`);
  };

  const handleSkip10 = (forward: boolean) => {
    setPlayerState(prev => {
      const delta = forward ? 10 : -10;
      const nextPos = Math.max(0, Math.min(prev.duration, prev.position + delta));
      return { ...prev, position: nextPos };
    });
    setLastAction(`أمر: kdeconnect.mpris.request -> ${forward ? '+10s' : '-10s'}`);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 z-50 select-none" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>التحكم في الوسائط (Multimedia MPRIS)</span>
              </h2>
              <p className="text-[10px] text-slate-400">
                التحكم بمشغلات {targetDevice.model}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {Object.entries(SAMPLE_PLAYERS).map(([key, item]) => {
            const isSelected = selectedPlayerKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSelectPlayer(key)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{item.appIcon}</span>
                <span className="truncate">{item.player.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Album Artwork & Track Info */}
        <div className="bg-gradient-to-b from-slate-800/80 to-slate-950 border border-slate-700/60 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden">
          {/* Vinyl / CD Animation */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div 
              className={`w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-700 shadow-xl flex items-center justify-center ${
                playerState.isPlaying ? 'animate-spin [animation-duration:6s]' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-inner">
                <Disc className="w-5 h-5 text-white" />
              </div>
            </div>
            {playerState.isPlaying && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            )}
          </div>

          <div>
            <h3 className="font-bold text-sm text-white truncate px-2">
              {playerState.title}
            </h3>
            <p className="text-xs text-rose-400 font-medium mt-0.5">
              {playerState.artist}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              {playerState.album}
            </p>
          </div>

          {/* Progress Timeline Slider */}
          <div className="space-y-1 pt-1">
            <input
              type="range"
              min={0}
              max={playerState.duration}
              value={playerState.position}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400" dir="ltr">
              <span>{formatTime(playerState.position)}</span>
              <span>{formatTime(playerState.duration)}</span>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Skip -10s */}
          <button
            onClick={() => handleSkip10(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="رجوع 10 ثواني"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Previous Track */}
          <button
            onClick={handlePrevious}
            className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="المقطع السابق"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            onClick={handleTogglePlayPause}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={playerState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {playerState.isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={handleNext}
            className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="المقطع التالي"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Skip +10s */}
          <button
            onClick={() => handleSkip10(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="تقديم 10 ثواني"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Control Bar */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-3">
          <button
            onClick={handleToggleMute}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title={playerState.isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
          >
            {playerState.isMuted || playerState.volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : playerState.volume > 50 ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <Volume1 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            value={playerState.isMuted ? 0 : playerState.volume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <span className="text-[11px] font-mono text-slate-400 w-8 text-left" dir="ltr">
            {playerState.isMuted ? '0%' : `${playerState.volume}%`}
          </span>
        </div>

        {/* Packet Protocol Footer */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2 text-[10px] text-slate-400 font-mono flex items-center justify-between" dir="ltr">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate">{lastAction}</span>
          </div>
          <span className="text-slate-500 text-[9px]">kdeconnect.mpris</span>
        </div>
      </div>
    </div>
  );
};
