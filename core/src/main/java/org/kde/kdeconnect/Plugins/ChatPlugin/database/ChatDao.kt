package org.kde.kdeconnect.Plugins.ChatPlugin.database

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
