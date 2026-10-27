/*
 * SPDX-FileCopyrightText: 2026 KDE Connect Android Integration Team
 * SPDX-License-Identifier: GPL-2.0-only OR GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL
 */

package org.kde.kdeconnect.plugins.chat

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import org.kde.kdeconnect.Device
import org.kde.kdeconnect.NetworkPacket
import org.kde.kdeconnect.plugins.Plugin
import org.kde.kdeconnect.plugins.PluginFactory.LoadablePlugin
import org.kde.kdeconnect.plugins.PluginUiMenuEntry
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.UUID

@LoadablePlugin
class ChatPlugin : Plugin() {

    override val displayName: String
        get() = "Bulletin Chat & Notes"

    override val description: String
        get() = "Persistent device chat and shared bulletin board notes"

    override val supportedPacketTypes: Array<String> = arrayOf(
        PACKET_TYPE_CHAT_MESSAGE,
        PACKET_TYPE_CHAT_ACK,
        PACKET_TYPE_SYNC_REQUEST,
        PACKET_TYPE_SYNC_RESPONSE
    )

    override val outgoingPacketTypes: Array<String> = arrayOf(
        PACKET_TYPE_CHAT_MESSAGE,
        PACKET_TYPE_CHAT_ACK,
        PACKET_TYPE_SYNC_REQUEST,
        PACKET_TYPE_SYNC_RESPONSE
    )

    override fun onPacketReceived(np: NetworkPacket): Boolean {
        when (np.type) {
            PACKET_TYPE_CHAT_MESSAGE -> handleIncomingMessage(np)
            PACKET_TYPE_CHAT_ACK -> handleIncomingAck(np)
            else -> return false
        }
        return true
    }

    private fun handleIncomingMessage(np: NetworkPacket) {
        val id = np.getString("id", UUID.randomUUID().toString())
        val text = np.getString("text", "")
        Log.i(LOG_TAG, "Incoming chat from ${device.name}: $text")

        // Send delivery receipt ACK
        val ack = NetworkPacket(PACKET_TYPE_CHAT_ACK).apply {
            set("messageId", id)
            set("status", "delivered")
            set("timestamp", System.currentTimeMillis())
        }
        device.sendPacket(ack)
    }

    private fun handleIncomingAck(np: NetworkPacket) {
        val msgId = np.getString("messageId", "")
        Log.d(LOG_TAG, "Message $msgId delivered to ${device.name}")
    }

    override fun getUiMenuEntries(): List<PluginUiMenuEntry> = listOf(
        PluginUiMenuEntry("المحادثة ولوحة الملاحظات (Bulletin)") { activity ->
            Log.i(LOG_TAG, "Opened Chat on device: ${device.name}")
        }
    )

    companion object {
        const val PACKET_TYPE_CHAT_MESSAGE = "kdeconnect.chat.message"
        const val PACKET_TYPE_CHAT_ACK = "kdeconnect.chat.ack"
        const val PACKET_TYPE_SYNC_REQUEST = "kdeconnect.chat.sync_request"
        const val PACKET_TYPE_SYNC_RESPONSE = "kdeconnect.chat.sync_response"
        private const val LOG_TAG = "ChatPlugin"
    }
}
