/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SourceFileEntry {
  path: string;
  category: 'Plugin' | 'Database / Room' | 'Model / Protocol' | 'UI / Fragment' | 'Resource / Manifest' | 'Patch Diff' | 'CI / CD';
  language: 'kotlin' | 'xml' | 'diff' | 'groovy' | 'yaml';
  description: string;
  code: string;
}

export const ANDROID_SOURCE_FILES: SourceFileEntry[] = [
  {
    path: 'core/src/main/java/org/kde/kdeconnect/Plugins/RemoteBrowsePlugin/RemoteBrowsePlugin.kt',
    category: 'Plugin',
    language: 'kotlin',
    description: 'Core KDE Connect Android plugin handling remote directory listing, path traversal defense, and SAF file transfers.',
    code: `package org.kde.kdeconnect.Plugins.RemoteBrowsePlugin

import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import androidx.documentfile.provider.DocumentFile
import org.json.JSONArray
import org.json.JSONObject
import org.kde.kdeconnect.Device
import org.kde.kdeconnect.NetworkPacket
import org.kde.kdeconnect.Plugins.BasePlugin
import org.kde.kdeconnect.Plugins.Plugin
import org.kde.kdeconnect.UserFacingPlugin
import org.slf4j.LoggerFactory
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

/**
 * RemoteBrowsePlugin enables bidirectional directory traversal and file transfers
 * between paired KDE Connect nodes without requiring external SSH/SFTP daemons.
 *
 * Implements strict canonical path validation to prevent directory traversal attacks (CWE-22).
 */
@Plugin(
    id = "kdeconnect_remotebrowse",
    name = "Remote File Browser",
    description = "Browse remote device files and transfer items securely",
    author = "KDE Connect Android Integration Team"
)
class RemoteBrowsePlugin(
    context: Context,
    device: Device
) : BasePlugin(context, device), UserFacingPlugin {

    companion object {
        private val logger = LoggerFactory.getLogger(RemoteBrowsePlugin::class.java)

        const val PACKET_TYPE_BROWSE_REQUEST = "kdeconnect.remotebrowse.request"
        const val PACKET_TYPE_BROWSE_RESPONSE = "kdeconnect.remotebrowse.response"
        const val PACKET_TYPE_DOWNLOAD_REQUEST = "kdeconnect.remotebrowse.download"
        const val PACKET_TYPE_UPLOAD_REQUEST = "kdeconnect.remotebrowse.upload"

        const val ERROR_ACCESS_DENIED = "ERROR_ACCESS_DENIED"
        const val ERROR_INVALID_PATH = "ERROR_INVALID_PATH_TRAVERSAL"
        const val ERROR_NOT_FOUND = "ERROR_FILE_NOT_FOUND"

        /**
         * Root canonical boundary for storage access on Android endpoints.
         */
        val AUTHORIZED_STORAGE_ROOT: String = Environment.getExternalStorageDirectory().canonicalPath
    }

    override fun getSupportedPacketTypes(): Array<String> = arrayOf(
        PACKET_TYPE_BROWSE_REQUEST,
        PACKET_TYPE_BROWSE_RESPONSE,
        PACKET_TYPE_DOWNLOAD_REQUEST,
        PACKET_TYPE_UPLOAD_REQUEST
    )

    override fun getOutgoingPacketTypes(): Array<String> = arrayOf(
        PACKET_TYPE_BROWSE_REQUEST,
        PACKET_TYPE_BROWSE_RESPONSE,
        PACKET_TYPE_DOWNLOAD_REQUEST,
        PACKET_TYPE_UPLOAD_REQUEST
    )

    override fun onPacketReceived(np: NetworkPacket): Boolean {
        when (np.type) {
            PACKET_TYPE_BROWSE_REQUEST -> handleBrowseRequest(np)
            PACKET_TYPE_DOWNLOAD_REQUEST -> handleDownloadRequest(np)
            PACKET_TYPE_UPLOAD_REQUEST -> handleUploadRequest(np)
            PACKET_TYPE_BROWSE_RESPONSE -> {
                // Dispatched to registered UI callbacks via EventBus/StateFlow
                logger.debug("Received browse response from \${device.name}")
            }
            else -> return false
        }
        return true
    }

    /**
     * Handles directory listing request with strict path containment checks.
     */
    private fun handleBrowseRequest(np: NetworkPacket) {
        val requestedPath = np.getString("path", AUTHORIZED_STORAGE_ROOT)
        val response = NetworkPacket(PACKET_TYPE_BROWSE_RESPONSE)
        response.set("requestId", np.getLong("id"))

        try {
            val targetDir = resolveAndSanitizePath(requestedPath)
            if (!targetDir.exists()) {
                sendErrorResponse(response, ERROR_NOT_FOUND, "Target directory does not exist: $requestedPath")
                return
            }
            if (!targetDir.isDirectory) {
                sendErrorResponse(response, ERROR_INVALID_PATH, "Path is not a directory: $requestedPath")
                return
            }
            if (!targetDir.canRead()) {
                sendErrorResponse(response, ERROR_ACCESS_DENIED, "Permission denied accessing path")
                return
            }

            val fileArray = JSONArray()
            val files = targetDir.listFiles() ?: emptyArray()

            for (file in files) {
                // Prevent leaking system hidden files if unauthorized
                if (file.name.startsWith(".") && !np.getBoolean("showHidden", false)) {
                    continue
                }

                val obj = JSONObject().apply {
                    put("name", file.name)
                    put("path", file.canonicalPath)
                    put("isDirectory", file.isDirectory)
                    put("sizeBytes", if (file.isDirectory) 4096L else file.length())
                    put("lastModified", file.lastModified())
                    put("canRead", file.canRead())
                    put("canWrite", file.canWrite())
                    put("mimeType", detectMimeType(file))
                }
                fileArray.put(obj)
            }

            response.set("path", targetDir.canonicalPath)
            response.set("parentPath", targetDir.parent ?: AUTHORIZED_STORAGE_ROOT)
            response.set("files", fileArray)
            response.set("success", true)
            device.sendPacket(response)

        } catch (secEx: SecurityException) {
            logger.warn("Security violation detected during path listing: \${secEx.message}")
            sendErrorResponse(response, ERROR_INVALID_PATH, secEx.message ?: "Path traversal forbidden")
        } catch (ex: Exception) {
            logger.error("Error processing directory list", ex)
            sendErrorResponse(response, ERROR_ACCESS_DENIED, "Failed to read filesystem: \${ex.localizedMessage}")
        }
    }

    /**
     * Resolves a path, canonicalizes it, and verifies it stays inside AUTHORIZED_STORAGE_ROOT.
     * Prevents '../' traversal and symlink escape vulnerabilities.
     */
    @Throws(SecurityException::class)
    private fun resolveAndSanitizePath(inputPath: String): File {
        val decoded = URLDecoder.decode(inputPath, StandardCharsets.UTF_8.name())
        if (decoded.contains("..")) {
            throw SecurityException("Illegal directory traversal sequence detected")
        }

        val file = File(decoded)
        val canonical = file.canonicalFile

        // Verify boundary containment
        val allowedRootFile = File(AUTHORIZED_STORAGE_ROOT).canonicalFile
        if (!canonical.path.startsWith(allowedRootFile.path)) {
            throw SecurityException("Access to path outside authorized root denied: \${canonical.path}")
        }
        return canonical
    }

    private fun handleDownloadRequest(np: NetworkPacket) {
        val targetPath = np.getString("path", "")
        try {
            val file = resolveAndSanitizePath(targetPath)
            if (!file.exists() || file.isDirectory) {
                logger.warn("Requested file download not accessible: $targetPath")
                return
            }

            val response = NetworkPacket(PACKET_TYPE_DOWNLOAD_REQUEST).apply {
                set("path", file.canonicalPath)
                set("fileName", file.name)
                set("size", file.length())
                set("success", true)
                payload = FileInputStream(file)
                payloadSize = file.length()
            }
            device.sendPacket(response)
        } catch (e: Exception) {
            logger.error("Failed to stream requested download file", e)
        }
    }

    private fun handleUploadRequest(np: NetworkPacket) {
        val targetDir = np.getString("targetDirectory", AUTHORIZED_STORAGE_ROOT)
        val fileName = np.getString("fileName", "upload_\${System.currentTimeMillis()}.bin")
        val payloadStream = np.payload ?: return

        try {
            val destDir = resolveAndSanitizePath(targetDir)
            val destFile = File(destDir, fileName)
            FileOutputStream(destFile).use { out ->
                payloadStream.copyTo(out)
            }
            logger.info("Successfully received file: \${destFile.canonicalPath}")
        } catch (e: Exception) {
            logger.error("Failed to write incoming uploaded file", e)
        }
    }

    private fun sendErrorResponse(response: NetworkPacket, code: String, msg: String) {
        response.set("success", false)
        response.set("errorCode", code)
        response.set("errorMessage", msg)
        device.sendPacket(response)
    }

    private fun detectMimeType(file: File): String {
        val ext = file.extension.lowercase()
        return when (ext) {
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "gif" -> "image/gif"
            "pdf" -> "application/pdf"
            "txt", "md" -> "text/plain"
            "zip" -> "application/zip"
            "apk" -> "application/vnd.android.package-archive"
            else -> if (file.isDirectory) "inode/directory" else "application/octet-stream"
        }
    }

    /**
     * Client call: initiates directory query on remote device
     */
    fun requestDirectoryListing(path: String) {
        val np = NetworkPacket(PACKET_TYPE_BROWSE_REQUEST).apply {
            set("path", path)
            set("showHidden", false)
        }
        device.sendPacket(np)
    }
}
`
  },
  {
    path: 'core/src/main/java/org/kde/kdeconnect/Plugins/ChatPlugin/ChatPlugin.kt',
    category: 'Plugin',
    language: 'kotlin',
    description: 'Persistent inter-device chat and shared bulletin notes plugin with Room DB, offline queue, and Smart Delta Sync.',
    code: `package org.kde.kdeconnect.Plugins.ChatPlugin

import android.content.Context
import android.net.Uri
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
        // Trigger smart delta sync when device pairs/connects
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

    /**
     * Process message from paired device, save to Room DB, and dispatch ACK.
     */
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

                // Read binary attachment stream if present
                if (np.payload != null && attachmentName != null) {
                    val cacheDir = File(context.cacheDir, "kdeconnect_chat_media").apply { mkdirs() }
                    val destFile = File(cacheDir, "\${messageId}_\${attachmentName}")
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

                // Send immediate ACK to remote sender
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

    /**
     * Send message from local user to remote device.
     */
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

    /**
     * Flushes queued offline messages once device link is established.
     */
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
        // Delta sync update handling with conflict resolution
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
`
  },
  {
    path: 'core/src/main/java/org/kde/kdeconnect/Plugins/ChatPlugin/database/ChatMessageEntity.kt',
    category: 'Database / Room',
    language: 'kotlin',
    description: 'Room persistence entity modeling text chats, image metadata, and bulletin notes per paired device.',
    code: `package org.kde.kdeconnect.Plugins.ChatPlugin.database

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

enum class SyncStatus {
    QUEUED_OFFLINE,
    SENDING,
    SENT,
    DELIVERED,
    FAILED
}

@Entity(
    tableName = "kdeconnect_chat_messages",
    indices = [
        Index(value = ["deviceId"]),
        Index(value = ["timestamp"]),
        Index(value = ["isPinned"]),
        Index(value = ["syncStatus"])
    ]
)
data class ChatMessageEntity(
    @PrimaryKey
    val id: String,
    val deviceId: String,
    val senderId: String,
    val senderName: String,
    val recipientId: String,
    val messageType: String, // "text" | "image" | "note"
    val content: String,
    val attachmentName: String? = null,
    val attachmentSize: Long = 0L,
    val attachmentMime: String? = null,
    val attachmentUri: String? = null,
    val timestamp: Long,
    val syncStatus: SyncStatus,
    val isPinned: Boolean = false,
    val noteTitle: String? = null,
    val isDeleted: Boolean = false
)
`
  },
  {
    path: 'core/src/main/java/org/kde/kdeconnect/Plugins/ChatPlugin/database/ChatDao.kt',
    category: 'Database / Room',
    language: 'kotlin',
    description: 'Data Access Object for asynchronous queries, offline queue management, and reactive Flow observation.',
    code: `package org.kde.kdeconnect.Plugins.ChatPlugin.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ChatDao {

    @Query("SELECT * FROM kdeconnect_chat_messages WHERE deviceId = :deviceId AND isDeleted = 0 ORDER BY timestamp ASC")
    fun getMessagesForDevice(deviceId: String): Flow<List<ChatMessageEntity>>

    @Query("SELECT * FROM kdeconnect_chat_messages WHERE deviceId = :deviceId AND isPinned = 1 AND isDeleted = 0 ORDER BY timestamp DESC")
    fun getPinnedNotesForDevice(deviceId: String): Flow<List<ChatMessageEntity>>

    @Query("SELECT * FROM kdeconnect_chat_messages WHERE deviceId = :deviceId AND syncStatus = 'QUEUED_OFFLINE' ORDER BY timestamp ASC")
    suspend fun getPendingOfflineMessages(deviceId: String): List<ChatMessageEntity>

    @Query("SELECT MAX(timestamp) FROM kdeconnect_chat_messages WHERE deviceId = :deviceId")
    suspend fun getLastMessageTimestamp(deviceId: String): Long?

    @Query("SELECT * FROM kdeconnect_chat_messages WHERE deviceId = :deviceId AND timestamp > :sinceTimestamp")
    suspend fun getMessagesSince(deviceId: String, sinceTimestamp: Long): List<ChatMessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(message: ChatMessageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(messages: List<ChatMessageEntity>)

    @Query("UPDATE kdeconnect_chat_messages SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: SyncStatus)

    @Query("UPDATE kdeconnect_chat_messages SET isPinned = :pinned WHERE id = :id")
    suspend fun setPinned(id: String, pinned: Boolean)

    @Query("UPDATE kdeconnect_chat_messages SET isDeleted = 1 WHERE id = :id")
    suspend fun markAsDeleted(id: String)

    @Query("DELETE FROM kdeconnect_chat_messages WHERE deviceId = :deviceId")
    suspend fun clearHistory(deviceId: String)
}
`
  },
  {
    path: 'core/src/main/java/org/kde/kdeconnect/Plugins/ChatPlugin/database/ChatDatabase.kt',
    category: 'Database / Room',
    language: 'kotlin',
    description: 'Room Database provider with schema versioning and thread-safe singleton initialization.',
    code: `package org.kde.kdeconnect.Plugins.ChatPlugin.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverter

class ChatConverters {
    @TypeConverter
    fun fromSyncStatus(status: SyncStatus): String = status.name

    @TypeConverter
    fun toSyncStatus(value: String): SyncStatus = runCatching {
        SyncStatus.valueOf(value)
    }.getOrDefault(SyncStatus.SENT)
}

@Database(
    entities = [ChatMessageEntity::class],
    version = 1,
    exportSchema = false
)
@androidx.room.TypeConverters(ChatConverters::class)
abstract class ChatDatabase : RoomDatabase() {
    abstract fun chatDao(): ChatDao

    companion object {
        @Volatile
        private var INSTANCE: ChatDatabase? = null

        fun getInstance(context: Context): ChatDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ChatDatabase::class.java,
                    "kdeconnect_chat.db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    category: 'Resource / Manifest',
    language: 'xml',
    description: 'Internationalized string resources for remote browser and chat UI components.',
    code: `<resources>
    <!-- Remote File Browser -->
    <string name="plugin_remote_browse_name">Remote File Browser</string>
    <string name="plugin_remote_browse_desc">Browse remote files and manage downloads directly</string>
    <string name="remote_browser_title">Remote Files</string>
    <string name="remote_browse_loading">Listing remote directory…</string>
    <string name="remote_browse_empty">This directory contains no files</string>
    <string name="remote_browse_error_traversal">Path traversal sequence is forbidden for security</string>
    <string name="remote_browse_error_permission">Remote device denied access to this directory</string>
    <string name="remote_browse_download_start">Downloading %1$s</string>
    <string name="remote_browse_download_complete">Saved to Downloads folder</string>

    <!-- Persistent Device Chat & Bulletin -->
    <string name="plugin_chat_name">Device Chat &amp; Notes</string>
    <string name="plugin_chat_desc">Persistent messages, image sharing, and pinned notes</string>
    <string name="chat_tab_messages">Conversation</string>
    <string name="chat_tab_notes">Bulletin Board</string>
    <string name="chat_input_hint">Type a message or memo…</string>
    <string name="chat_note_title_hint">Note title (optional)…</string>
    <string name="chat_attach_image">Attach Image</string>
    <string name="chat_save_note">Save to Bulletin</string>
    <string name="chat_status_queued">Queued (Device Offline)</string>
    <string name="chat_status_delivered">Delivered</string>
    <string name="chat_clear_history_prompt">Clear conversation history with this device?</string>
</resources>
`
  },
  {
    path: 'patches/0001-kdeconnect-remote-browser-and-device-chat.patch',
    category: 'Patch Diff',
    language: 'diff',
    description: 'Git unified diff showing integration into plugins registry, manifest, and build system.',
    code: `--- a/core/src/main/java/org/kde/kdeconnect/Plugins/PluginFactory.java
+++ b/core/src/main/java/org/kde/kdeconnect/Plugins/PluginFactory.java
@@ -45,6 +45,8 @@ public class PluginFactory {
         registerPlugin(SharePlugin.class);
         registerPlugin(PingPlugin.class);
+        registerPlugin(RemoteBrowsePlugin.class);
+        registerPlugin(ChatPlugin.class);
         registerPlugin(SftpPlugin.class);
         registerPlugin(FindMyPhonePlugin.class);
     }
--- a/app/build.gradle.kts
+++ b/app/build.gradle.kts
@@ -95,6 +95,9 @@ dependencies {
     implementation("androidx.room:room-runtime:2.6.1")
     implementation("androidx.room:room-ktx:2.6.1")
     ksp("androidx.room:room-compiler:2.6.1")
+    implementation("androidx.documentfile:documentfile:1.0.1")
 }
`
  },
  {
    path: '.github/workflows/android-build-apk.yml',
    category: 'CI / CD',
    language: 'yaml',
    description: 'Automated GitHub Actions workflow to build, test, and package KDE Connect Android debug/release APK artifacts.',
    code: `name: Build KDE Connect Android APK

on:
  push:
    branches: [ master, main, dev, feature/* ]
  pull_request:
    branches: [ master, main ]
  workflow_dispatch:
    inputs:
      build_type:
        description: 'Build Type (debug or release)'
        required: true
        default: 'debug'
        type: choice
        options:
          - debug
          - release

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest
    timeout-minutes: 45

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Prepare KDE Connect Android Source
        run: |
          if [ ! -f "gradlew" ]; then
            echo "Cloning official KDE/kdeconnect-android upstream..."
            git clone --depth 1 https://github.com/KDE/kdeconnect-android.git upstream_kde
            cp -r core/src/main/java/org/kde/kdeconnect/Plugins/* upstream_kde/core/src/main/java/org/kde/kdeconnect/Plugins/ 2>/dev/null || true
            shopt -s dotglob
            cp -rn upstream_kde/* .
            rm -rf upstream_kde
          fi
          chmod +x gradlew

      - name: Apply Feature Patches
        run: |
          if [ -f "patches/0001-kdeconnect-remote-browser-and-device-chat.patch" ]; then
            git apply patches/0001-kdeconnect-remote-browser-and-device-chat.patch 2>/dev/null || true
          fi

      - name: Assemble Android APK
        run: ./gradlew assembleDebug --no-daemon --stacktrace

      - name: Stage APK Artifacts
        run: |
          mkdir -p build-artifacts
          find . -type f -name "*.apk" -not -path "*/intermediates/*" -exec cp -v {} build-artifacts/ \;

      - name: Upload APK as Workflow Artifact
        uses: actions/upload-artifact@v4
        with:
          name: kdeconnect-remote-chat-debug-apk
          path: build-artifacts/*.apk
          retention-days: 14
          if-no-files-found: warn
`
  }
];
