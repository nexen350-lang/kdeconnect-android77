/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Binary, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { KDEConnectPacket } from '../../types/kdeconnect';
import { packetBus } from '../../services/packetBus';

export const PacketInspectorModal: React.FC = () => {
  const [packets, setPackets] = useState<KDEConnectPacket[]>(packetBus.getPackets());
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = packetBus.subscribe((newPacket) => {
      setPackets(packetBus.getPackets());
    });
    return unsubscribe;
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPacketJson = (packet: KDEConnectPacket) => {
    navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
    setCopiedId(packet.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(packets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kdeconnect_packet_trace_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = packets.filter(p => {
    const matchesFilter = filterType === 'all' || p.type.includes(filterType);
    const matchesSearch = 
      p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(p.body).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-slate-100">KDE Connect NetworkPacket Trace</h3>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
              Live TLS Wire
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time JSON serialization stream for remotebrowse, chat, ack, and sync packets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Trace (.json)</span>
          </button>

          <button
            onClick={() => {
              packetBus.clear();
              setPackets([]);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
            title="Clear trace"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['all', 'remotebrowse', 'chat', 'mpris', 'sftp', 'pair'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                filterType === t
                  ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {t === 'all' ? 'All Types' : `kdeconnect.${t}`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payload fields…"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Packet Stream List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No network packets matched the current filter.
          </div>
        ) : (
          filtered.map(packet => {
            const isOutgoing = packet.direction === 'outgoing';
            const isExpanded = !!expandedIds[packet.id];

            return (
              <div
                key={packet.id}
                className="bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
              >
                {/* Summary Row */}
                <div
                  onClick={() => toggleExpand(packet.id)}
                  className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`p-1.5 rounded-lg border shrink-0 ${
                      isOutgoing
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isOutgoing ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {packet.type}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {isOutgoing ? 'TX' : 'RX'}
                        </span>
                        {packet.payloadSize && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                            Payload: {(packet.payloadSize / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        id: {packet.id} • {new Date(packet.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyPacketJson(packet);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md"
                      title="Copy JSON"
                    >
                      {copiedId === packet.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Payload Viewer */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-900/60 p-3">
                    <pre className="font-mono text-[11px] text-cyan-300 leading-relaxed overflow-x-auto p-2.5 rounded-lg bg-black/60 border border-slate-800">
                      {JSON.stringify(
                        {
                          id: packet.id,
                          type: packet.type,
                          body: packet.body,
                          ...(packet.payloadSize ? { payloadSize: packet.payloadSize } : {})
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
