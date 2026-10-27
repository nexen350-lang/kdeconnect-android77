package org.kde.kdeconnect.Plugins.ChatPlugin.database

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
    val messageType: String,
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
