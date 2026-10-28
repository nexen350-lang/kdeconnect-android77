/*
 * SPDX-FileCopyrightText: 2026 KDE Connect Android Integration Team
 * SPDX-License-Identifier: GPL-2.0-only OR GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL
 */

package org.kde.kdeconnect.plugins.chat

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import org.kde.kdeconnect.NetworkPacket
import org.kde.kdeconnect.plugins.Plugin
import org.kde.kdeconnect.plugins.PluginFactory.LoadablePlugin
import org.kde.kdeconnect_tp.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

@LoadablePlugin
class ChatPlugin : Plugin() {

    override val displayName: String
        get() = getResourceString("pref_plugin_chat", "Bulletin Chat & Notes")

    override val description: String
        get() = getResourceString("pref_plugin_chat_desc", "Persistent device chat and shared bulletin board notes")

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

    // In-memory message store for active session
    data class ChatMessage(
        val id: String,
        val sender: String,
        val text: String,
        val timestamp: Long,
        val isSelf: Boolean,
        val isBulletin: Boolean = false
    )

    private val messages = mutableListOf<ChatMessage>()
    private val mainHandler = Handler(Looper.getMainLooper())
    private var activeMessagesContainer: LinearLayout? = null
    private var activeScrollView: ScrollView? = null
    private var activeDialog: AlertDialog? = null

    // Register button on device main screen (alongside Send Files, Mpris, etc.)
    override fun getUiButtons(): List<PluginUiButton> {
        val label = getResourceString("pref_plugin_chat", "Bulletin Chat & Notes")
        return listOf(
            PluginUiButton(
                label,
                R.drawable.ic_baseline_sms_24
            ) { parentActivity ->
                showChatInterface(parentActivity)
            }
        )
    }

    // Register menu entry in 3-dots overflow menu as backup
    override fun getUiMenuEntries(): List<PluginUiMenuEntry> {
        val label = getResourceString("pref_plugin_chat", "Bulletin Chat & Notes")
        return listOf(
            PluginUiMenuEntry(label) { parentActivity ->
                showChatInterface(parentActivity)
            }
        )
    }

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
        val timestamp = np.getLong("timestamp", System.currentTimeMillis())
        val isBulletin = np.getBoolean("isBulletin", false)
        val senderName = if (isDeviceInitialized) device.name else "Peer Device"

        val chatMsg = ChatMessage(id, senderName, text, timestamp, isSelf = false, isBulletin = isBulletin)
        synchronized(messages) {
            messages.add(chatMsg)
        }

        // Send delivery receipt ACK
        val ack = NetworkPacket(PACKET_TYPE_CHAT_ACK).apply {
            set("messageId", id)
            set("status", "delivered")
            set("timestamp", System.currentTimeMillis())
        }
        if (isDeviceInitialized) {
            device.sendPacket(ack)
        }

        // Update UI if open or show Toast notification
        mainHandler.post {
            activeMessagesContainer?.let { container ->
                appendMessageBubble(container, chatMsg)
                activeScrollView?.post { activeScrollView?.fullScroll(View.FOCUS_DOWN) }
            } ?: run {
                Toast.makeText(context, "💬 $senderName: $text", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun handleIncomingAck(np: NetworkPacket) {
        val msgId = np.getString("messageId", "")
        Log.d(LOG_TAG, "Message $msgId acknowledged by peer")
    }

    /**
     * Renders the interactive Chat & Bulletin Notes dialog inside parentActivity
     */
    private fun showChatInterface(parentActivity: Activity) {
        parentActivity.runOnUiThread {
            val peerName = if (isDeviceInitialized) device.name else "Peer"
            val density = parentActivity.resources.displayMetrics.density
            val dpToPx = { dp: Int -> (dp * density).toInt() }

            // Root layout
            val rootLayout = LinearLayout(parentActivity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dpToPx(16), dpToPx(12), dpToPx(16), dpToPx(12))
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
            }

            // Subtitle / device info banner
            val headerText = TextView(parentActivity).apply {
                text = "جهاز متصل: $peerName (محادثة فورية ولوحة ملاحظات)"
                textSize = 12f
                setTextColor(Color.parseColor("#38BDF8"))
                setPadding(0, 0, 0, dpToPx(8))
            }
            rootLayout.addView(headerText)

            // Scrollable messages container
            val scrollView = ScrollView(parentActivity).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dpToPx(280)
                ).apply {
                    bottomMargin = dpToPx(12)
                }
                setBackgroundColor(Color.parseColor("#0F172A"))
                setPadding(dpToPx(8), dpToPx(8), dpToPx(8), dpToPx(8))
            }

            val messagesContainer = LinearLayout(parentActivity).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            }
            scrollView.addView(messagesContainer)
            rootLayout.addView(scrollView)

            activeMessagesContainer = messagesContainer
            activeScrollView = scrollView

            // Populate existing messages or greeting
            synchronized(messages) {
                if (messages.isEmpty()) {
                    val emptyNotice = TextView(parentActivity).apply {
                        text = "لا توجد رسائل سابقة. أرسل رسالة فورية أو شارك ملاحظة مثبتة مع $peerName."
                        textSize = 12f
                        setTextColor(Color.parseColor("#94A3B8"))
                        setPadding(dpToPx(8), dpToPx(16), dpToPx(8), dpToPx(16))
                        gravity = Gravity.CENTER
                    }
                    messagesContainer.addView(emptyNotice)
                } else {
                    for (msg in messages) {
                        appendMessageBubble(messagesContainer, msg)
                    }
                }
            }

            // Input field
            val inputField = EditText(parentActivity).apply {
                hint = "اكتب رسالة أو ملاحظة... / Type message..."
                textSize = 13f
                setTextColor(Color.WHITE)
                setHintTextColor(Color.parseColor("#64748B"))
                setBackgroundColor(Color.parseColor("#1E293B"))
                setPadding(dpToPx(10), dpToPx(8), dpToPx(10), dpToPx(8))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = dpToPx(10)
                }
            }
            rootLayout.addView(inputField)

            // Button bar (Send Message + Pin Bulletin Note)
            val buttonsRow = LinearLayout(parentActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            }

            val sendBtn = Button(parentActivity).apply {
                text = "💬 إرسال رسالة"
                textSize = 12f
                setTextColor(Color.WHITE)
                setBackgroundColor(Color.parseColor("#2563EB"))
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                    marginEnd = dpToPx(6)
                }
                setOnClickListener {
                    val text = inputField.text.toString().trim()
                    if (text.isNotEmpty()) {
                        sendMessage(text, isBulletin = false, parentActivity)
                        inputField.text.clear()
                    }
                }
            }

            val noteBtn = Button(parentActivity).apply {
                text = "📌 تثبيت ملاحظة"
                textSize = 12f
                setTextColor(Color.WHITE)
                setBackgroundColor(Color.parseColor("#D97706"))
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                    marginStart = dpToPx(6)
                }
                setOnClickListener {
                    val text = inputField.text.toString().trim()
                    if (text.isNotEmpty()) {
                        sendMessage(text, isBulletin = true, parentActivity)
                        inputField.text.clear()
                    }
                }
            }

            buttonsRow.addView(sendBtn)
            buttonsRow.addView(noteBtn)
            rootLayout.addView(buttonsRow)

            val dialog = MaterialAlertDialogBuilder(parentActivity)
                .setTitle("💬 لوحة المحادثة والملاحظات (Bulletin Chat)")
                .setView(rootLayout)
                .setNegativeButton("إغلاق", null)
                .setOnDismissListener {
                    activeMessagesContainer = null
                    activeScrollView = null
                    activeDialog = null
                }
                .create()

            activeDialog = dialog
            dialog.show()

            scrollView.post { scrollView.fullScroll(View.FOCUS_DOWN) }
        }
    }

    private fun sendMessage(text: String, isBulletin: Boolean, parentActivity: Activity) {
        val msgId = UUID.randomUUID().toString()
        val now = System.currentTimeMillis()
        val msg = ChatMessage(msgId, "أنت (You)", text, now, isSelf = true, isBulletin = isBulletin)

        synchronized(messages) {
            messages.add(msg)
        }

        activeMessagesContainer?.let { container ->
            appendMessageBubble(container, msg)
            activeScrollView?.post { activeScrollView?.fullScroll(View.FOCUS_DOWN) }
        }

        val packet = NetworkPacket(PACKET_TYPE_CHAT_MESSAGE).apply {
            set("id", msgId)
            set("text", text)
            set("timestamp", now)
            set("isBulletin", isBulletin)
        }

        if (isDeviceInitialized) {
            device.sendPacket(packet)
            Toast.makeText(context, if (isBulletin) "📌 تم تثبيت الملاحظة لدى الطرف الآخر" else "تم الإرسال بنجاح", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(context, "تنبيه: الجهاز غير متصل حالياً", Toast.LENGTH_SHORT).show()
        }
    }

    private fun appendMessageBubble(container: LinearLayout, msg: ChatMessage) {
        val density = container.context.resources.displayMetrics.density
        val dpToPx = { dp: Int -> (dp * density).toInt() }
        val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(msg.timestamp))

        val bubble = LinearLayout(container.context).apply {
            orientation = LinearLayout.VERTICAL
            val bgColor = when {
                msg.isBulletin -> Color.parseColor("#451A03") // warm brown for pinned note
                msg.isSelf -> Color.parseColor("#1E3A8A")     // dark blue for self
                else -> Color.parseColor("#334155")           // slate for peer
            }
            setBackgroundColor(bgColor)
            setPadding(dpToPx(10), dpToPx(8), dpToPx(10), dpToPx(8))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = if (msg.isSelf) Gravity.END else Gravity.START
                topMargin = dpToPx(6)
                bottomMargin = dpToPx(2)
            }
        }

        val header = TextView(container.context).apply {
            val prefix = if (msg.isBulletin) "📌 [ملاحظة مثبتة] " else ""
            text = "$prefix${msg.sender} • $timeStr"
            textSize = 10f
            setTypeface(null, Typeface.BOLD)
            setTextColor(if (msg.isBulletin) Color.parseColor("#FDE047") else Color.parseColor("#93C5FD"))
        }
        bubble.addView(header)

        val content = TextView(container.context).apply {
            text = msg.text
            textSize = 13f
            setTextColor(Color.WHITE)
            setPadding(0, dpToPx(4), 0, 0)
        }
        bubble.addView(content)

        container.addView(bubble)
    }

    private fun getResourceString(name: String, fallback: String): String {
        return try {
            val resId = context.resources.getIdentifier(name, "string", context.packageName)
            if (resId != 0) context.getString(resId) else fallback
        } catch (_: Exception) {
            fallback
        }
    }

    companion object {
        const val PACKET_TYPE_CHAT_MESSAGE = "kdeconnect.chat.message"
        const val PACKET_TYPE_CHAT_ACK = "kdeconnect.chat.ack"
        const val PACKET_TYPE_SYNC_REQUEST = "kdeconnect.chat.sync_request"
        const val PACKET_TYPE_SYNC_RESPONSE = "kdeconnect.chat.sync_response"
        private const val LOG_TAG = "ChatPlugin"
    }
}
