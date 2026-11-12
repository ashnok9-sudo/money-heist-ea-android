package com.moneyheistea.app

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var errorLayout: LinearLayout
    private lateinit var errorText: TextView
    private lateinit var retryButton: Button
    private lateinit var changeUrlButton: Button

    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            filePathCallback?.onReceiveValue(uris)
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }

    private val overlayPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.canDrawOverlays(this)) {
            startFloatingService(currentUrl)
            Toast.makeText(this, "Money Heist Floating Bot Activated! 🎭", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Display over other apps permission required for floating bot", Toast.LENGTH_LONG).show()
        }
    }

    private val prefs by lazy {
        getSharedPreferences("MoneyHeistEAPrefs", Context.MODE_PRIVATE)
    }

    private var currentUrl: String = ""

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        swipeRefresh.isEnabled = false // Disable pull-to-refresh so app behaves like native mobile app
        progressBar = findViewById(R.id.progressBar)
        errorLayout = findViewById(R.id.errorLayout)
        errorText = findViewById(R.id.errorText)
        retryButton = findViewById(R.id.retryButton)
        changeUrlButton = findViewById(R.id.changeUrlButton)

        currentUrl = prefs.getString("server_url", getString(R.string.default_server_url))
            ?: getString(R.string.default_server_url)

        setupWebView()
        setupListeners()
        loadUrl(currentUrl)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_NO_CACHE
        webView.clearCache(true)
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.userAgentString = settings.userAgentString + " MoneyHeistEA-AndroidApp/1.0"
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidApp")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
                errorLayout.visibility = View.GONE
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    progressBar.visibility = View.GONE
                    swipeRefresh.isRefreshing = false
                    errorLayout.visibility = View.VISIBLE
                    errorText.text = "Could not connect to:\n$currentUrl\n\nEnsure Money Heist EA server is running or change URL."
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                return if (url.startsWith("http://") || url.startsWith("https://")) {
                    false
                } else {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        true
                    } catch (e: Exception) {
                        false
                    }
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                var intent = fileChooserParams?.createIntent()
                val acceptTypes = fileChooserParams?.acceptTypes
                if (intent == null) {
                    intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        type = "image/*"
                        addCategory(Intent.CATEGORY_OPENABLE)
                    }
                } else if (acceptTypes != null && acceptTypes.isNotEmpty() && acceptTypes[0].isNotEmpty()) {
                    intent.type = acceptTypes[0]
                } else {
                    intent.type = "image/*"
                }

                try {
                    fileChooserLauncher.launch(Intent.createChooser(intent, "Select Chart Screenshot"))
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    this@MainActivity.filePathCallback = null
                    return false
                }
                return true
            }
        }
    }

    private fun setupListeners() {
        // Pull-to-refresh intentionally disabled to maintain native mobile app feel
        swipeRefresh.isEnabled = false

        retryButton.setOnClickListener {
            errorLayout.visibility = View.GONE
            loadUrl(currentUrl)
        }

        changeUrlButton.setOnClickListener {
            showChangeUrlDialog()
        }
    }

    private fun loadUrl(url: String) {
        var formatted = url.trim()
        if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
            formatted = "http://$formatted"
        }
        currentUrl = formatted
        webView.loadUrl(formatted)
    }

    private fun showChangeUrlDialog() {
        val input = EditText(this)
        input.hint = "e.g. http://192.168.1.101:8000 or Cloudflare link"
        input.setText(currentUrl)
        input.setSelection(currentUrl.length)

        AlertDialog.Builder(this)
            .setTitle(R.string.server_settings)
            .setMessage(R.string.enter_server_url)
            .setView(input)
            .setPositiveButton(R.string.save) { _, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotEmpty()) {
                    prefs.edit().putString("server_url", newUrl).apply()
                    errorLayout.visibility = View.GONE
                    loadUrl(newUrl)
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        val tab = intent?.getStringExtra("navigate_tab")
        if (!tab.isNullOrEmpty()) {
            webView.evaluateJavascript("if (typeof switchTab === 'function') switchTab('$tab');", null)
        }
    }

    fun isOverlayPermissionGranted(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    fun checkAndRequestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            overlayPermissionLauncher.launch(intent)
        }
    }

    fun startFloatingService(serverUrl: String) {
        if (!isOverlayPermissionGranted()) {
            checkAndRequestOverlayPermission()
            return
        }
        val intent = Intent(this, FloatingOverlayService::class.java).apply {
            putExtra("server_url", serverUrl)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    fun stopFloatingService() {
        stopService(Intent(this, FloatingOverlayService::class.java))
    }

    inner class WebAppInterface(private val activity: MainActivity) {
        @JavascriptInterface
        fun startFloatingBot(serverUrl: String?) {
            activity.runOnUiThread {
                activity.startFloatingService(serverUrl ?: currentUrl)
            }
        }

        @JavascriptInterface
        fun stopFloatingBot() {
            activity.runOnUiThread {
                activity.stopFloatingService()
            }
        }

        @JavascriptInterface
        fun isOverlayGranted(): Boolean {
            return activity.isOverlayPermissionGranted()
        }

        @JavascriptInterface
        fun requestOverlay() {
            activity.runOnUiThread {
                activity.checkAndRequestOverlayPermission()
            }
        }
    }
}
