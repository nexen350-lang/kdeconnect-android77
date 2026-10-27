/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Bookmark, 
  Pin, 
  PinOff, 
  Trash2, 
  Check, 
  CheckCheck, 
  Sparkles, 
  X, 
  Clock, 
  Tag, 
  Paperclip,
  Smile,
  FileText,
  Smartphone
} from 'lucide-react';
import { AndroidDevice, ChatMessage } from '../../types/kdeConnectApp';

interface BulletinChatViewProps {
  currentDevice: AndroidDevice;
  targetDevice: AndroidDevice;
  onBack: () => void;
  onNotify: (msg: string) => void;
}

const INITIAL_SHARED_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderDeviceId: 'device-pixel-8-pro',
    senderName: 'Pixel 8 Pro',
    text: 'أهلاً! التوصيل عبر شبكة الـ Wi-Fi المحلية نشط ومشفّر ببروتوكول TLS. تم تفعيل ميزة تصفح الملفات ولوحة الـ Bulletin بين الهاتفين بنجاح.',
    timestamp: Date.now() - 3600000 * 2,
    type: 'text',
    status: 'read'
  },
  {
    id: 'msg-2',
    senderDeviceId: 'device-samsung-s24',
    senderName: 'Galaxy S24 Ultra',
    text: 'ممتاز جداً! قمت بتصفح مجلد الـ DCIM/Camera الخاص بك واستطعت تحميل صورة الغروب بجودتها الكاملة بدون أي ضغط.',
    timestamp: Date.now() - 3600000 * 1.8,
    type: 'text',
    status: 'read'
  },
  {
    id: 'note-wifi',
    senderDeviceId: 'device-pixel-8-pro',
    senderName: 'Pixel 8 Pro',
    text: 'اسم الشبكة: HomeMesh-5G\nكلمة المرور: SuperSecretWifi2026\nبوابة الاتصال: 192.168.1.1\nمنفذ KDE Connect: 1716',
    timestamp: Date.now() - 3600000 * 24,
    type: 'bulletin_note',
    noteTitle: 'بيانات شبكة الواي فاي المنزلية المشتركة',
    isPinned: true,
    tags: ['واي_فاي', 'شبكة', 'هام'],
    status: 'read'
  },
  {
    id: 'note-tasks',
    senderDeviceId: 'device-samsung-s24',
    senderName: 'Galaxy S24 Ultra',
    text: '1. نقل ملفات الـ APK التجريبية\n2. مزامنة ألبومات الصور\n3. مراجعة لوحة الـ Bulletin ومسح الملاحظات القديمة',
    timestamp: Date.now() - 3600000 * 8,
    type: 'bulletin_note',
    noteTitle: 'قائمة المهام المشتركة بين الهاتفين',
    isPinned: true,
    tags: ['مهام', 'تزامن'],
    status: 'read'
  }
];

export const BulletinChatView: React.FC<BulletinChatViewProps> = ({
  currentDevice,
  targetDevice,
  onBack,
  onNotify
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('kdeconnect_p2p_chat_history');
      return saved ? JSON.parse(saved) : INITIAL_SHARED_MESSAGES;
    } catch (e) {
      return INITIAL_SHARED_MESSAGES;
    }
  });

  const [activeTab, setActiveTab] = useState<'chat' | 'bulletin'>('chat');
  const [inputText, setInputText] = useState('');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('kdeconnect_p2p_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleSend = () => {
    if (!inputText.trim() && !selectedPhoto) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderDeviceId: currentDevice.id,
      senderName: currentDevice.model,
      text: inputText.trim(),
      timestamp: Date.now(),
      type: selectedPhoto ? 'image' : isNoteMode ? 'bulletin_note' : 'text',
      noteTitle: isNoteMode ? (noteTitle.trim() || 'ملاحظة مشتركة') : undefined,
      isPinned: isNoteMode,
      tags: isNoteMode ? noteTags.split(' ').filter(Boolean) : undefined,
      attachment: selectedPhoto ? {
        name: 'photo_' + Date.now() + '.jpg',
        sizeBytes: 2450000,
        mimeType: 'image/jpeg',
        url: selectedPhoto
      } : undefined,
      status: 'delivered'
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setNoteTitle('');
    setNoteTags('');
    setSelectedPhoto(null);
    setIsNoteMode(false);

    onNotify('تم إرسال الرسالة إلى ' + targetDevice.model);

    // Simulate instant reply from other phone if in regular chat
    if (!isNoteMode && !selectedPhoto) {
      setTimeout(() => {
        const replyText = getRandomReply(targetDevice.model);
        const replyMsg: ChatMessage = {
          id: 'reply-' + Date.now(),
          senderDeviceId: targetDevice.id,
          senderName: targetDevice.model,
          text: replyText,
          timestamp: Date.now(),
          type: 'text',
          status: 'read'
        };
        setMessages(prev => [...prev, replyMsg]);
      }, 1200);
    }
  };

  const getRandomReply = (model: string) => {
    const replies = [
      `تم استلام رسالتك على ${model}! المزامنة اللحظية تعمل بكفاءة.`,
      `تمام، جاري معالجة الطلب في خلفية ${model}.`,
      `وصلتني الرسالة والصور محفوظة في مساحة KDE Connect المشتركة.`,
      `شكراً لك! يمكنك أيضاً إضافة ملاحظات جديدة في لوحة الـ Bulletin.`
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  const handleTogglePin = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m));
  };

  const handleDelete = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    onNotify('تم حذف الرسالة بنجاح.');
  };

  const handleAttachDemoPhoto = () => {
    setSelectedPhoto('https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80');
  };

  const handleUploadImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pinnedNotes = messages.filter(m => m.isPinned);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-lg mx-auto bg-slate-950 text-white" dir="rtl">
      {/* Top Tabs: Conversation vs Bulletin Board */}
      <div className="bg-slate-900 border-b border-slate-800 p-2 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 flex-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5 rotate-180" />
            <span>المحادثة الفورية</span>
            <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded-full font-mono">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bulletin')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'bulletin'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>لوحة الملاحظات (Bulletin)</span>
            {pinnedNotes.length > 0 && (
              <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded-full font-mono">
                {pinnedNotes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map(msg => {
              const isMine = msg.senderDeviceId === currentDevice.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-start' : 'items-end'} group`}
                >
                  <div className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1.5">
                    <span>{msg.senderName}</span>
                    <span>•</span>
                    <span>{formatTime(msg.timestamp)}</span>
                    {msg.isPinned && (
                      <span className="text-purple-400 flex items-center gap-0.5 font-semibold">
                        <Pin className="w-2.5 h-2.5" /> مثبتة في لوحة Bulletin
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 space-y-2 relative shadow-sm ${
                      isMine
                        ? msg.type === 'bulletin_note'
                          ? 'bg-purple-950/40 border border-purple-500/40 text-purple-100 rounded-tr-xs'
                          : 'bg-blue-600 text-white rounded-tr-xs'
                        : msg.type === 'bulletin_note'
                        ? 'bg-slate-900 border border-purple-500/30 text-purple-100 rounded-tl-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {/* Note Title if note */}
                    {msg.noteTitle && (
                      <div className="font-bold text-xs flex items-center gap-1.5 text-purple-300 border-b border-white/10 pb-1">
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{msg.noteTitle}</span>
                      </div>
                    )}

                    {/* Image Attachment */}
                    {msg.attachment?.url && (
                      <div className="rounded-xl overflow-hidden my-1 bg-black/40 border border-black/20">
                        <img
                          src={msg.attachment.url}
                          alt="مرفق"
                          className="max-h-60 w-full object-cover"
                        />
                      </div>
                    )}

                    {/* Text */}
                    {msg.text && (
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </p>
                    )}

                    {/* Tags */}
                    {msg.tags && msg.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {msg.tags.map(t => (
                          <span key={t} className="text-[9px] bg-black/30 text-purple-200 px-1.5 py-0.2 rounded font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between text-[10px] text-white/70 pt-0.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleTogglePin(msg.id)}
                          className="hover:text-purple-300"
                          title={msg.isPinned ? 'إلغاء التثبيت' : 'تثبيت في لوحة Bulletin'}
                        >
                          {msg.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="hover:text-rose-300"
                          title="حذف"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {isMine && (
                        <span className="flex items-center gap-1 text-cyan-200">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>تم الاستلام</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
            {/* Image Preview Chip if attached */}
            {selectedPhoto && (
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedPhoto}
                    alt="صورة"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                  />
                  <span className="text-slate-300">صورة مرفقة جاهزة للإرسال</span>
                </div>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Note Mode Inputs */}
            {isNoteMode && (
              <div className="bg-purple-950/30 border border-purple-500/40 rounded-xl p-2.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span>إنشاء ملاحظة في لوحة الـ Bulletin المشتركة:</span>
                  <button onClick={() => setIsNoteMode(false)} className="text-[11px] text-slate-400">
                    إلغاء
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="عنوان الملاحظة (مثال: كلمة سر الواي فاي)"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    placeholder="وسوم مفصولة بمسافة (مثال: مهم شبكة)"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  isNoteMode 
                    ? "اكتب نص الملاحظة الدائمة هنا ليحفظ بين الهاتفين…" 
                    : `أرسل رسالة إلى ${targetDevice.model}…`
                }
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {/* Attach Image from Phone */}
              <label
                className="p-2 text-slate-400 hover:text-white rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 cursor-pointer"
                title="إرفاق صورة من المعرض"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImageFile}
                  className="hidden"
                />
              </label>

              {/* Demo Photo Quick Attach */}
              <button
                type="button"
                onClick={handleAttachDemoPhoto}
                className="p-2 text-slate-400 hover:text-white rounded-xl border border-slate-700 hover:bg-slate-800"
                title="صورة سريعة تجريبية"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
              </button>

              {/* Toggle Bulletin Note Mode */}
              <button
                type="button"
                onClick={() => setIsNoteMode(!isNoteMode)}
                className={`p-2 rounded-xl border transition-colors ${
                  isNoteMode
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                    : 'text-slate-400 hover:text-white border-slate-700'
                }`}
                title="لوحة الملاحظات الدائمة (Bulletin)"
              >
                <Bookmark className="w-4 h-4 text-purple-400" />
              </button>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!inputText.trim() && !selectedPhoto}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md"
              >
                <Send className="w-3.5 h-3.5 rotate-180" />
                <span>إرسال</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Bulletin Board View */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <span>لوحة إعلانات وملاحظات Bulletin المشتركة</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                الملاحظات الدائمة المحفوظة بين {currentDevice.model} و {targetDevice.model}
              </p>
            </div>

            <button
              onClick={() => {
                setActiveTab('chat');
                setIsNoteMode(true);
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>ملاحظة جديدة</span>
            </button>
          </div>

          {pinnedNotes.length === 0 ? (
            <div className="py-24 text-center text-slate-500 space-y-2">
              <Bookmark className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs font-medium text-slate-400">لا توجد ملاحظات مثبتة حالياً</p>
              <p className="text-[11px] text-slate-500">اضغط على زر &quot;تثبيت في لوحة Bulletin&quot; على أي رسالة لإضافتها هنا</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {pinnedNotes.map(note => (
                <div
                  key={note.id}
                  className="bg-slate-900 border border-purple-500/40 rounded-2xl p-4 space-y-2.5 relative shadow-md hover:border-purple-400 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-xs text-purple-200 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                      <span>{note.noteTitle || 'ملاحظة دائمة'}</span>
                    </h4>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className="p-1 text-slate-400 hover:text-white rounded-md"
                        title="إلغاء التثبيت"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-md"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {note.text}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <div className="flex flex-wrap gap-1">
                      {note.tags?.map(t => (
                        <span key={t} className="px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40 font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span>أضافها: {note.senderName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
