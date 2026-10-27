/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Pin, 
  Trash2, 
  Clock, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  Bookmark, 
  Paperclip, 
  X, 
  RefreshCw, 
  Tag, 
  Sparkles, 
  FileText,
  PinOff,
  Search
} from 'lucide-react';
import { PairedDevice, ChatMessage, SyncStatus } from '../../types/kdeconnect';
import { storageService } from '../../services/storageService';
import { packetBus } from '../../services/packetBus';

interface DeviceChatViewProps {
  device: PairedDevice;
  isSimulatedOffline: boolean;
}

export const DeviceChatView: React.FC<DeviceChatViewProps> = ({
  device,
  isSimulatedOffline
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'messages' | 'bulletin'>('messages');
  const [inputText, setInputText] = useState<string>('');
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteTags, setNoteTags] = useState<string>('');
  const [attachmentPreview, setAttachmentPreview] = useState<{
    name: string;
    size: number;
    mime: string;
    dataUrl: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load device-specific messages from persistent storage
  const loadMessages = () => {
    const list = storageService.getMessages(device.id);
    setMessages(list);
  };

  useEffect(() => {
    loadMessages();
  }, [device.id]);

  // Flush offline queue when device becomes online
  useEffect(() => {
    if (!isSimulatedOffline) {
      const flushed = storageService.flushOfflineQueue(device.id);
      if (flushed.length > 0) {
        // Emit sync response and ACKs
        packetBus.emitOutgoing('kdeconnect.chat.sync_request', {
          deviceId: device.id,
          flushedCount: flushed.length
        });
        flushed.forEach(msg => {
          packetBus.emitIncoming('kdeconnect.chat.ack', {
            messageId: msg.id,
            status: 'delivered',
            timestamp: Date.now()
          });
        });
        loadMessages();
      }
    }
  }, [isSimulatedOffline, device.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeSubTab]);

  const handleSendMessage = () => {
    if (!inputText.trim() && !attachmentPreview) return;

    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const timestamp = Date.now();
    const initialStatus: SyncStatus = isSimulatedOffline ? 'queued_offline' : 'delivered';

    const tagsArray = noteTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newMessage: ChatMessage = {
      id: messageId,
      deviceId: device.id,
      senderId: 'local',
      senderName: 'This Android Device',
      recipientId: device.id,
      messageType: attachmentPreview ? 'image' : isNoteMode ? 'note' : 'text',
      content: inputText.trim(),
      noteTitle: isNoteMode ? (noteTitle.trim() || 'Quick Note') : undefined,
      attachmentName: attachmentPreview?.name,
      attachmentSize: attachmentPreview?.size,
      attachmentMime: attachmentPreview?.mime,
      attachmentDataUrl: attachmentPreview?.dataUrl,
      timestamp,
      syncStatus: initialStatus,
      isPinned: isNoteMode,
      tags: tagsArray.length > 0 ? tagsArray : (isNoteMode ? ['Memo'] : undefined)
    };

    // Save locally
    storageService.addMessage(newMessage);

    // Emit packet
    packetBus.emitOutgoing('kdeconnect.chat.message', {
      id: newMessage.id,
      messageType: newMessage.messageType,
      content: newMessage.content,
      noteTitle: newMessage.noteTitle,
      isPinned: newMessage.isPinned,
      tags: newMessage.tags,
      attachmentName: newMessage.attachmentName,
      attachmentSize: newMessage.attachmentSize,
      timestamp: newMessage.timestamp
    }, newMessage.attachmentSize);

    // If online, simulate recipient ACK packet
    if (!isSimulatedOffline) {
      setTimeout(() => {
        packetBus.emitIncoming('kdeconnect.chat.ack', {
          messageId: newMessage.id,
          status: 'delivered',
          timestamp: Date.now()
        });
      }, 250);
    }

    // Reset inputs
    setInputText('');
    setNoteTitle('');
    setNoteTags('');
    setAttachmentPreview(null);
    setIsNoteMode(false);
    loadMessages();
  };

  const handleTogglePin = (messageId: string) => {
    storageService.togglePin(device.id, messageId);
    packetBus.emitOutgoing('kdeconnect.chat.action', {
      action: 'togglePin',
      messageId
    });
    loadMessages();
  };

  const handleDeleteMessage = (messageId: string) => {
    storageService.deleteMessage(device.id, messageId);
    packetBus.emitOutgoing('kdeconnect.chat.action', {
      action: 'delete',
      messageId
    });
    loadMessages();
  };

  const handleClearHistory = () => {
    if (window.confirm(`Clear all conversation history and notes with ${device.name}?`)) {
      storageService.clearHistory(device.id);
      loadMessages();
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentPreview({
        name: file.name,
        size: file.size,
        mime: file.type || 'image/jpeg',
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAttachDemoPhoto = () => {
    setAttachmentPreview({
      name: 'screen_shot_terminal.png',
      size: 420800,
      mime: 'image/png',
      dataUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pinnedNotes = messages.filter(m => m.isPinned);
  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.noteTitle && m.noteTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Offline Queue Notice */}
      {isSimulatedOffline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Device Offline:</strong> Outgoing chat messages and bulletin notes will queue locally in Room SQLite database and sync automatically once the link resumes.
            </span>
          </div>
          <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded">
            Queue Active
          </span>
        </div>
      )}

      {/* Chat View Header Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        {/* Sub-tabs: Messages vs Bulletin Board */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveSubTab('messages')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'messages'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Conversation</span>
            <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('bulletin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'bulletin'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bulletin Board</span>
            {pinnedNotes.length > 0 && (
              <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full">
                {pinnedNotes.length}
              </span>
            )}
          </button>
        </div>

        {/* Search & Clear History */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat &amp; notes…"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            title="Clear conversation history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Conversation Container */}
      {activeSubTab === 'messages' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px]">
          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Bookmark className="w-8 h-8 text-slate-600" />
                <p className="text-xs font-medium text-slate-400">No messages in conversation</p>
                <p className="text-[11px] text-slate-500">
                  Send a text, share an image, or pin a persistent note with {device.name}
                </p>
              </div>
            ) : (
              filteredMessages.map(msg => {
                const isLocal = msg.senderId === 'local';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isLocal ? 'items-end' : 'items-start'} group`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 mb-1">
                      <span>{msg.senderName}</span>
                      <span>•</span>
                      <span>{formatTime(msg.timestamp)}</span>
                      {msg.isPinned && (
                        <span className="flex items-center gap-0.5 text-purple-400 font-semibold bg-purple-500/10 px-1 rounded">
                          <Pin className="w-2.5 h-2.5" /> Pinned Note
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 space-y-2 relative transition-all ${
                        isLocal
                          ? msg.messageType === 'note'
                            ? 'bg-gradient-to-br from-purple-900/40 to-slate-800 border border-purple-500/40 text-purple-100 shadow-sm'
                            : 'bg-blue-600 text-white shadow-xs'
                          : msg.messageType === 'note'
                          ? 'bg-slate-800/90 border border-purple-500/30 text-purple-100 shadow-sm'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/80'
                      }`}
                    >
                      {/* Note Title if present */}
                      {msg.noteTitle && (
                        <div className="font-bold text-xs flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                          <span className="flex items-center gap-1.5">
                            <Bookmark className="w-3.5 h-3.5 text-purple-300" />
                            {msg.noteTitle}
                          </span>
                        </div>
                      )}

                      {/* Image Attachment */}
                      {msg.attachmentDataUrl && (
                        <div className="rounded-xl overflow-hidden border border-black/20 my-1 bg-black/40">
                          <img
                            src={msg.attachmentDataUrl}
                            alt={msg.attachmentName || 'Attachment'}
                            className="max-h-60 w-full object-cover"
                          />
                          {msg.attachmentName && (
                            <div className="p-1.5 text-[10px] bg-black/60 font-mono text-slate-300 flex items-center justify-between">
                              <span className="truncate">{msg.attachmentName}</span>
                              {msg.attachmentSize ? (
                                <span>{(msg.attachmentSize / 1024).toFixed(0)} KB</span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Text Content */}
                      {msg.content && (
                        <p className="text-xs whitespace-pre-wrap leading-relaxed break-words">
                          {msg.content}
                        </p>
                      )}

                      {/* Tags */}
                      {msg.tags && msg.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {msg.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/25 text-purple-200 border border-purple-400/20"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Status row for local sender */}
                      {isLocal && (
                        <div className="flex items-center justify-end gap-1 text-[10px] text-white/70 pt-0.5">
                          {msg.syncStatus === 'queued_offline' && (
                            <span className="flex items-center gap-1 text-amber-300">
                              <Clock className="w-3 h-3" />
                              <span>Queued Offline</span>
                            </span>
                          )}
                          {msg.syncStatus === 'sending' && (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Sending…</span>
                            </span>
                          )}
                          {msg.syncStatus === 'sent' && (
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Sent</span>
                            </span>
                          )}
                          {msg.syncStatus === 'delivered' && (
                            <span className="flex items-center gap-1 text-cyan-200 font-semibold">
                              <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />
                              <span>Delivered</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick message hover actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1 px-1">
                      <button
                        onClick={() => handleTogglePin(msg.id)}
                        className="text-slate-400 hover:text-purple-400 text-[10px] flex items-center gap-1"
                        title={msg.isPinned ? 'Unpin from bulletin' : 'Pin to bulletin'}
                      >
                        {msg.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        <span>{msg.isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-slate-400 hover:text-rose-400 text-[10px] flex items-center gap-1"
                        title="Delete item"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Form */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
            {/* Attachment preview chip if selected */}
            {attachmentPreview && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={attachmentPreview.dataUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                  />
                  <div>
                    <p className="font-medium text-slate-200 truncate max-w-[200px]">
                      {attachmentPreview.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(attachmentPreview.size / 1024).toFixed(1)} KB (Will stream via payload transport)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAttachmentPreview(null)}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Note Mode Inputs if active */}
            {isNoteMode && (
              <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                    <span>Create Persistent Bulletin Note</span>
                  </span>
                  <button
                    onClick={() => setIsNoteMode(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note title (e.g. WiFi Password, Task)"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    placeholder="Comma-separated tags (e.g. Work, Secret)"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Main Input Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isNoteMode 
                    ? "Enter persistent note body or clipboard snippet…" 
                    : `Message ${device.name}…`
                }
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {/* Attach File Button */}
              <label
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl border border-slate-700 cursor-pointer transition-colors"
                title="Attach image"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileAttach}
                  className="hidden"
                />
              </label>

              {/* Demo Photo Quick Attach */}
              <button
                type="button"
                onClick={handleAttachDemoPhoto}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors hidden sm:block"
                title="Quick demo image screenshot"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
              </button>

              {/* Note Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setIsNoteMode(!isNoteMode)}
                className={`p-2 rounded-xl border transition-colors ${
                  isNoteMode
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-700'
                }`}
                title="Toggle Persistent Note / Bulletin Post"
              >
                <Bookmark className="w-4 h-4 text-purple-400" />
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputText.trim() && !attachmentPreview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Bulletin Board View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[460px] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <span>Persistent Shared Bulletin Board</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pinned items, configurations, and notes shared with {device.name}. Persisted in Room SQLite.
              </p>
            </div>

            <button
              onClick={() => {
                setActiveSubTab('messages');
                setIsNoteMode(true);
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          </div>

          {pinnedNotes.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Bookmark className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-medium text-slate-400">No pinned notes yet</p>
              <p className="text-[11px] text-slate-500">
                Click "Pin" on any message or create a persistent note to display it here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {pinnedNotes.map(note => (
                <div
                  key={note.id}
                  className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-4 space-y-2.5 relative shadow-sm hover:border-purple-500/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-purple-200 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{note.noteTitle || 'Shared Note'}</span>
                    </h4>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className="p-1 text-slate-400 hover:text-purple-300 rounded-md hover:bg-slate-800"
                        title="Unpin note"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(note.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <div className="flex flex-wrap gap-1">
                      {note.tags?.map(t => (
                        <span key={t} className="px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span>{new Date(note.timestamp).toLocaleDateString()}</span>
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
