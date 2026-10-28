/*
 * SPDX-FileCopyrightText: 2026 KDE Connect Android Integration Team
 * SPDX-License-Identifier: GPL-2.0-only OR GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL
 */

package org.kde.kdeconnect.plugins.remotebrowse

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.addJsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.put
import org.kde.kdeconnect.NetworkPacket
import org.kde.kdeconnect.plugins.Plugin
import org.kde.kdeconnect.plugins.PluginFactory.LoadablePlugin
import org.kde.kdeconnect_tp.R
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

@LoadablePlugin
class RemoteBrowsePlugin : Plugin() {

    override val displayName: String
        get() = getResourceString("pref_plugin_remotebrowse", "Remote File Browser")

    override val description: String
        get() = getResourceString("pref_plugin_remotebrowse_desc", "Browse remote Android storage and download files directly")

    override val supportedPacketTypes: Array<String> = arrayOf(
        PACKET_TYPE_BROWSE_REQUEST,
        PACKET_TYPE_BROWSE_RESPONSE,
        PACKET_TYPE_DOWNLOAD_REQUEST,
        PACKET_TYPE_UPLOAD_REQUEST
    )

    override val outgoingPacketTypes: Array<String> = arrayOf(
        PACKET_TYPE_BROWSE_REQUEST,
        PACKET_TYPE_BROWSE_RESPONSE,
        PACKET_TYPE_DOWNLOAD_REQUEST,
        PACKET_TYPE_UPLOAD_REQUEST
    )

    data class RemoteFileItem(
        val name: String,
        val path: String,
        val isDirectory: Boolean,
        val sizeBytes: Long,
        val lastModified: Long
    )

    private val mainHandler = Handler(Looper.getMainLooper())
    private var currentPath: String = "/storage/emulated/0"
    private var parentPath: String = "/storage/emulated/0"
    private var activeFilesContainer: LinearLayout? = null
    private var activePathTextView: TextView? = null
    private var activeDialog: AlertDialog? = null

    // Register button on device main screen (alongside Send Files, Multimedia Controls, etc.)
    override fun getUiButtons(): List<PluginUiButton> {
        val label = getResourceString("pref_plugin_remotebrowse", "Remote File Browser")
        return listOf(
            PluginUiButton(
                label,
                R.drawable.share_plugin_action_24dp
            ) { parentActivity ->
                showBrowseInterface(parentActivity)
            }
        )
    }

    // Register menu entry in 3-dots overflow menu
    override fun getUiMenuEntries(): List<PluginUiMenuEntry> {
        val label = getResourceString("pref_plugin_remotebrowse", "Remote File Browser")
        return listOf(
            PluginUiMenuEntry(label) { parentActivity ->
                showBrowseInterface(parentActivity)
            }
        )
    }

    override fun onPacketReceived(np: NetworkPacket): Boolean {
        when (np.type) {
            PACKET_TYPE_BROWSE_REQUEST -> handleBrowseRequest(np)
            PACKET_TYPE_BROWSE_RESPONSE -> handleBrowseResponse(np)
            PACKET_TYPE_DOWNLOAD_REQUEST -> {
                if (np.hasPayload()) {
                    handleIncomingDownloadedFile(np)
                } else {
                    handleDownloadRequest(np)
                }
            }
            PACKET_TYPE_UPLOAD_REQUEST -> handleUploadRequest(np)
            else -> return false
        }
        return true
    }

    /**
     * Handles incoming request from peer to list files in a local directory
     */
    private fun handleBrowseRequest(np: NetworkPacket) {
        val rootPath = Environment.getExternalStorageDirectory().canonicalPath
        val requestedPath = np.getString("path", rootPath)
        val response = NetworkPacket(PACKET_TYPE_BROWSE_RESPONSE).apply {
            set("requestId", np.getLong("id", System.currentTimeMillis()))
        }

        try {
            val targetDir = resolveAndSanitizePath(requestedPath, rootPath)
            if (!targetDir.exists() || !targetDir.isDirectory) {
                sendErrorResponse(response, "ERROR_NOT_FOUND", "Directory not found")
                return
            }

            val files = targetDir.listFiles() ?: emptyArray()
            val showHidden = np.getBoolean("showHidden", false)

            val fileArray: JsonArray = buildJsonArray {
                for (file in files) {
                    if (file.name.startsWith(".") && !showHidden) {
                        continue
                    }
                    addJsonObject {
                        put("name", file.name)
                        put("path", file.canonicalPath)
                        put("isDirectory", file.isDirectory)
                        put("sizeBytes", if (file.isDirectory) 4096L else file.length())
                        put("lastModified", file.lastModified())
                        put("canRead", file.canRead())
                        put("canWrite", file.canWrite())
                        put("mimeType", detectMimeType(file))
                    }
                }
            }

            response.set("path", targetDir.canonicalPath)
            response.set("parentPath", targetDir.parent ?: rootPath)
            response.set("files", fileArray)
            response.set("success", true)
            if (isDeviceInitialized) {
                device.sendPacket(response)
            }
        } catch (secEx: SecurityException) {
            Log.w(LOG_TAG, "Path traversal attempt blocked: ${secEx.message}")
            sendErrorResponse(response, "ERROR_INVALID_PATH", "Path traversal forbidden")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to list directory", e)
            sendErrorResponse(response, "ERROR_ACCESS_DENIED", "Access denied")
        }
    }

    /**
     * Handles received browse response from peer, rendering remote files on UI
     */
    private fun handleBrowseResponse(np: NetworkPacket) {
        val success = np.getBoolean("success", false)
        if (!success) {
            val errMsg = np.getString("errorMessage", "فشل الوصول إلى المجلد")
            mainHandler.post {
                Toast.makeText(context, "خطأ: $errMsg", Toast.LENGTH_SHORT).show()
            }
            return
        }

        val path = np.getString("path", currentPath)
        val parent = np.getString("parentPath", path)
        currentPath = path
        parentPath = parent

        val filesArray = np.getJsonArray("files") ?: JsonArray(emptyList())
        val parsedItems = mutableListOf<RemoteFileItem>()

        for (el in filesArray) {
            val obj = el.jsonObject
            val name = obj["name"]?.jsonPrimitive?.content ?: continue
            val itemPath = obj["path"]?.jsonPrimitive?.content ?: ""
            val isDir = obj["isDirectory"]?.jsonPrimitive?.booleanOrNull ?: false
            val size = obj["sizeBytes"]?.jsonPrimitive?.longOrNull ?: 0L
            val mod = obj["lastModified"]?.jsonPrimitive?.longOrNull ?: 0L
            parsedItems.add(RemoteFileItem(name, itemPath, isDir, size, mod))
        }

        // Sort: directories first, then alphabetically
        parsedItems.sortWith(compareBy({ !it.isDirectory }, { it.name.lowercase() }))

        mainHandler.post {
            activePathTextView?.text = "المسار: $currentPath"
            activeFilesContainer?.let { container ->
                container.removeAllViews()
                if (parsedItems.isEmpty()) {
                    val emptyView = TextView(container.context).apply {
                        text = "المجلد فارغ لا يحتوي على ملفات."
                        textSize = 12f
                        setTextColor(Color.parseColor("#94A3B8"))
                        gravity = Gravity.CENTER
                        setPadding(0, 40, 0, 40)
                    }
                    container.addView(emptyView)
                } else {
                    for (item in parsedItems) {
                        appendFileRow(container, item)
                    }
                }
            }
        }
    }

    /**
     * Handles peer request to download a file from this device
     */
    private fun handleDownloadRequest(np: NetworkPacket) {
        val rootPath = Environment.getExternalStorageDirectory().canonicalPath
        val targetPath = np.getString("path", "")
        try {
            val file = resolveAndSanitizePath(targetPath, rootPath)
            if (!file.exists() || file.isDirectory) {
                return
            }
            val response = NetworkPacket(PACKET_TYPE_DOWNLOAD_REQUEST).apply {
                set("path", file.canonicalPath)
                set("fileName", file.name)
                set("size", file.length())
                set("success", true)
                payload = NetworkPacket.Payload(FileInputStream(file), file.length())
            }
            if (isDeviceInitialized) {
                device.sendPacket(response)
            }
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Error streaming download file", e)
        }
    }

    /**
     * Handles file payload coming back to this device from peer
     */
    private fun handleIncomingDownloadedFile(np: NetworkPacket) {
        val fileName = np.getString("fileName", "download_${System.currentTimeMillis()}.bin")
        val payloadStream = np.payload?.inputStream ?: return
        try {
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val kdeDir = File(downloadsDir, "KDEConnect").apply { mkdirs() }
            val destFile = File(kdeDir, fileName)

            FileOutputStream(destFile).use { out ->
                payloadStream.copyTo(out)
            }

            mainHandler.post {
                Toast.makeText(context, "✅ تم تحميل: $fileName في مجلد التنزيلات", Toast.LENGTH_LONG).show()
            }
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Error writing downloaded file", e)
            mainHandler.post {
                Toast.makeText(context, "فشل حفظ الملف المحمل: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun handleUploadRequest(np: NetworkPacket) {
        val rootPath = Environment.getExternalStorageDirectory().canonicalPath
        val targetDir = np.getString("targetDirectory", rootPath)
        val fileName = np.getString("fileName", "upload_${System.currentTimeMillis()}.bin")
        val payloadStream = np.payload?.inputStream ?: return

        try {
            val destDir = resolveAndSanitizePath(targetDir, rootPath)
            val destFile = File(destDir, fileName)
            FileOutputStream(destFile).use { out ->
                payloadStream.copyTo(out)
            }
            Log.i(LOG_TAG, "Received file: ${destFile.canonicalPath}")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Error writing uploaded file", e)
        }
    }

    /**
     * Renders the interactive File Browser dialog inside parentActivity
     */
    private fun showBrowseInterface(parentActivity: Activity) {
        parentActivity.runOnUiThread {
            val peerName = if (isDeviceInitialized) device.name else "Peer"
            val density = parentActivity.resources.displayMetrics.density
            val dpToPx = { dp: Int -> (dp * density).toInt() }

            val rootLayout = LinearLayout(parentActivity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dpToPx(14), dpToPx(10), dpToPx(14), dpToPx(10))
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
            }

            // Path banner
            val pathTextView = TextView(parentActivity).apply {
                text = "المسار: $currentPath"
                textSize = 12f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor("#38BDF8"))
                setPadding(0, 0, 0, dpToPx(6))
            }
            rootLayout.addView(pathTextView)
            activePathTextView = pathTextView

            // Shortcuts navigation row
            val hScroll = HorizontalScrollView(parentActivity).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = dpToPx(8)
                }
            }

            val shortcutsRow = LinearLayout(parentActivity).apply {
                orientation = LinearLayout.HORIZONTAL
            }

            val makeShortcutBtn = { title: String, pathTarget: () -> String ->
                Button(parentActivity).apply {
                    text = title
                    textSize = 11f
                    setTextColor(Color.WHITE)
                    setBackgroundColor(Color.parseColor("#1E293B"))
                    setPadding(dpToPx(8), dpToPx(4), dpToPx(8), dpToPx(4))
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        dpToPx(36)
                    ).apply {
                        marginEnd = dpToPx(4)
                    }
                    setOnClickListener {
                        requestRemoteDirectory(pathTarget())
                    }
                }
            }

            shortcutsRow.addView(makeShortcutBtn("🏠 الذاكرة الرئيسية") { "/storage/emulated/0" })
            shortcutsRow.addView(makeShortcutBtn("📷 الصور DCIM") { "/storage/emulated/0/DCIM" })
            shortcutsRow.addView(makeShortcutBtn("⬇️ التنزيلات") { "/storage/emulated/0/Download" })
            shortcutsRow.addView(makeShortcutBtn("📄 المستندات") { "/storage/emulated/0/Documents" })
            shortcutsRow.addView(makeShortcutBtn("⬆️ للأعلى") { parentPath })
            shortcutsRow.addView(makeShortcutBtn("🔄 تحديث") { currentPath })

            hScroll.addView(shortcutsRow)
            rootLayout.addView(hScroll)

            // Scrollable files container
            val scrollView = ScrollView(parentActivity).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dpToPx(320)
                )
                setBackgroundColor(Color.parseColor("#0F172A"))
                setPadding(dpToPx(6), dpToPx(6), dpToPx(6), dpToPx(6))
            }

            val filesContainer = LinearLayout(parentActivity).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            }
            scrollView.addView(filesContainer)
            rootLayout.addView(scrollView)

            activeFilesContainer = filesContainer

            // Initial status while querying remote device
            val loadingView = TextView(parentActivity).apply {
                text = "جاري الاتصال بـ $peerName وجلب قائمة الملفات..."
                textSize = 12f
                setTextColor(Color.parseColor("#94A3B8"))
                setPadding(dpToPx(8), dpToPx(16), dpToPx(8), dpToPx(16))
                gravity = Gravity.CENTER
            }
            filesContainer.addView(loadingView)

            val dialog = MaterialAlertDialogBuilder(parentActivity)
                .setTitle("📁 متصفح الملفات عن بعد ($peerName)")
                .setView(rootLayout)
                .setNegativeButton("إغلاق", null)
                .setOnDismissListener {
                    activeFilesContainer = null
                    activePathTextView = null
                    activeDialog = null
                }
                .create()

            activeDialog = dialog
            dialog.show()

            // Trigger initial browse request
            requestRemoteDirectory(currentPath)
        }
    }

    private fun requestRemoteDirectory(dirPath: String) {
        val packet = NetworkPacket(PACKET_TYPE_BROWSE_REQUEST).apply {
            set("id", System.currentTimeMillis())
            set("path", dirPath)
            set("showHidden", false)
        }

        if (isDeviceInitialized) {
            device.sendPacket(packet)
            activePathTextView?.text = "جاري طلب: $dirPath..."
        } else {
            Toast.makeText(context, "تنبيه: الجهاز غير متصل", Toast.LENGTH_SHORT).show()
        }
    }

    private fun appendFileRow(container: LinearLayout, item: RemoteFileItem) {
        val ctx = container.context
        val density = ctx.resources.displayMetrics.density
        val dpToPx = { dp: Int -> (dp * density).toInt() }

        val row = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dpToPx(8), dpToPx(8), dpToPx(8), dpToPx(8))
            setBackgroundColor(if (item.isDirectory) Color.parseColor("#1E293B") else Color.parseColor("#0F172A"))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(2)
            }
        }

        val iconText = TextView(ctx).apply {
            text = if (item.isDirectory) "📁" else "📄"
            textSize = 16f
            setPadding(0, 0, dpToPx(8), 0)
        }
        row.addView(iconText)

        val infoCol = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val nameText = TextView(ctx).apply {
            text = item.name
            textSize = 12f
            setTextColor(if (item.isDirectory) Color.parseColor("#60A5FA") else Color.WHITE)
            setTypeface(null, if (item.isDirectory) Typeface.BOLD else Typeface.NORMAL)
        }
        infoCol.addView(nameText)

        val metaText = TextView(ctx).apply {
            text = if (item.isDirectory) "مجلد" else formatFileSize(item.sizeBytes)
            textSize = 10f
            setTextColor(Color.parseColor("#94A3B8"))
        }
        infoCol.addView(metaText)
        row.addView(infoCol)

        if (!item.isDirectory) {
            val downloadBtn = Button(ctx).apply {
                text = "⬇️ تحميل"
                textSize = 10f
                setTextColor(Color.WHITE)
                setBackgroundColor(Color.parseColor("#16A34A"))
                setPadding(dpToPx(6), 0, dpToPx(6), 0)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    dpToPx(32)
                )
                setOnClickListener {
                    promptDownloadFile(ctx, item)
                }
            }
            row.addView(downloadBtn)
        }

        row.setOnClickListener {
            if (item.isDirectory) {
                requestRemoteDirectory(item.path)
            } else {
                promptDownloadFile(ctx, item)
            }
        }

        container.addView(row)
    }

    private fun promptDownloadFile(ctx: android.content.Context, item: RemoteFileItem) {
        MaterialAlertDialogBuilder(ctx)
            .setTitle("تحميل الملف")
            .setMessage("هل تريد تحميل ${item.name} (${formatFileSize(item.sizeBytes)}) من الجهاز البعيد إلى مجلد التنزيلات بهاتفك؟")
            .setPositiveButton("نعم، ابدأ التحميل") { _, _ ->
                val packet = NetworkPacket(PACKET_TYPE_DOWNLOAD_REQUEST).apply {
                    set("path", item.path)
                    set("fileName", item.name)
                }
                if (isDeviceInitialized) {
                    device.sendPacket(packet)
                    Toast.makeText(ctx, "جاري طلب تحميل ${item.name}...", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("إلغاء", null)
            .show()
    }

    private fun formatFileSize(bytes: Long): String {
        if (bytes <= 0) return "0 B"
        val units = arrayOf("B", "KB", "MB", "GB")
        val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
        val index = Math.min(digitGroups, units.size - 1)
        return String.format(Locale.US, "%.1f %s", bytes / Math.pow(1024.0, index.toDouble()), units[index])
    }

    private fun sendErrorResponse(response: NetworkPacket, code: String, msg: String) {
        response.set("success", false)
        response.set("errorCode", code)
        response.set("errorMessage", msg)
        if (isDeviceInitialized) {
            device.sendPacket(response)
        }
    }

    @Throws(SecurityException::class)
    private fun resolveAndSanitizePath(inputPath: String, allowedRoot: String): File {
        val decoded = URLDecoder.decode(inputPath, StandardCharsets.UTF_8.name())
        if (decoded.contains("..")) {
            throw SecurityException("Illegal directory traversal sequence")
        }
        val file = File(decoded).canonicalFile
        val rootFile = File(allowedRoot).canonicalFile
        if (!file.path.startsWith(rootFile.path)) {
            throw SecurityException("Access outside root forbidden")
        }
        return file
    }

    private fun detectMimeType(file: File): String {
        val ext = file.extension.lowercase()
        return when (ext) {
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "pdf" -> "application/pdf"
            "txt", "md" -> "text/plain"
            "apk" -> "application/vnd.android.package-archive"
            "zip" -> "application/zip"
            else -> if (file.isDirectory) "inode/directory" else "application/octet-stream"
        }
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
        const val PACKET_TYPE_BROWSE_REQUEST = "kdeconnect.remotebrowse.request"
        const val PACKET_TYPE_BROWSE_RESPONSE = "kdeconnect.remotebrowse.response"
        const val PACKET_TYPE_DOWNLOAD_REQUEST = "kdeconnect.remotebrowse.download"
        const val PACKET_TYPE_UPLOAD_REQUEST = "kdeconnect.remotebrowse.upload"
        private const val LOG_TAG = "RemoteBrowsePlugin"
    }
}
