package com.moneyheistea.app

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.concurrent.thread
import kotlin.math.abs

class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var overlayView: View
    private lateinit var bubbleContainer: FrameLayout
    private lateinit var quotesWindow: LinearLayout
    private lateinit var txtStatusPill: TextView
    private lateinit var txtTerminalLog: TextView
    private lateinit var scrollTerminal: ScrollView
    private lateinit var btnCloseQuotes: TextView
    private lateinit var btnOverlayToggle: Button
    private lateinit var btnOverlayLive: Button
    private lateinit var btnOverlayScript: Button
    private lateinit var txtFooterServer: TextView

    private lateinit var params: WindowManager.LayoutParams
    private var serverUrl: String = "http://192.168.1.101:8000"
    private var isPolling = true
    private val mainHandler = Handler(Looper.getMainLooper())
    private var isBotActive = false
    private val logLines = mutableListOf<String>()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 30
            y = 350
        }

        overlayView = LayoutInflater.from(this).inflate(R.layout.layout_floating_overlay, null)

        bubbleContainer = overlayView.findViewById(R.id.bubbleContainer)
        quotesWindow = overlayView.findViewById(R.id.quotesWindow)
        txtStatusPill = overlayView.findViewById(R.id.txtStatusPill)
        txtTerminalLog = overlayView.findViewById(R.id.txtTerminalLog)
        scrollTerminal = overlayView.findViewById(R.id.scrollTerminal)
        btnCloseQuotes = overlayView.findViewById(R.id.btnCloseQuotes)
        btnOverlayToggle = overlayView.findViewById(R.id.btnOverlayToggle)
        btnOverlayLive = overlayView.findViewById(R.id.btnOverlayLive)
        btnOverlayScript = overlayView.findViewById(R.id.btnOverlayScript)
        txtFooterServer = overlayView.findViewById(R.id.txtFooterServer)

        setupTouchListener()
        setupButtons()

        windowManager.addView(overlayView, params)
        startForegroundServiceNotification()
        startTelemetryPolling()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val url = intent?.getStringExtra("server_url")
        if (!url.isNullOrBlank()) {
            serverUrl = url
        }
        return START_STICKY
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun setupTouchListener() {
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        bubbleContainer.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(overlayView, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val diffX = abs(event.rawX - initialTouchX)
                    val diffY = abs(event.rawY - initialTouchY)
                    if (diffX < 15 && diffY < 15) {
                        // Click event: toggle quotes window
                        toggleQuotesWindow(true)
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun setupButtons() {
        btnCloseQuotes.setOnClickListener {
            toggleQuotesWindow(false)
        }

        btnOverlayToggle.setOnClickListener {
            thread {
                try {
                    val url = URL("$serverUrl/api/bot/toggle")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.connectTimeout = 3000
                    conn.readTimeout = 3000
                    conn.responseCode
                    conn.disconnect()
                } catch (_: Exception) {}
            }
        }

        btnOverlayLive.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("navigate_tab", "tabMetaTrader")
            }
            startActivity(intent)
            toggleQuotesWindow(false)
        }

        btnOverlayScript.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("navigate_tab", "tabScanner")
            }
            startActivity(intent)
            toggleQuotesWindow(false)
        }
    }

    private fun toggleQuotesWindow(showWindow: Boolean) {
        if (showWindow) {
            bubbleContainer.visibility = View.GONE
            quotesWindow.visibility = View.VISIBLE
        } else {
            quotesWindow.visibility = View.GONE
            bubbleContainer.visibility = View.VISIBLE
        }
        windowManager.updateViewLayout(overlayView, params)
    }

    private fun startForegroundServiceNotification() {
        val channelId = "money_heist_floating_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Money Heist EA Floating Overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live quotes and bot status over MetaTrader"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Money Heist EA Floating Active")
            .setContentText("Monitoring live MT5 trades and scanner")
            .setSmallIcon(R.drawable.heist_icon)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        startForeground(1001, notification)
    }

    private fun startTelemetryPolling() {
        thread {
            while (isPolling) {
                try {
                    // Poll bot status
                    val statusObj = httpGetJson("$serverUrl/api/bot/status")
                    val enabled = statusObj?.optBoolean("enabled") ?: false

                    // Poll positions
                    val posArray = httpGetJsonArray("$serverUrl/api/mt5/positions")
                    val openCount = posArray?.length() ?: 0

                    isBotActive = enabled

                    mainHandler.post {
                        updateUI(enabled, openCount)
                    }
                } catch (_: Exception) {}

                try {
                    Thread.sleep(3500)
                } catch (_: InterruptedException) {
                    break
                }
            }
        }
    }

    private fun updateUI(enabled: Boolean, openCount: Int) {
        val timeStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())

        if (enabled) {
            btnOverlayToggle.text = "STOP EA"
            btnOverlayToggle.setBackgroundColor(Color.parseColor("#E50914"))

            if (openCount > 0) {
                txtStatusPill.text = "🟡 TRADE EXECUTED ($openCount ACTIVE)"
                txtStatusPill.setTextColor(Color.parseColor("#F59E0B"))
                appendLog("[$timeStr] In Trade: Monitoring $openCount position(s)...")
            } else {
                txtStatusPill.text = "🟢 SCANNING MARKETS"
                txtStatusPill.setTextColor(Color.parseColor("#10B981"))
                appendLog("[$timeStr] Scanning Gold & Forex for ICT/FVG setups...")
            }
        } else {
            btnOverlayToggle.text = "START EA"
            btnOverlayToggle.setBackgroundColor(Color.parseColor("#10B981"))
            txtStatusPill.text = "🔴 ENGINE OFF"
            txtStatusPill.setTextColor(Color.parseColor("#EF4444"))
        }
    }

    private fun appendLog(msg: String) {
        if (logLines.isNotEmpty() && logLines.last() == msg) return
        logLines.add(msg)
        if (logLines.size > 25) logLines.removeAt(0)
        txtTerminalLog.text = logLines.joinToString("\n")
        scrollTerminal.post {
            scrollTerminal.fullScroll(View.FOCUS_DOWN)
        }
    }

    private fun httpGetJson(urlStr: String): JSONObject? {
        return try {
            val url = URL(urlStr)
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 3000
            conn.readTimeout = 3000
            if (conn.responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val sb = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    sb.append(line)
                }
                reader.close()
                conn.disconnect()
                JSONObject(sb.toString())
            } else {
                conn.disconnect()
                null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun httpGetJsonArray(urlStr: String): JSONArray? {
        return try {
            val url = URL(urlStr)
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 3000
            conn.readTimeout = 3000
            if (conn.responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val sb = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    sb.append(line)
                }
                reader.close()
                conn.disconnect()
                JSONArray(sb.toString())
            } else {
                conn.disconnect()
                null
            }
        } catch (_: Exception) {
            null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isPolling = false
        if (::windowManager.isInitialized && ::overlayView.isInitialized) {
            try {
                windowManager.removeView(overlayView)
            } catch (_: Exception) {}
        }
    }
}
