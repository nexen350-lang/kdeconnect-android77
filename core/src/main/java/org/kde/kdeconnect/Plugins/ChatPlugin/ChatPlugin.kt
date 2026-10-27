package org.kde.kdeconnect.Plugins.ChatPlugin

import android.content.Context
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import org.kde.kdeconnect.Device
import org.kde.kdeconnect.NetworkPacket
import org.kde.kdeconnect.Plugins.BasePlugin
import org.kde.kdeconnect.Plugins.ChatPlugin.database.ChatDatabase
import org.kde.kdeconnect.Plugins.ChatPlugin.database.ChatMessageEntity
import org.kde.kdeconnect.Plugins.ChatPlugin.database.SyncStatus
import org.kde.kdeconnect.Plugins.Plugin
import org.kde.kdeconnect.UserFacingPlugin
import org.slf4j.LoggerFactory
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.UUID

@Plugin(
    id = "kdeconnect_chat",
    name = "Device Chat & Bulletin Board",
    description = "Persistent conversations, image sharing, and pinned notes with paired devices",
    author = "KDE Connect Android Integration Team"
)
class ChatPlugin(
    context: Context,
    device: Device
) : BasePlugin(context, device), UserFacingPlugin {

    companion object {
        private val logger = LoggerFactory.getLogger(ChatPlugin::class.java)

        const val PACKET_TYPE_CHAT_MESSAGE = "kdeconnect.chat.message"
        const val PACKET_TYPE_CHAT_ACK = "kdeconnect.chat.ack"
        const val PACKET_TYPE_SYNC_REQUEST = "kdeconnect.chat.sync_request"
        const val PACKET_TYPE_SYNC_RESPONSE = "kdeconnect.chat.sync_response"
        const val PACKET_TYPE_ITEM_ACTION = "kdeconnect.chat.action"
    }

    private val pluginScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val db = ChatDatabase.getInstance(context)
    private val chatDao = db.chatDao()

    override fun getSupportedPacketTypes(): Array<String> = arrayOf(
        PACKET_TYPE_CHAT_MESSAGE,
        PACKET_TYPE_CHAT_ACK,
        PACKET_TYPE_SYNC_REQUEST,
        PACKET_TYPE_SYNC_RESPONSE,
        PACKET_TYPE_ITEM_ACTION
    )

    override fun getOutgoingPacketTypes(): Array<String> = arrayOf(
        PACKET_TYPE_CHAT_MESSAGE,
        PACKET_TYPE_CHAT_ACK,
        PACKET_TYPE_SYNC_REQUEST,
        PACKET_TYPE_SYNC_RESPONSE,
        PACKET_TYPE_ITEM_ACTION
    )

    override fun onCreate(): Boolean {
        pluginScope.launch {
            flushOfflineQueue()
            requestDeltaSync()
        }
        return true
    }

    override fun onDestroy() {
        pluginScope.cancel()
        super.onDestroy()
    }

    override fun onPacketReceived(np: NetworkPacket): Boolean {
        when (np.type) {
            PACKET_TYPE_CHAT_MESSAGE -> handleIncomingMessage(np)
            PACKET_TYPE_CHAT_ACK -> handleIncomingAck(np)
            PACKET_TYPE_SYNC_REQUEST -> handleSyncRequest(np)
            PACKET_TYPE_SYNC_RESPONSE -> handleSyncResponse(np)
            PACKET_TYPE_ITEM_ACTION -> handleItemAction(np)
            else -> return false
        }
        return true
    }

    private fun handleIncomingMessage(np: NetworkPacket) {
        pluginScope.launch {
            try {
                val messageId = np.getString("id", UUID.randomUUID().toString())
                val messageType = np.getString("messageType", "text")
                val content = np.getString("content", "")
                val timestamp = np.getLong("timestamp", System.currentTimeMillis())
                val isPinned = np.getBoolean("isPinned", false)
                val noteTitle = np.getString("noteTitle", null)

                var localAttachmentUri: String? = null
                val attachmentName = np.getString("attachmentName", null)
                val attachmentMime = np.getString("attachmentMime", null)
                val attachmentSize = np.getLong("attachmentSize", 0L)

                if (np.payload != null && attachmentName != null) {
                    val cacheDir = File(context.cacheDir, "kdeconnect_chat_media").apply { mkdirs() }
                    val destFile = File(cacheDir, "${messageId}_${attachmentName}")
                    FileOutputStream(destFile).use { out ->
                        np.payload.copyTo(out)
                    }
                    localAttachmentUri = destFile.absolutePath
                }

                val entity = ChatMessageEntity(
                    id = messageId,
                    deviceId = device.id,
                    senderId = device.id,
                    senderName = device.name,
                    recipientId = "local",
                    messageType = messageType,
                    content = content,
                    attachmentName = attachmentName,
                    attachmentSize = attachmentSize,
                    attachmentMime = attachmentMime,
                    attachmentUri = localAttachmentUri,
                    timestamp = timestamp,
                    syncStatus = SyncStatus.DELIVERED,
                    isPinned = isPinned,
                    noteTitle = noteTitle,
                    isDeleted = false
                )

                chatDao.insertOrUpdate(entity)

                val ack = NetworkPacket(PACKET_TYPE_CHAT_ACK).apply {
                    set("messageId", messageId)
                    set("status", "delivered")
                    set("timestamp", System.currentTimeMillis())
                }
                device.sendPacket(ack)

            } catch (e: Exception) {
                logger.error("Failed to process incoming chat message", e)
            }
        }
    }

    private fun handleIncomingAck(np: NetworkPacket) {
        val messageId = np.getString("messageId", "")
        if (messageId.isNotEmpty()) {
            pluginScope.launch {
                chatDao.updateSyncStatus(messageId, SyncStatus.DELIVERED)
            }
        }
    }

    fun sendMessage(
        content: String,
        messageType: String = "text",
        attachmentFile: File? = null,
        isPinned: Boolean = false,
        noteTitle: String? = null
    ) {
        pluginScope.launch {
            val messageId = UUID.randomUUID().toString()
            val timestamp = System.currentTimeMillis()

            val entity = ChatMessageEntity(
                id = messageId,
                deviceId = device.id,
                senderId = "local",
                senderName = "This Android Device",
                recipientId = device.id,
                messageType = messageType,
                content = content,
                attachmentName = attachmentFile?.name,
                attachmentSize = attachmentFile?.length() ?: 0L,
                attachmentMime = null,
                attachmentUri = attachmentFile?.absolutePath,
                timestamp = timestamp,
                syncStatus = if (device.isReachable) SyncStatus.SENDING else SyncStatus.QUEUED_OFFLINE,
                isPinned = isPinned,
                noteTitle = noteTitle,
                isDeleted = false
            )

            chatDao.insertOrUpdate(entity)

            if (device.isReachable) {
                transmitPacket(entity, attachmentFile)
            }
        }
    }

    private fun transmitPacket(entity: ChatMessageEntity, attachmentFile: File?) {
        val np = NetworkPacket(PACKET_TYPE_CHAT_MESSAGE).apply {
            set("id", entity.id)
            set("messageType", entity.messageType)
            set("content", entity.content)
            set("timestamp", entity.timestamp)
            set("isPinned", entity.isPinned)
            entity.noteTitle?.let { set("noteTitle", it) }

            if (attachmentFile != null && attachmentFile.exists()) {
                set("attachmentName", attachmentFile.name)
                set("attachmentSize", attachmentFile.length())
                payload = FileInputStream(attachmentFile)
                payloadSize = attachmentFile.length()
            }
        }
        device.sendPacket(np)
    }

    fun flushOfflineQueue() {
        pluginScope.launch {
            val pending = chatDao.getPendingOfflineMessages(device.id)
            for (msg in pending) {
                val file = msg.attachmentUri?.let { File(it) }
                transmitPacket(msg, file)
                chatDao.updateSyncStatus(msg.id, SyncStatus.SENT)
            }
        }
    }

    private fun requestDeltaSync() {
        pluginScope.launch {
            val lastSyncTime = chatDao.getLastMessageTimestamp(device.id) ?: 0L
            val req = NetworkPacket(PACKET_TYPE_SYNC_REQUEST).apply {
                set("sinceTimestamp", lastSyncTime)
            }
            device.sendPacket(req)
        }
    }

    private fun handleSyncRequest(np: NetworkPacket) {
        val since = np.getLong("sinceTimestamp", 0L)
        pluginScope.launch {
            val newItems = chatDao.getMessagesSince(device.id, since)
            val array = JSONArray()
            for (item in newItems) {
                array.put(JSONObject().apply {
                    put("id", item.id)
                    put("content", item.content)
                    put("messageType", item.messageType)
                    put("timestamp", item.timestamp)
                    put("isPinned", item.isPinned)
                    put("isDeleted", item.isDeleted)
                })
            }
            val res = NetworkPacket(PACKET_TYPE_SYNC_RESPONSE).apply {
                set("items", array)
            }
            device.sendPacket(res)
        }
    }

    private fun handleSyncResponse(np: NetworkPacket) {
        // Delta sync update handling
    }

    private fun handleItemAction(np: NetworkPacket) {
        val action = np.getString("action", "")
        val messageId = np.getString("messageId", "")
        pluginScope.launch {
            when (action) {
                "delete" -> chatDao.markAsDeleted(messageId)
                "pin" -> chatDao.setPinned(messageId, true)
                "unpin" -> chatDao.setPinned(messageId, false)
            }
        }
    }
}
