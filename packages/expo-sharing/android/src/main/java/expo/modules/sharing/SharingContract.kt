package expo.modules.sharing

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import androidx.core.content.FileProvider
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.providers.AppContextProvider
import java.io.File
import java.io.Serializable
import java.net.URLConnection


internal class SharingContract(private val appContextProvider: AppContextProvider) : AppContextActivityResultContract<SharingContractOptions, SharingContractResult> {
  override fun createIntent(context: Context, input: SharingContractOptions): Intent {
    val fileToShare = getLocalFileFoUrl(input.url)
    val reactContext = input.reactContext

//    Log.e("dupa", contentUri.toString())

    isAllowedToRead(input.url)
    val mimeType = input.options.mimeType
      ?: URLConnection.guessContentTypeFromName(fileToShare.name)
      ?: "*/*"

    val intent = Intent(Intent.ACTION_SEND)
    intent.putExtra(Intent.EXTRA_STREAM, input.uri)
    intent.setTypeAndNormalize(mimeType)
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)

    context.grantUriPermission("android", input.uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);


    val resInfoList = context.packageManager.queryIntentActivities(
      intent,
      PackageManager.MATCH_DEFAULT_ONLY
    )

    resInfoList.forEach {
      Log.e("dupa", "My restInfoList  ${it.activityInfo.packageName} + ${input.uri}")
      val packageName = it.activityInfo.packageName
      context.grantUriPermission(packageName, input.uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

    return Intent.createChooser(intent, input.options.dialogTitle)
  }


  override fun parseResult(input: SharingContractOptions, resultCode: Int, intent: Intent?): SharingContractResult {
    return SharingContractResult(test = resultCode)
  }

  @Throws(InvalidArgumentException::class)
  private fun getLocalFileFoUrl(url: String?): File {
    if (url == null) {
      throw InvalidArgumentException("URL to share cannot be null.")
    }
    val uri = Uri.parse(url)
    if ("file" != uri.scheme) {
      throw InvalidArgumentException("Only local file URLs are supported (expected scheme to be 'file', got '" + uri.scheme + "'.")
    }
    val path = uri.path
      ?: throw InvalidArgumentException("Path component of the URL to share cannot be null.")
    if (false) {
      throw InvalidArgumentException("Not allowed to read file under given URL.")
    }
    return File(path)
  }

  private fun isAllowedToRead(url: String?): Boolean {
    val permissions = appContextProvider.appContext.filePermission
    return permissions?.getPathPermissions(appContextProvider.appContext.reactContext, url)?.contains(Permission.READ)
      ?: false
  }

}

internal data class SharingContractOptions(
  val url: String?,
  val options: SharingOptions,
  val reactContext:Context,
  val uri: Uri
) : Serializable

internal data class SharingContractResult(
  val test: Int
) : Serializable

