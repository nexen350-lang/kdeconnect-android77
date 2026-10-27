/*
 * SPDX-FileCopyrightText: 2026 KDE Connect Android Integration Team
 * SPDX-License-Identifier: GPL-2.0-only OR GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL
 */

package org.kde.kdeconnect.plugins.remotebrowse

import android.content.Context
import android.os.Environment
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
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

@LoadablePlugin
class RemoteBrowsePlugin : Plugin() {

    override val displayName: String
        get() = "Remote File Browser"

    override val description: String
        get() = "Browse remote Android storage and download files directly"

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

    override fun onPacketReceived(np: NetworkPacket): Boolean {
        when (np.type) {
            PACKET_TYPE_BROWSE_REQUEST -> handleBrowseRequest(np)
            PACKET_TYPE_DOWNLOAD_REQUEST -> handleDownloadRequest(np)
            PACKET_TYPE_UPLOAD_REQUEST -> handleUploadRequest(np)
            PACKET_TYPE_BROWSE_RESPONSE -> {
                Log.d(LOG_TAG, "Received browse response from ${device.name}")
            }
            else -> return false
        }
        return true
    }

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

            val fileArray = JSONArray()
            val files = targetDir.listFiles() ?: emptyArray()

            for (file in files) {
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
            response.set("parentPath", targetDir.parent ?: rootPath)
            response.set("files", fileArray)
            response.set("success", true)
            device.sendPacket(response)

        } catch (secEx: SecurityException) {
            Log.w(LOG_TAG, "Path traversal attempt blocked: ${secEx.message}")
            sendErrorResponse(response, "ERROR_INVALID_PATH", "Path traversal forbidden")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to list directory", e)
            sendErrorResponse(response, "ERROR_ACCESS_DENIED", "Access denied")
        }
    }

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
                payload = FileInputStream(file)
                payloadSize = file.length()
            }
            device.sendPacket(response)
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Error streaming download file", e)
        }
    }

    private fun handleUploadRequest(np: NetworkPacket) {
        val rootPath = Environment.getExternalStorageDirectory().canonicalPath
        val targetDir = np.getString("targetDirectory", rootPath)
        val fileName = np.getString("fileName", "upload_${System.currentTimeMillis()}.bin")
        val payloadStream = np.payload ?: return

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

    private fun sendErrorResponse(response: NetworkPacket, code: String, msg: String) {
        response.set("success", false)
        response.set("errorCode", code)
        response.set("errorMessage", msg)
        device.sendPacket(response)
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

    override fun getUiMenuEntries(): List<PluginUiMenuEntry> = listOf(
        PluginUiMenuEntry("تصفح ملفات الهاتف عن بعد") { activity ->
            Log.i(LOG_TAG, "Opened Remote File Browser on device: ${device.name}")
        }
    )

    companion object {
        const val PACKET_TYPE_BROWSE_REQUEST = "kdeconnect.remotebrowse.request"
        const val PACKET_TYPE_BROWSE_RESPONSE = "kdeconnect.remotebrowse.response"
        const val PACKET_TYPE_DOWNLOAD_REQUEST = "kdeconnect.remotebrowse.download"
        const val PACKET_TYPE_UPLOAD_REQUEST = "kdeconnect.remotebrowse.upload"
        private const val LOG_TAG = "RemoteBrowsePlugin"
    }
}
