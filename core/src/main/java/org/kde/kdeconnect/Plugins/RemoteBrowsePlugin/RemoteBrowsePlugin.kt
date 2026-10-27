package org.kde.kdeconnect.Plugins.RemoteBrowsePlugin

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
                logger.debug("Received browse response from ${device.name}")
            }
            else -> return false
        }
        return true
    }

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
            logger.warn("Security violation detected during path listing: ${secEx.message}")
            sendErrorResponse(response, ERROR_INVALID_PATH, secEx.message ?: "Path traversal forbidden")
        } catch (ex: Exception) {
            logger.error("Error processing directory list", ex)
            sendErrorResponse(response, ERROR_ACCESS_DENIED, "Failed to read filesystem: ${ex.localizedMessage}")
        }
    }

    @Throws(SecurityException::class)
    private fun resolveAndSanitizePath(inputPath: String): File {
        val decoded = URLDecoder.decode(inputPath, StandardCharsets.UTF_8.name())
        if (decoded.contains("..")) {
            throw SecurityException("Illegal directory traversal sequence detected")
        }

        val file = File(decoded)
        val canonical = file.canonicalFile

        val allowedRootFile = File(AUTHORIZED_STORAGE_ROOT).canonicalFile
        if (!canonical.path.startsWith(allowedRootFile.path)) {
            throw SecurityException("Access to path outside authorized root denied: ${canonical.path}")
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
        val fileName = np.getString("fileName", "upload_${System.currentTimeMillis()}.bin")
        val payloadStream = np.payload ?: return

        try {
            val destDir = resolveAndSanitizePath(targetDir)
            val destFile = File(destDir, fileName)
            FileOutputStream(destFile).use { out ->
                payloadStream.copyTo(out)
            }
            logger.info("Successfully received file: ${destFile.canonicalPath}")
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

    fun requestDirectoryListing(path: String) {
        val np = NetworkPacket(PACKET_TYPE_BROWSE_REQUEST).apply {
            set("path", path)
            set("showHidden", false)
        }
        device.sendPacket(np)
    }
}
