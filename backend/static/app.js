// MONEY HEIST EA | Mobile Client Controller
let currentTf = "15m";
let currentModalSymbol = "XAUUSD";
let botActive = false;
let mt5Connected = false;
let scanData = [];
let clientLicense = { valid: false, key: null, status: "NONE", days_left: null, account: null };
let adminPasskey = sessionStorage.getItem("adminPasskey") || null;

// DOM Elements
const mt5Pill = document.getElementById("mt5Pill");
const mt5PillText = document.getElementById("mt5PillText");
const mainStartStopBtn = document.getElementById("mainStartStopBtn");
const mainPlayIcon = document.getElementById("mainPlayIcon");
const mainStartStopText = document.getElementById("mainStartStopText");
const robotCardStatus = document.getElementById("robotCardStatus");
const botLogsContainer = document.getElementById("botLogsContainer");

// VIP License Elements
const licenseStatusStrip = document.getElementById("licenseStatusStrip");
const licPulseDot = document.getElementById("licPulseDot");
const licStatusText = document.getElementById("licStatusText");
const stripActionBtn = document.getElementById("stripActionBtn");
const currentLicenseText = document.getElementById("currentLicenseText");
const currentLicenseBadge = document.getElementById("currentLicenseBadge");
const boundAccountText = document.getElementById("boundAccountText");
const licenseDaysLeftBadge = document.getElementById("licenseDaysLeftBadge");

// Tab Navigation
const tabButtons = document.querySelectorAll(".nav-tab-item");
const tabPages = document.querySelectorAll(".tab-page");
const quickQuotesBtn = document.getElementById("quickQuotesBtn");

// Quotes / Scanner Tab
const mobileQuotesList = document.getElementById("mobileQuotesList");
const tfPills = document.querySelectorAll(".tf-pill");

// MetaTrader Tab
const mtAccountServer = document.getElementById("mtAccountServer");
const mtBalanceVal = document.getElementById("mtBalanceVal");
const mtEquityVal = document.getElementById("mtEquityVal");
const mtProfitVal = document.getElementById("mtProfitVal");
const mtLoginVal = document.getElementById("mtLoginVal");
const mobilePositionsList = document.getElementById("mobilePositionsList");
const refreshPositionsBtnMobile = document.getElementById("refreshPositionsBtnMobile");

// Settings Tab
const settingsLotInput = document.getElementById("settingsLotInput");
const settingsMaxTradesInput = document.getElementById("settingsMaxTradesInput");

// Modals
const addNewRobotBtn = document.getElementById("addNewRobotBtn");
const addKeyBtnSettings = document.getElementById("addKeyBtnSettings");
const licenseModal = document.getElementById("licenseModal");
const licenseModalCloseBtn = document.getElementById("licenseModalCloseBtn");
const activateLicenseBtn = document.getElementById("activateLicenseBtn");
const licenseKeyInput = document.getElementById("licenseKeyInput");
const pasteKeyBtn = document.getElementById("pasteKeyBtn");
const modalMt5Account = document.getElementById("modalMt5Account");
const licenseFeedback = document.getElementById("licenseFeedback");

// Inspect Modal
const inspectModal = document.getElementById("inspectModal");
const inspectModalCloseBtn = document.getElementById("inspectModalCloseBtn");
const inspectSymbol = document.getElementById("inspectSymbol");
const inspectBadge = document.getElementById("inspectBadge");
const inspectEntry = document.getElementById("inspectEntry");
const inspectSL = document.getElementById("inspectSL");
const inspectTP1 = document.getElementById("inspectTP1");
const inspectRR = document.getElementById("inspectRR");
const mobileExecBuyBtn = document.getElementById("mobileExecBuyBtn");
const mobileExecSellBtn = document.getElementById("mobileExecSellBtn");
const mobileExecFeedback = document.getElementById("mobileExecFeedback");

// 1. Tab Switching
tabButtons.forEach(btn => {
  btn.onclick = () => {
    const targetTab = btn.getAttribute("data-tab");
    switchTab(targetTab);
  };
});

function switchTab(tabId) {
  tabButtons.forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tabId);
  });
  tabPages.forEach(p => {
    p.classList.toggle("active", p.id === tabId);
  });
  if (tabId === "tabScanner") {
    renderMobileQuotes();
  } else if (tabId === "tabMetaTrader") {
    fetchMT5Telemetry();
  }
}

// ============================================================
// QUOTES BOT CONSOLE CONTROLLER (Signature Port Feature)
// ============================================================
const quotesConsoleModal = document.getElementById("quotesConsoleModal");
const quotesModalCloseBtn = document.getElementById("quotesModalCloseBtn");
const quotesAvatarRing = document.getElementById("quotesAvatarRing");
const quotesStatusPill = document.getElementById("quotesStatusPill");
const quotesStatusText = document.getElementById("quotesStatusText");
const quotesTerminalLogs = document.getElementById("quotesTerminalLogs");
const terminalStateBadge = document.getElementById("terminalStateBadge");
const quotesPillToggle = document.getElementById("quotesPillToggle");
const quotesPillToggleText = document.getElementById("quotesPillToggleText");
const quotesPillToggleIcon = document.getElementById("quotesPillToggleIcon");
const quotesPillScript = document.getElementById("quotesPillScript");
const quotesPillLive = document.getElementById("quotesPillLive");
const floatingBotBubble = document.getElementById("floatingBotBubble");

function openQuotesModal() {
  if (quotesConsoleModal) {
    quotesConsoleModal.classList.add("open");
    refreshQuotesConsoleUI();
  }
}

function closeQuotesModal() {
  if (quotesConsoleModal) {
    quotesConsoleModal.classList.remove("open");
  }
}

if (quickQuotesBtn) {
  quickQuotesBtn.onclick = (e) => {
    e.preventDefault();
    openQuotesModal();
  };
}

if (floatingBotBubble) {
  floatingBotBubble.style.display = "none"; // Only pops up when bot is started!
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  const onDragStart = (e) => {
    isDragging = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;
    const rect = floatingBotBubble.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    const onDragMove = (moveEvt) => {
      const curX = moveEvt.touches ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const curY = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const dx = curX - startX;
      const dy = curY - startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isDragging = true;
      }
      floatingBotBubble.style.right = "auto";
      floatingBotBubble.style.bottom = "auto";
      floatingBotBubble.style.left = `${Math.max(10, Math.min(window.innerWidth - 65, initialLeft + dx))}px`;
      floatingBotBubble.style.top = `${Math.max(10, Math.min(window.innerHeight - 65, initialTop + dy))}px`;
    };

    const onDragEnd = () => {
      document.removeEventListener("mousemove", onDragMove);
      document.removeEventListener("mouseup", onDragEnd);
      document.removeEventListener("touchmove", onDragMove);
      document.removeEventListener("touchend", onDragEnd);
    };

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchmove", onDragMove, { passive: true });
    document.addEventListener("touchend", onDragEnd);
  };

  floatingBotBubble.addEventListener("mousedown", onDragStart);
  floatingBotBubble.addEventListener("touchstart", onDragStart, { passive: true });

  floatingBotBubble.onclick = (e) => {
    if (isDragging) {
      e.preventDefault();
      return;
    }
    openQuotesModal();
  };
}

if (quotesModalCloseBtn) {
  quotesModalCloseBtn.onclick = closeQuotesModal;
}
if (quotesConsoleModal) {
  quotesConsoleModal.onclick = (e) => {
    if (e.target === quotesConsoleModal) closeQuotesModal();
  };
}

if (quotesPillScript) {
  quotesPillScript.onclick = () => {
    closeQuotesModal();
    if (typeof openRobotConfigModal === "function") openRobotConfigModal();
  };
}

if (quotesPillLive) {
  quotesPillLive.onclick = () => {
    closeQuotesModal();
    switchTab("tabMetaTrader");
  };
}

if (quotesPillToggle) {
  quotesPillToggle.onclick = () => {
    if (mainStartStopBtn) mainStartStopBtn.click();
    setTimeout(refreshQuotesConsoleUI, 350);
  };
}

let lastLogState = "";
function appendQuotesLog(text, type = "t-system") {
  if (!quotesTerminalLogs) return;
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0];
  const line = document.createElement("div");
  line.className = `t-line ${type}`;
  line.innerText = `[${timeStr}] ${text}`;
  quotesTerminalLogs.appendChild(line);
  quotesTerminalLogs.scrollTop = quotesTerminalLogs.scrollHeight;
  while (quotesTerminalLogs.children.length > 35) {
    quotesTerminalLogs.removeChild(quotesTerminalLogs.firstChild);
  }
}

function refreshQuotesConsoleUI() {
  const hasOpenTrades = window.currentOpenPositions && window.currentOpenPositions.length > 0;
  
  if (botActive) {
    if (hasOpenTrades) {
      // EXECUTED / IN TRADE
      if (quotesAvatarRing) quotesAvatarRing.className = "quotes-avatar-ring status-executed";
      if (quotesStatusPill) quotesStatusPill.className = "quotes-status-pill status-executed";
      if (quotesStatusText) quotesStatusText.innerText = `TRADE EXECUTED (${window.currentOpenPositions.length} ACTIVE)`;
      if (terminalStateBadge) {
        terminalStateBadge.className = "terminal-badge exec";
        terminalStateBadge.innerText = "IN TRADE";
      }
      if (floatingBotBubble) floatingBotBubble.className = "floating-bot-bubble status-executed";
      if (quotesPillToggleText) quotesPillToggleText.innerText = "STOP EA";
      if (quotesPillToggleIcon) quotesPillToggleIcon.setAttribute("data-lucide", "square");
      if (quotesPillToggle) quotesPillToggle.classList.add("is-running");

      if (lastLogState !== "executed") {
        appendQuotesLog(`⚡ Trade active: monitoring ${window.currentOpenPositions.length} position(s) with dynamic SL/TP...`, "t-exec");
        lastLogState = "executed";
      }
    } else {
      // SCANNING
      if (quotesAvatarRing) quotesAvatarRing.className = "quotes-avatar-ring status-scanning";
      if (quotesStatusPill) quotesStatusPill.className = "quotes-status-pill status-scanning";
      if (quotesStatusText) quotesStatusText.innerText = "SCANNING MARKETS";
      if (terminalStateBadge) {
        terminalStateBadge.className = "terminal-badge active";
        terminalStateBadge.innerText = "SCANNING";
      }
      if (floatingBotBubble) floatingBotBubble.className = "floating-bot-bubble status-scanning";
      if (quotesPillToggleText) quotesPillToggleText.innerText = "STOP EA";
      if (quotesPillToggleIcon) quotesPillToggleIcon.setAttribute("data-lucide", "square");
      if (quotesPillToggle) quotesPillToggle.classList.add("is-running");

      if (lastLogState !== "scanning") {
        appendQuotesLog("OmniShadow AI algorithm active. Scanning XAUUSD & Forex for high-probability setups...", "t-scan");
        lastLogState = "scanning";
      }
    }
  } else {
    // OFF / IDLE
    if (quotesAvatarRing) quotesAvatarRing.className = "quotes-avatar-ring status-off";
    if (quotesStatusPill) quotesStatusPill.className = "quotes-status-pill status-off";
    if (quotesStatusText) quotesStatusText.innerText = "ENGINE OFF";
    if (terminalStateBadge) {
      terminalStateBadge.className = "terminal-badge";
      terminalStateBadge.innerText = "IDLE";
    }
    if (floatingBotBubble) floatingBotBubble.className = "floating-bot-bubble status-off";
    if (quotesPillToggleText) quotesPillToggleText.innerText = "START EA";
    if (quotesPillToggleIcon) quotesPillToggleIcon.setAttribute("data-lucide", "play");
    if (quotesPillToggle) quotesPillToggle.classList.remove("is-running");

    if (lastLogState !== "off") {
      appendQuotesLog("Bot stopped — engine in standby.", "t-dim");
      lastLogState = "off";
    }
  }
  if (typeof lucide !== "undefined") lucide.createIcons();
}

// 2. VIP License Status Fetcher & UI Sync
function setAppUnlocked(unlocked) {
  const gate = document.getElementById("onboardingGate");
  const scrollContent = document.querySelector(".app-scroll-content");
  const navBar = document.querySelector(".app-bottom-nav") || document.querySelector(".mobile-nav-bar");

  if (unlocked) {
    if (gate) gate.style.display = "none";
    if (scrollContent) scrollContent.style.display = "flex";
    if (navBar) navBar.style.display = "flex";
  } else {
    if (gate) gate.style.display = "flex";
    if (scrollContent) scrollContent.style.display = "none";
    if (navBar) navBar.style.display = "none";
  }
}

async function fetchLicenseStatus() {
  try {
    const res = await fetch("/api/license/status");
    const data = await res.json();

    const onboardMt5AccountText = document.getElementById("onboardMt5AccountText");
    const onboardManualAccountRow = document.getElementById("onboardManualAccountRow");

    if (!data.connected) {
      if (modalMt5Account) modalMt5Account.innerText = "MT5 Standby (Open MT5 or enter below)";
      if (onboardMt5AccountText) onboardMt5AccountText.innerText = "MT5 Standby (Enter account below)";
      const manualRow = document.getElementById("manualAccountRow");
      if (manualRow) manualRow.style.display = "block";
      if (onboardManualAccountRow) onboardManualAccountRow.style.display = "block";
      if (licenseStatusStrip) {
        licenseStatusStrip.className = "license-status-strip none";
        licStatusText.innerText = "⚠️ MT5 STANDBY • CONNECT TERMINAL";
        stripActionBtn.innerText = "CONNECT";
      }

      if (sessionStorage.getItem("heist_preview") === "true") {
        setAppUnlocked(true);
      } else {
        setAppUnlocked(false);
      }
      return;
    }

    const manualRow = document.getElementById("manualAccountRow");
    if (manualRow) manualRow.style.display = "none";
    if (onboardManualAccountRow) onboardManualAccountRow.style.display = "none";

    if (modalMt5Account) {
      modalMt5Account.innerText = `#${data.account} (${data.broker || "Demo"})`;
    }
    if (onboardMt5AccountText) {
      onboardMt5AccountText.innerText = `#${data.account} (${data.broker || "Demo"})`;
    }

    const lic = data.license || {};
    clientLicense = lic;

    const isDeviceUnlocked = localStorage.getItem("money_heist_device_unlocked") === "true";
    const isPreview = sessionStorage.getItem("heist_preview") === "true";

    if (lic.valid) {
      if (isDeviceUnlocked || isPreview) {
        setAppUnlocked(true);
      } else {
        setAppUnlocked(false);
      }
      if (licenseStatusStrip) {
        licenseStatusStrip.className = "license-status-strip active";
        const daysText = lic.days_left === "Lifetime" ? "Lifetime VIP" : `${lic.days_left} Days Left`;
        licStatusText.innerHTML = `🟢 VIP ACTIVE • ${daysText} (#${lic.account})`;
        stripActionBtn.innerText = "DETAILS";
      }
      if (currentLicenseText) currentLicenseText.innerText = `${lic.key} (${lic.plan_name})`;
      if (currentLicenseBadge) {
        currentLicenseBadge.className = "badge-gold";
        currentLicenseBadge.innerText = "ACTIVE VIP";
      }
      if (boundAccountText) boundAccountText.innerText = `#${lic.account}`;
      if (licenseDaysLeftBadge) {
        licenseDaysLeftBadge.className = "badge";
        licenseDaysLeftBadge.innerText = lic.days_left === "Lifetime" ? "LIFETIME" : `${lic.days_left}d Left`;
      }
    } else if (lic.status === "EXPIRED") {
      if (sessionStorage.getItem("heist_preview") === "true") {
        setAppUnlocked(true);
      } else {
        setAppUnlocked(false);
      }
      if (licenseStatusStrip) {
        licenseStatusStrip.className = "license-status-strip expired";
        licStatusText.innerText = `🔴 VIP EXPIRED (#${lic.account || data.account}) • RENEW`;
        stripActionBtn.innerText = "RENEW";
      }
      if (currentLicenseBadge) {
        currentLicenseBadge.className = "badge-expired";
        currentLicenseBadge.innerText = "EXPIRED";
      }
    } else {
      if (sessionStorage.getItem("heist_preview") === "true") {
        setAppUnlocked(true);
      } else {
        setAppUnlocked(false);
      }
      if (licenseStatusStrip) {
        licenseStatusStrip.className = "license-status-strip none";
        licStatusText.innerText = `🔒 NO VIP LICENSE • ACCOUNT #${data.account}`;
        stripActionBtn.innerText = "ACTIVATE";
      }
      if (currentLicenseText) currentLicenseText.innerText = "No license activated yet";
      if (currentLicenseBadge) {
        currentLicenseBadge.className = "badge-expired";
        currentLicenseBadge.innerText = "INACTIVE";
      }
      if (boundAccountText) boundAccountText.innerText = `#${data.account}`;
      if (licenseDaysLeftBadge) {
        licenseDaysLeftBadge.className = "badge";
        licenseDaysLeftBadge.innerText = "0 Days";
      }
    }
  } catch (e) {
    console.error("Error fetching license status:", e);
  }
}

if (licenseStatusStrip) {
  licenseStatusStrip.onclick = () => {
    openLicenseModal();
  };
}

function openLicenseModal() {
  if (licenseFeedback) {
    licenseFeedback.style.display = "none";
    licenseFeedback.innerText = "";
  }
  licenseModal.classList.add("open");
  lucide.createIcons();
}

// 3. Bot Start/Stop Master Button (With License Gate)
if (mainStartStopBtn) {
  mainStartStopBtn.onclick = async () => {
    // If attempting to start, verify license first
    if (!botActive && (!clientLicense || !clientLicense.valid)) {
      openLicenseModal();
      if (licenseFeedback) {
        licenseFeedback.className = "exec-feedback error";
        licenseFeedback.innerHTML = "🔒 <strong>VIP License Required:</strong> You need an active license key to start automated trading.";
        licenseFeedback.style.display = "block";
      }
      return;
    }

    try {
      const res = await fetch("/api/bot/toggle", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        updateBotUI(data.enabled);
      } else {
        alert(data.detail || "Cannot start Money Heist EA.");
        openLicenseModal();
      }
    } catch (e) {
      alert("Error toggling Money Heist bot.");
    }
  };
}

function updateBotUI(enabled) {
  botActive = enabled;
  if (enabled) {
    mainStartStopBtn.className = "exact-pill-btn trade stop";
    mainStartStopText.innerText = "Stop";
    mainPlayIcon.setAttribute("data-lucide", "square");
    if (robotCardStatus) {
      robotCardStatus.className = "status-badge-on";
      robotCardStatus.innerText = "RUNNING";
    }
    if (floatingBotBubble) {
      floatingBotBubble.style.display = "flex";
    }
    if (window.AndroidApp && typeof window.AndroidApp.startFloatingBot === "function") {
      try {
        window.AndroidApp.startFloatingBot(window.location.origin);
      } catch (_) {}
    }
  } else {
    mainStartStopBtn.className = "exact-pill-btn trade start";
    mainStartStopText.innerText = "Trade";
    mainPlayIcon.setAttribute("data-lucide", "play");
    if (robotCardStatus) {
      robotCardStatus.className = "status-badge-off";
      robotCardStatus.innerText = "IDLE";
    }
    if (floatingBotBubble) {
      floatingBotBubble.style.display = "none";
    }
    if (window.AndroidApp && typeof window.AndroidApp.stopFloatingBot === "function") {
      try {
        window.AndroidApp.stopFloatingBot();
      } catch (_) {}
    }
  }
  refreshQuotesConsoleUI();
  lucide.createIcons();
}

// 3. Bot Status & Logs Polling
async function fetchBotStatus() {
  try {
    const res = await fetch("/api/bot/status");
    const data = await res.json();
    updateBotUI(data.enabled);

    if (settingsLotInput && !document.activeElement.isSameNode(settingsLotInput)) {
      settingsLotInput.value = data.lot_size || 0.01;
    }
    if (settingsMaxTradesInput && !document.activeElement.isSameNode(settingsMaxTradesInput)) {
      settingsMaxTradesInput.value = data.max_trades || 2;
    }

    // Render Logs
    if (botLogsContainer && data.logs) {
      botLogsContainer.innerHTML = data.logs.map(log => `
        <div class="log-row ${log.level}">
          <span class="log-time">[${log.timestamp}]</span>
          <span>${log.message}</span>
        </div>
      `).join("");
    }
  } catch (e) {}
}

const clearBotLogsBtn = document.getElementById("clearBotLogsBtn");
if (clearBotLogsBtn) {
  clearBotLogsBtn.onclick = async () => {
    await fetch("/api/bot/clear-logs", { method: "POST" });
    fetchBotStatus();
  };
}

// 4. MT5 Account Telemetry
async function fetchMT5Telemetry() {
  try {
    const res = await fetch("/api/mt5/status");
    const data = await res.json();
    if (data.connected) {
      mt5Connected = true;
      mt5Pill.className = "mt5-pill-mobile";
      mt5PillText.innerText = `#${data.login} ($${data.balance})`;

      if (mtAccountServer) mtAccountServer.innerText = `Broker: ${data.server}`;
      if (mtBalanceVal) mtBalanceVal.innerText = `$${data.balance}`;
      if (mtEquityVal) mtEquityVal.innerText = `$${data.equity}`;
      if (mtLoginVal) mtLoginVal.innerText = `#${data.login}`;

      const pColor = data.profit >= 0 ? "text-green" : "text-red";
      if (mtProfitVal) {
        mtProfitVal.innerText = `${data.profit >= 0 ? '+' : ''}$${data.profit}`;
        mtProfitVal.className = `m-val ${pColor}`;
      }

      const drawerMt5Login = document.getElementById("drawerMt5Login");
      const drawerMt5Balance = document.getElementById("drawerMt5Balance");
      const drawerMt5Equity = document.getElementById("drawerMt5Equity");
      const drawerMt5Server = document.getElementById("drawerMt5Server");
      if (drawerMt5Login) drawerMt5Login.innerText = `#${data.login}`;
      if (drawerMt5Balance) drawerMt5Balance.innerText = `$${data.balance}`;
      if (drawerMt5Equity) drawerMt5Equity.innerText = `$${data.equity}`;
      if (drawerMt5Server) drawerMt5Server.innerText = data.server || "MetaQuotes-Demo";

      fetchMT5Positions();
    } else {
      mt5Connected = false;
      mt5PillText.innerText = "MT5 Standby";
    }
  } catch (e) {
    mt5PillText.innerText = "MT5 Offline";
  }
}

async function fetchMT5Positions() {
  try {
    const res = await fetch("/api/mt5/positions");
    const positions = await res.json();
    window.currentOpenPositions = Array.isArray(positions) ? positions : [];
    refreshQuotesConsoleUI();

    if (!mobilePositionsList) return;

    if (positions.length === 0) {
      mobilePositionsList.innerHTML = `
        <div class="empty-trades-card">
          <i data-lucide="check-circle-2"></i>
          <p>No active positions open. Money Heist Bot is scanning for setups.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    mobilePositionsList.innerHTML = positions.map(p => {
      const pColor = p.profit >= 0 ? "text-green" : "text-red";
      return `
        <div class="mobile-position-item">
          <div>
            <div style="font-weight:800;font-size:13px;color:#fff;">${p.symbol} (${p.type} ${p.volume})</div>
            <div style="font-size:10px;color:var(--text-dim);font-family:var(--font-mono);">Open: ${p.open_price} • Now: ${p.current_price}</div>
          </div>
          <div style="text-align:right;">
            <div class="${pColor}" style="font-weight:800;font-family:var(--font-mono);font-size:13px;">${p.profit >= 0 ? '+' : ''}$${p.profit}</div>
            <button class="text-btn text-red" style="font-size:11px;font-weight:700;" onclick="closePosition(${p.ticket})">CLOSE</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (e) {}
}

window.closePosition = async function(ticket) {
  if (!confirm(`Close position #${ticket}?`)) return;
  try {
    const res = await fetch(`/api/mt5/close/${ticket}`, { method: "POST" });
    if (res.ok) {
      fetchMT5Positions();
      fetchMT5Telemetry();
    }
  } catch (e) {}
};

if (refreshPositionsBtnMobile) {
  refreshPositionsBtnMobile.onclick = () => {
    fetchMT5Telemetry();
    fetchMT5Positions();
  };
}

// ============================================================
// MT5 / MT4 ACCOUNT LINK CONTROLLER (Exact from Reference)
// ============================================================
const tabSelectMT5 = document.getElementById("tabSelectMT5");
const tabSelectMT4 = document.getElementById("tabSelectMT4");
const mtTabIndicatorLine = document.getElementById("mtTabIndicatorLine");
const mtPlatformTitle = document.getElementById("mtPlatformTitle");
const mtLinkBtnText = document.getElementById("mtLinkBtnText");
const mtLinkSubmitBtn = document.getElementById("mtLinkSubmitBtn");
const mtLinkLogin = document.getElementById("mtLinkLogin");
const mtLinkPassword = document.getElementById("mtLinkPassword");
const mtLinkServer = document.getElementById("mtLinkServer");
const mtLinkFeedback = document.getElementById("mtLinkFeedback");

let selectedMTPlatform = "MT5";

if (tabSelectMT5 && tabSelectMT4) {
  tabSelectMT5.onclick = () => {
    selectedMTPlatform = "MT5";
    tabSelectMT5.classList.add("active");
    tabSelectMT4.classList.remove("active");
    if (mtTabIndicatorLine) mtTabIndicatorLine.style.transform = "translateX(0)";
    if (mtPlatformTitle) mtPlatformTitle.innerText = "MT5 LOGIN DETAILS";
    if (mtLinkBtnText) mtLinkBtnText.innerText = "LINK MT5 ACCOUNT DETAILS";
  };

  tabSelectMT4.onclick = () => {
    selectedMTPlatform = "MT4";
    tabSelectMT4.classList.add("active");
    tabSelectMT5.classList.remove("active");
    if (mtTabIndicatorLine) mtTabIndicatorLine.style.transform = "translateX(100%)";
    if (mtPlatformTitle) mtPlatformTitle.innerText = "MT4 LOGIN DETAILS";
    if (mtLinkBtnText) mtLinkBtnText.innerText = "LINK MT4 ACCOUNT DETAILS";
  };
}

if (mtLinkSubmitBtn) {
  mtLinkSubmitBtn.onclick = async () => {
    const login = mtLinkLogin ? mtLinkLogin.value.trim() : "";
    const password = mtLinkPassword ? mtLinkPassword.value.trim() : "";
    const server = mtLinkServer ? mtLinkServer.value.trim() : "";

    if (!login || !password || !server) {
      if (mtLinkFeedback) {
        mtLinkFeedback.className = "exec-feedback error";
        mtLinkFeedback.innerHTML = "⚠️ Please fill in Login, Password, and Broker Server name.";
        mtLinkFeedback.style.display = "block";
      }
      return;
    }

    if (mtLinkFeedback) mtLinkFeedback.style.display = "none";
    if (mtLinkBtnText) mtLinkBtnText.innerText = "CONNECTING TO BROKER...";
    mtLinkSubmitBtn.disabled = true;

    try {
      const res = await fetch("/api/mt5/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedMTPlatform,
          login: parseInt(login),
          password: password,
          server: server
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (mtLinkFeedback) {
          mtLinkFeedback.className = "exec-feedback success";
          mtLinkFeedback.innerHTML = `✅ <strong>LINKED!</strong> Connected to #${data.login} on ${data.server} (Balance: $${data.balance}).`;
          mtLinkFeedback.style.display = "block";
        }
        playChime();
        await fetchMT5Telemetry();
        await fetchLicenseStatus();
      } else {
        if (mtLinkFeedback) {
          mtLinkFeedback.className = "exec-feedback error";
          mtLinkFeedback.innerHTML = `❌ ${data.detail || data.error || "Failed to link account"}`;
          mtLinkFeedback.style.display = "block";
        }
      }
    } catch (e) {
      if (mtLinkFeedback) {
        mtLinkFeedback.className = "exec-feedback error";
        mtLinkFeedback.innerHTML = `❌ Connection error: ${e.message || "Failed to reach server"}`;
        mtLinkFeedback.style.display = "block";
      }
    } finally {
      mtLinkSubmitBtn.disabled = false;
      if (mtLinkBtnText) mtLinkBtnText.innerText = `LINK ${selectedMTPlatform} ACCOUNT DETAILS`;
    }
  };
}

// Audio chime helper
function playChime() {
  try {
    const chime = document.getElementById("alertChime");
    if (chime) {
      chime.currentTime = 0;
      chime.play().catch(() => {});
    }
  } catch (e) {}
}

// ============================================================
// 5. AI CHART SCREENSHOT SCANNER CONTROLLER (EA CONVERTER STYLE)
// ============================================================
const csDropZone = document.getElementById("csDropZone");
const csFileInput = document.getElementById("csFileInput");
const csDropPrompt = document.getElementById("csDropPrompt");
const csPreviewWrap = document.getElementById("csPreviewWrap");
const csPreviewImg = document.getElementById("csPreviewImg");
const csRemoveImgBtn = document.getElementById("csRemoveImgBtn");
const scannerSymbolInput = document.getElementById("scannerSymbolInput");
const resetScannerBtn = document.getElementById("resetScannerBtn");

const csAnalyzingCard = document.getElementById("csAnalyzingCard");
const chkCandles = document.getElementById("chkCandles");
const chkStructure = document.getElementById("chkStructure");
const chkLevels = document.getElementById("chkLevels");
const chkSignal = document.getElementById("chkSignal");

const csResultCard = document.getElementById("csResultCard");
const csTimerText = document.getElementById("csTimerText");
const csSummaryText = document.getElementById("csSummaryText");
const csBarBull = document.getElementById("csBarBull");
const csBarBear = document.getElementById("csBarBear");
const csLabelBull = document.getElementById("csLabelBull");
const csLabelBear = document.getElementById("csLabelBear");
const csMetricBias = document.getElementById("csMetricBias");
const csMetricStructure = document.getElementById("csMetricStructure");
const csMetricVolatility = document.getElementById("csMetricVolatility");
const csMetricMomentum = document.getElementById("csMetricMomentum");
const csAutoSymbol = document.getElementById("csAutoSymbol");
const csAutoSLTP = document.getElementById("csAutoSLTP");
const csConfirmTradeBtn = document.getElementById("csConfirmTradeBtn");
const csTradeActionIcon = document.getElementById("csTradeActionIcon");
const csTradeActionText = document.getElementById("csTradeActionText");

// Confirmation Modal
const csConfirmModal = document.getElementById("csConfirmModal");
const csConfirmModalCloseBtn = document.getElementById("csConfirmModalCloseBtn");
const csCancelBtn = document.getElementById("csCancelBtn");
const csDialogBanner = document.getElementById("csDialogBanner");
const csDialogBannerText = document.getElementById("csDialogBannerText");
const csDialogIcon = document.getElementById("csDialogIcon");
const csExecSymbol = document.getElementById("csExecSymbol");
const csExecLot = document.getElementById("csExecLot");
const csExecTrades = document.getElementById("csExecTrades");
const csExecuteBtn = document.getElementById("csExecuteBtn");
const csExecuteBtnText = document.getElementById("csExecuteBtnText");
const csExecFeedback = document.getElementById("csExecFeedback");

let currentChartAnalysis = null;
let csTimerInterval = null;
let currentSelectedFile = null;

if (csDropZone && csFileInput) {
  csDropZone.onclick = (e) => {
    if (e.target.closest("#csRemoveImgBtn")) {
      e.preventDefault();
      e.stopPropagation();
      resetScanner();
      return;
    }
  };

  csDropZone.ondragover = (e) => {
    e.preventDefault();
    csDropZone.classList.add("dragover");
  };

  csDropZone.ondragleave = () => {
    csDropZone.classList.remove("dragover");
  };

  csDropZone.ondrop = (e) => {
    e.preventDefault();
    csDropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleChartFile(e.dataTransfer.files[0]);
    }
  };

  csFileInput.onchange = () => {
    if (csFileInput.files && csFileInput.files[0]) {
      handleChartFile(csFileInput.files[0]);
    }
  };
}

if (csRemoveImgBtn) {
  csRemoveImgBtn.onclick = (e) => {
    e.stopPropagation();
    resetScanner();
  };
}

if (resetScannerBtn) {
  resetScannerBtn.onclick = () => resetScanner();
}

function resetScanner() {
  currentSelectedFile = null;
  currentChartAnalysis = null;
  if (csFileInput) csFileInput.value = "";
  if (csPreviewWrap) csPreviewWrap.style.display = "none";
  if (csDropPrompt) csDropPrompt.style.display = "flex";
  if (csAnalyzingCard) csAnalyzingCard.style.display = "none";
  if (csResultCard) csResultCard.style.display = "none";
  if (csTimerInterval) clearInterval(csTimerInterval);
}

function handleChartFile(file) {
  currentSelectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (csPreviewImg) csPreviewImg.src = e.target.result;
    if (csDropPrompt) csDropPrompt.style.display = "none";
    if (csPreviewWrap) csPreviewWrap.style.display = "block";
    startAnalysisPipeline(file);
  };
  reader.readAsDataURL(file);
}

async function startAnalysisPipeline(file) {
  if (!csAnalyzingCard) return;

  if (csResultCard) csResultCard.style.display = "none";
  csAnalyzingCard.style.display = "block";

  [chkCandles, chkStructure, chkLevels, chkSignal].forEach(el => {
    if (el) el.classList.remove("done");
  });

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  await delay(350);
  if (chkCandles) chkCandles.classList.add("done");
  await delay(350);
  if (chkStructure) chkStructure.classList.add("done");
  await delay(350);
  if (chkLevels) chkLevels.classList.add("done");
  await delay(350);
  if (chkSignal) chkSignal.classList.add("done");

  try {
    const symbol = scannerSymbolInput ? scannerSymbolInput.value.trim() : "XAUUSD";
    const formData = new FormData();
    formData.append("chart_image", file);
    formData.append("symbol", symbol);

    const res = await fetch("/api/scanner/analyze-chart", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Analysis failed");
    const data = await res.json();
    currentChartAnalysis = data;

    await delay(300);
    csAnalyzingCard.style.display = "none";
    displayAnalysisResult(data);
  } catch (err) {
    console.error("Scanner error:", err);
    csAnalyzingCard.style.display = "none";
    alert("Could not analyze chart screenshot. Please ensure it is a valid image.");
  }
}

function displayAnalysisResult(data) {
  if (!csResultCard) return;

  if (csSummaryText) csSummaryText.innerText = data.summary;

  if (csBarBull) csBarBull.style.width = `${data.bullish_pct}%`;
  if (csBarBear) csBarBear.style.width = `${data.bearish_pct}%`;
  if (csLabelBull) csLabelBull.innerText = `${data.bullish_pct}% bullish`;
  if (csLabelBear) csLabelBear.innerText = `${data.bearish_pct}% bearish`;

  if (csMetricBias) {
    csMetricBias.innerText = data.bias;
    csMetricBias.className = `cs-m-val ${data.bias === "Bullish" ? "cyan" : "red"}`;
  }
  if (csMetricStructure) {
    csMetricStructure.innerText = data.structure;
    csMetricStructure.className = `cs-m-val ${data.structure === "Uptrend" ? "cyan" : "red"}`;
  }
  if (csMetricVolatility) {
    csMetricVolatility.innerText = data.volatility;
    csMetricVolatility.className = "cs-m-val gold";
  }
  if (csMetricMomentum) {
    csMetricMomentum.innerText = data.momentum;
    csMetricMomentum.className = `cs-m-val ${data.momentum === "Strong" ? "green" : "red"}`;
  }

  if (csAutoSymbol) csAutoSymbol.innerText = data.symbol;
  if (csAutoSLTP) csAutoSLTP.innerText = `${data.sl_pips} pips / ${data.tp_pips} pips`;

  if (csConfirmTradeBtn) {
    const isSell = data.action === "SELL";
    csConfirmTradeBtn.className = `cs-confirm-trade-btn ${isSell ? 'sell' : 'buy'}`;
    if (csTradeActionText) csTradeActionText.innerText = `CONFIRM ${data.action} TRADE`;
    if (csTradeActionIcon) {
      csTradeActionIcon.setAttribute("data-lucide", isSell ? "trending-down" : "trending-up");
    }
  }

  if (csTimerInterval) clearInterval(csTimerInterval);
  let timeLeft = data.fresh_seconds || 900;
  const updateTimer = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    if (csTimerText) csTimerText.innerText = `SIGNAL FRESH FOR ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (timeLeft <= 0) {
      clearInterval(csTimerInterval);
    }
    timeLeft--;
  };
  updateTimer();
  csTimerInterval = setInterval(updateTimer, 1000);

  csResultCard.style.display = "flex";
  lucide.createIcons();
}

if (csConfirmTradeBtn) {
  csConfirmTradeBtn.onclick = () => {
    if (!currentChartAnalysis) return;

    const data = currentChartAnalysis;
    const isSell = data.action === "SELL";

    if (csDialogBanner) {
      csDialogBanner.className = `cs-dialog-banner ${isSell ? 'sell' : 'buy'}`;
    }
    if (csDialogBannerText) {
      csDialogBannerText.innerText = `${data.action} • ${data.confidence >= 70 ? 'STRONG' : 'MODERATE'} • ${data.confidence}% CONF`;
    }
    if (csDialogIcon) {
      csDialogIcon.setAttribute("data-lucide", isSell ? "trending-down" : "trending-up");
    }

    if (csExecSymbol) csExecSymbol.value = data.symbol;
    if (csExecFeedback) csExecFeedback.style.display = "none";

    if (csConfirmModal) csConfirmModal.classList.add("open");
    lucide.createIcons();
  };
}

if (csConfirmModalCloseBtn) {
  csConfirmModalCloseBtn.onclick = () => csConfirmModal.classList.remove("open");
}
if (csCancelBtn) {
  csCancelBtn.onclick = () => csConfirmModal.classList.remove("open");
}

if (csExecuteBtn) {
  csExecuteBtn.onclick = async () => {
    if (!currentChartAnalysis) return;

    const symbol = csExecSymbol ? csExecSymbol.value.trim().toUpperCase() : currentChartAnalysis.symbol;
    const lot = parseFloat(csExecLot ? csExecLot.value : 0.01) || 0.01;
    const trades = parseInt(csExecTrades ? csExecTrades.value : 1) || 1;
    const action = currentChartAnalysis.action;

    csExecuteBtn.disabled = true;
    if (csExecuteBtnText) csExecuteBtnText.innerText = "EXECUTING...";
    if (csExecFeedback) csExecFeedback.style.display = "none";

    try {
      const res = await fetch("/api/scanner/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol,
          action: action,
          lot_size: lot,
          number_of_trades: trades,
          sl_pips: currentChartAnalysis.sl_pips,
          tp_pips: currentChartAnalysis.tp_pips
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        if (csExecFeedback) {
          csExecFeedback.className = "exec-feedback success";
          csExecFeedback.innerHTML = `⚡ <strong>SENT TO MT5!</strong> Executed ${result.executed}x ${action} on ${symbol}.`;
          csExecFeedback.style.display = "block";
        }
        playChime();
        await fetchBotStatus();
        await fetchMT5Telemetry();
        setTimeout(() => {
          if (csConfirmModal) csConfirmModal.classList.remove("open");
        }, 1800);
      } else {
        if (csExecFeedback) {
          csExecFeedback.className = "exec-feedback error";
          csExecFeedback.innerHTML = `❌ Execution failed: ${result.detail || "Check MT5 connection"}`;
          csExecFeedback.style.display = "block";
        }
      }
    } catch (e) {
      if (csExecFeedback) {
        csExecFeedback.className = "exec-feedback error";
        csExecFeedback.innerHTML = `❌ Error: ${e.message}`;
        csExecFeedback.style.display = "block";
      }
    } finally {
      csExecuteBtn.disabled = false;
      if (csExecuteBtnText) csExecuteBtnText.innerText = "EXECUTE";
    }
  };
}

// 6. Inspect Modal
window.openInspectModal = function(symbol) {
  const item = scanData.find(d => d.symbol === symbol);
  if (!item) return;

  currentModalSymbol = symbol;
  inspectSymbol.innerText = item.symbol;
  inspectBadge.innerText = item.buy_signal ? "BUY" : (item.sell_signal ? "SELL" : "WATCHING");
  inspectBadge.className = item.buy_signal ? "status-badge-on" : (item.sell_signal ? "news-indicator" : "status-badge-off");

  inspectEntry.innerText = item.close;
  inspectSL.innerText = item.stop_loss || "--";
  inspectTP1.innerText = item.tp1 || "--";
  inspectRR.innerText = item.rr_tp1 > 0 ? `1:${item.rr_tp1}` : "--";

  if (mobileExecFeedback) mobileExecFeedback.style.display = "none";

  renderTradingViewWidgetMobile(symbol);
  inspectModal.classList.add("open");
  lucide.createIcons();
};

function renderTradingViewWidgetMobile(symbol) {
  const container = document.getElementById("tradingview_widget_mobile");
  container.innerHTML = "";

  let tvSymbol = symbol;
  if (symbol === "XAUUSD") tvSymbol = "OANDA:XAUUSD";
  else if (symbol === "GBPUSD") tvSymbol = "FX:GBPUSD";
  else if (symbol === "EURUSD") tvSymbol = "FX:EURUSD";
  else if (symbol === "USDJPY") tvSymbol = "FX:USDJPY";
  else if (symbol === "BTCUSD") tvSymbol = "BINANCE:BTCUSDT";

  const script = document.createElement("script");
  script.src = "https://s3.tradingview.com/tv.js";
  script.async = true;
  script.onload = () => {
    if (typeof TradingView !== "undefined") {
      new TradingView.widget({
        width: "100%",
        height: 250,
        symbol: tvSymbol,
        interval: currentTf === "1d" ? "D" : currentTf.replace("m", ""),
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#08090d",
        enable_publishing: false,
        hide_top_toolbar: true,
        save_image: false,
        container_id: "tradingview_widget_mobile"
      });
    }
  };
  container.appendChild(script);
}

// Mobile Execution Buttons
if (mobileExecBuyBtn) {
  mobileExecBuyBtn.onclick = () => executeMobileTrade("BUY");
}
if (mobileExecSellBtn) {
  mobileExecSellBtn.onclick = () => executeMobileTrade("SELL");
}

async function executeMobileTrade(action) {
  const item = scanData.find(d => d.symbol === currentModalSymbol);
  const lot = parseFloat(settingsLotInput ? settingsLotInput.value : 0.01) || 0.01;
  const sl = item ? item.stop_loss : null;
  const tp = item ? item.tp1 : null;

  mobileExecFeedback.style.display = "none";

  try {
    const res = await fetch("/api/mt5/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: currentModalSymbol,
        action: action,
        lot: lot,
        sl: sl,
        tp: tp,
        comment: "Money Heist EA"
      })
    });

    const data = await res.json();
    if (res.ok) {
      mobileExecFeedback.className = "exec-feedback success";
      mobileExecFeedback.innerHTML = `✅ <strong>FILLED!</strong> #${data.deal_id || data.order_id} @ ${data.price}`;
      mobileExecFeedback.style.display = "block";
      fetchMT5Telemetry();
    } else {
      mobileExecFeedback.className = "exec-feedback error";
      mobileExecFeedback.innerHTML = `❌ ${data.detail || "Trade rejected"}`;
      mobileExecFeedback.style.display = "block";
    }
  } catch (e) {
    mobileExecFeedback.className = "exec-feedback error";
    mobileExecFeedback.innerHTML = `❌ Connection error`;
    mobileExecFeedback.style.display = "block";
  }
}

if (inspectModalCloseBtn) {
  inspectModalCloseBtn.onclick = () => inspectModal.classList.remove("open");
}

// 7. License Modal & Client Activation
if (addNewRobotBtn) {
  addNewRobotBtn.onclick = () => openLicenseModal();
}
if (addKeyBtnSettings) {
  addKeyBtnSettings.onclick = () => openLicenseModal();
}
if (licenseModalCloseBtn) {
  licenseModalCloseBtn.onclick = () => licenseModal.classList.remove("open");
}

// Quick Paste Button in License Modal
if (pasteKeyBtn && licenseKeyInput) {
  pasteKeyBtn.onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        licenseKeyInput.value = text.trim().toUpperCase();
      }
    } catch (e) {
      // Fallback
      licenseKeyInput.focus();
    }
  };
}

// Quick Demo Key Tags
document.querySelectorAll(".key-tag").forEach(tag => {
  tag.onclick = () => {
    const key = tag.getAttribute("data-key");
    if (key && licenseKeyInput) {
      licenseKeyInput.value = key;
    }
  };
});

if (activateLicenseBtn) {
  activateLicenseBtn.onclick = async () => {
    const key = licenseKeyInput.value.trim().toUpperCase();
    const manualAcc = document.getElementById("manualAccountInput")?.value?.trim() || "";
    if (!key) {
      alert("Please enter a VIP license key.");
      return;
    }

    licenseFeedback.style.display = "none";
    activateLicenseBtn.innerText = "Activating VIP...";
    activateLicenseBtn.disabled = true;

    try {
      const payload = { key: key };
      if (manualAcc) {
        payload.account_number = manualAcc;
      }

      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (res.ok) {
        licenseFeedback.className = "exec-feedback success";
        licenseFeedback.innerHTML = `🎉 <strong>SUCCESS!</strong> ${data.message || "VIP License Activated!"}`;
        licenseFeedback.style.display = "block";
        localStorage.setItem("money_heist_device_unlocked", "true");
        localStorage.setItem("money_heist_device_key", key);
        await fetchLicenseStatus();
        await fetchBotStatus();
        setTimeout(() => {
          licenseModal.classList.remove("open");
        }, 1800);
      } else {
        licenseFeedback.className = "exec-feedback error";
        licenseFeedback.innerHTML = `❌ ${data.detail || data.error || "Activation failed."}`;
        licenseFeedback.style.display = "block";
      }
    } catch (e) {
      licenseFeedback.className = "exec-feedback error";
      licenseFeedback.innerHTML = `❌ Connection error activating license: ${e.message || "Please ensure server is running."}`;
      licenseFeedback.style.display = "block";
    } finally {
      activateLicenseBtn.innerText = "Activate Robot VIP";
      activateLicenseBtn.disabled = false;
    }
  };
}

// ============================================================
// ONBOARDING GATE INTRO CONTROLLER
// ============================================================
const onboardAddRobotCard = document.getElementById("onboardAddRobotCard");
const onboardKeyInput = document.getElementById("onboardKeyInput");
const onboardPasteBtn = document.getElementById("onboardPasteBtn");
const onboardActivateBtn = document.getElementById("onboardActivateBtn");
const onboardFeedback = document.getElementById("onboardFeedback");
const onboardPreviewBtn = document.getElementById("onboardPreviewBtn");
const removeBotBtn = document.getElementById("removeBotBtn");

if (onboardAddRobotCard && onboardKeyInput) {
  onboardAddRobotCard.onclick = () => {
    onboardKeyInput.focus();
    onboardKeyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
}

if (onboardPasteBtn && onboardKeyInput) {
  onboardPasteBtn.onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onboardKeyInput.value = text.trim().toUpperCase();
    } catch (_) {
      onboardKeyInput.focus();
    }
  };
}

document.querySelectorAll(".onboard-demo-tag").forEach(tag => {
  tag.onclick = () => {
    const key = tag.getAttribute("data-key");
    if (key && onboardKeyInput) {
      onboardKeyInput.value = key;
    }
  };
});

if (onboardPreviewBtn) {
  onboardPreviewBtn.onclick = () => {
    sessionStorage.setItem("heist_preview", "true");
    setAppUnlocked(true);
  };
}

if (removeBotBtn) {
  removeBotBtn.onclick = () => {
    if (confirm("Lock Money Heist EA back to onboarding gate?")) {
      localStorage.removeItem("money_heist_device_unlocked");
      localStorage.removeItem("money_heist_device_key");
      sessionStorage.removeItem("heist_preview");
      setAppUnlocked(false);
    }
  };
}

if (onboardActivateBtn) {
  onboardActivateBtn.onclick = async () => {
    const key = onboardKeyInput ? onboardKeyInput.value.trim().toUpperCase() : "";
    const manualAcc = document.getElementById("onboardManualAccountInput")?.value?.trim() || "";

    if (!key) {
      if (onboardFeedback) {
        onboardFeedback.className = "exec-feedback error";
        onboardFeedback.innerHTML = "⚠️ Please enter a VIP license key.";
        onboardFeedback.style.display = "block";
      }
      return;
    }

    if (onboardFeedback) onboardFeedback.style.display = "none";
    onboardActivateBtn.innerText = "Activating Robot...";
    onboardActivateBtn.disabled = true;

    try {
      const payload = { key: key };
      if (manualAcc) {
        payload.account_number = manualAcc;
      }

      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (res.ok) {
        if (onboardFeedback) {
          onboardFeedback.className = "exec-feedback success";
          onboardFeedback.innerHTML = `🎉 <strong>ACTIVATED!</strong> ${data.message || "VIP License Activated!"}`;
          onboardFeedback.style.display = "block";
        }
        playChime();
        localStorage.setItem("money_heist_device_unlocked", "true");
        localStorage.setItem("money_heist_device_key", key);
        sessionStorage.removeItem("heist_preview");
        await fetchLicenseStatus();
        await fetchRobots();
        await fetchBotStatus();
        await fetchMT5Telemetry();
        setTimeout(() => {
          setAppUnlocked(true);
        }, 1200);
      } else {
        if (onboardFeedback) {
          onboardFeedback.className = "exec-feedback error";
          onboardFeedback.innerHTML = `❌ ${data.detail || data.error || "Activation failed."}`;
          onboardFeedback.style.display = "block";
        }
      }
    } catch (e) {
      if (onboardFeedback) {
        onboardFeedback.className = "exec-feedback error";
        onboardFeedback.innerHTML = `❌ Connection error activating license: ${e.message || "Please ensure server is running."}`;
        onboardFeedback.style.display = "block";
      }
    } finally {
      onboardActivateBtn.innerHTML = `<i data-lucide="zap" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px;"></i> ACTIVATE ROBOT VIP`;
      onboardActivateBtn.disabled = false;
      lucide.createIcons();
    }
  };
}

// 8. Save Settings
if (settingsLotInput && settingsMaxTradesInput) {
  const saveSettings = async () => {
    const lot = parseFloat(settingsLotInput.value) || 0.01;
    const maxT = parseInt(settingsMaxTradesInput.value) || 2;
    await fetch("/api/bot/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lot_size: lot, max_trades: maxT, timeframe: currentTf })
    });
  };
  settingsLotInput.onchange = saveSettings;
  settingsMaxTradesInput.onchange = saveSettings;
}

// ============================================================
// 10. MULTI-ROBOT ENGINE & STRATEGY PRESETS (STEP 3)
// ============================================================
const dynamicRobotList = document.getElementById("dynamicRobotList");
const activeRobotsCount = document.getElementById("activeRobotsCount");
const heroCreatorTitle = document.getElementById("heroCreatorTitle");
const heroRobotName = document.getElementById("heroRobotName");

const robotConfigModal = document.getElementById("robotConfigModal");
const robotConfigModalCloseBtn = document.getElementById("robotConfigModalCloseBtn");
const configRobotName = document.getElementById("configRobotName");
const configRobotTagline = document.getElementById("configRobotTagline");
const configRobotSymbols = document.getElementById("configRobotSymbols");
const configRiskModeSelect = document.getElementById("configRiskModeSelect");
const configLotInput = document.getElementById("configLotInput");
const configAutoLotCheck = document.getElementById("configAutoLotCheck");
const configMinRRInput = document.getElementById("configMinRRInput");
const configTpTargetSelect = document.getElementById("configTpTargetSelect");
const saveRobotConfigBtn = document.getElementById("saveRobotConfigBtn");
const robotConfigFeedback = document.getElementById("robotConfigFeedback");

let robotsList = [];
let selectedHeroRobotId = "money_heist_ea";
let activeConfigRobotId = null;

async function fetchRobots() {
  try {
    const res = await fetch("/api/robots");
    if (!res.ok) return;
    const data = await res.json();
    robotsList = data.robots || [];

    if (activeRobotsCount) {
      activeRobotsCount.innerText = `${data.active_count || 0} ACTIVE`;
    }

    renderRobotsList();
  } catch (e) {
    console.error("Error fetching robots:", e);
  }
}

function renderRobotsList() {
  if (!dynamicRobotList) return;
  dynamicRobotList.innerHTML = "";

  robotsList.forEach(rob => {
    const isSelected = rob.id === selectedHeroRobotId;
    const isEnabled = rob.enabled;

    const card = document.createElement("div");
    card.className = `robot-item-card ${isSelected ? "selected-view" : ""} ${isEnabled ? "active" : ""}`;

    const symbolsText = rob.symbols.join(", ");

    card.innerHTML = `
      <div class="robot-item-avatar">
        <img src="${rob.avatar || '/static/money_heist.jpg'}" alt="${rob.name}">
      </div>
      <div class="robot-item-info">
        <h4>${rob.name}</h4>
        <p>${rob.tagline || symbolsText}</p>
      </div>
      <div class="robot-item-actions">
        <button class="robot-toggle-pill ${isEnabled ? 'on' : 'off'}" data-id="${rob.id}" title="Toggle robot automated execution">
          ${isEnabled ? 'ON' : 'OFF'}
        </button>
        <button class="robot-info-btn" data-id="${rob.id}" title="Configure strategy & risk presets">
          <i data-lucide="sliders" style="width:13px;height:13px;"></i>
        </button>
      </div>
    `;

    // Click card body to select as hero view
    card.querySelector(".robot-item-info").onclick = () => selectHeroRobot(rob);
    card.querySelector(".robot-item-avatar").onclick = () => selectHeroRobot(rob);

    // Toggle button listener
    const toggleBtn = card.querySelector(".robot-toggle-pill");
    toggleBtn.onclick = async (e) => {
      e.stopPropagation();
      await toggleRobot(rob.id);
    };

    // Config info button listener
    const infoBtn = card.querySelector(".robot-info-btn");
    infoBtn.onclick = (e) => {
      e.stopPropagation();
      openRobotConfigModal(rob);
    };

    dynamicRobotList.appendChild(card);
  });

  lucide.createIcons();
}

function selectHeroRobot(rob) {
  selectedHeroRobotId = rob.id;
  if (heroCreatorTitle) heroCreatorTitle.innerText = rob.creator || "EL PROFESOR";
  if (heroRobotName) heroRobotName.innerText = rob.name || "Money Heist EA";
  renderRobotsList();
}

async function toggleRobot(robotId) {
  try {
    const res = await fetch(`/api/robots/${robotId}/toggle`, { method: "POST" });
    if (res.ok) {
      await fetchRobots();
      await fetchBotStatus();
    }
  } catch (e) {
    console.error("Error toggling robot:", e);
  }
}

function openRobotConfigModal(rob) {
  activeConfigRobotId = rob.id;
  if (configRobotName) configRobotName.innerText = rob.name;
  if (configRobotTagline) configRobotTagline.innerText = rob.tagline || "OmniShadow AI Engine";
  if (configRobotSymbols) configRobotSymbols.innerText = `Pairs: ${rob.symbols.join(', ')}`;

  if (configRiskModeSelect) configRiskModeSelect.value = rob.risk_mode || "STANDARD";
  if (configLotInput) configLotInput.value = rob.lot_size || 0.01;
  if (configAutoLotCheck) configAutoLotCheck.checked = !!rob.auto_lot;
  if (configMinRRInput) configMinRRInput.value = rob.min_rr || 1.3;
  if (configTpTargetSelect) configTpTargetSelect.value = rob.tp_target || "TP1";

  if (robotConfigFeedback) robotConfigFeedback.style.display = "none";
  robotConfigModal.classList.add("open");
  lucide.createIcons();
}

if (robotConfigModalCloseBtn) {
  robotConfigModalCloseBtn.onclick = () => robotConfigModal.classList.remove("open");
}

if (saveRobotConfigBtn) {
  saveRobotConfigBtn.onclick = async () => {
    if (!activeConfigRobotId) return;

    const payload = {
      risk_mode: configRiskModeSelect ? configRiskModeSelect.value : "STANDARD",
      lot_size: parseFloat(configLotInput ? configLotInput.value : 0.01) || 0.01,
      auto_lot: configAutoLotCheck ? configAutoLotCheck.checked : false,
      min_rr: parseFloat(configMinRRInput ? configMinRRInput.value : 1.3) || 1.3,
      tp_target: configTpTargetSelect ? configTpTargetSelect.value : "TP1"
    };

    saveRobotConfigBtn.innerText = "Saving Presets...";
    saveRobotConfigBtn.disabled = true;

    try {
      const res = await fetch(`/api/robots/${activeConfigRobotId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (robotConfigFeedback) {
          robotConfigFeedback.className = "exec-feedback success";
          robotConfigFeedback.innerHTML = "✅ Strategy & Risk Presets saved successfully!";
          robotConfigFeedback.style.display = "block";
        }
        await fetchRobots();
        setTimeout(() => {
          robotConfigModal.classList.remove("open");
        }, 1200);
      } else {
        if (robotConfigFeedback) {
          robotConfigFeedback.className = "exec-feedback error";
          robotConfigFeedback.innerHTML = "❌ Failed to update robot presets.";
          robotConfigFeedback.style.display = "block";
        }
      }
    } catch (e) {
      if (robotConfigFeedback) {
        robotConfigFeedback.className = "exec-feedback error";
        robotConfigFeedback.innerHTML = "❌ Connection error.";
        robotConfigFeedback.style.display = "block";
      }
    } finally {
      saveRobotConfigBtn.innerText = "Save Preset Settings";
      saveRobotConfigBtn.disabled = false;
    }
  };
}

// Polling loops
fetchRobots();
fetchLicenseStatus();
fetchBotStatus();
fetchMT5Telemetry();

setInterval(fetchRobots, 15000);
setInterval(fetchLicenseStatus, 5000);
setInterval(fetchBotStatus, 4000);
setInterval(fetchMT5Telemetry, 6000);

lucide.createIcons();

// Video Background Controller
const bgVideo = document.getElementById("bgVideoPlayer");
if (bgVideo) {
  // Loop smoothly between 0 and 9.6s to retain pure animated candlesticks without Pinterest end screen
  bgVideo.addEventListener("timeupdate", () => {
    if (bgVideo.currentTime >= 9.6) {
      bgVideo.currentTime = 0;
      bgVideo.play().catch(() => {});
    }
  });

  const startBgVideo = () => {
    if (bgVideo.paused) {
      bgVideo.play().catch(() => {});
    }
  };

  startBgVideo();
  window.addEventListener("touchstart", startBgVideo, { once: true });
  window.addEventListener("click", startBgVideo, { once: true });
}

lucide.createIcons();

lucide.createIcons();


// ============================================================
// EXACT REFERENCE UI CONTROLS & EVENT BINDINGS
// ============================================================

// 1. Hamburger Navigation Drawer Controls
const topbarHamburgerBtn = document.getElementById("topbarHamburgerBtn");
const hamburgerDrawer = document.getElementById("hamburgerDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerCloseBtn = document.getElementById("drawerCloseBtn");

function openDrawer() {
  if (hamburgerDrawer && drawerBackdrop) {
    hamburgerDrawer.classList.add("open");
    drawerBackdrop.classList.add("open");
  }
}

function closeDrawer() {
  if (hamburgerDrawer && drawerBackdrop) {
    hamburgerDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
  }
}

if (topbarHamburgerBtn) topbarHamburgerBtn.onclick = openDrawer;
if (drawerCloseBtn) drawerCloseBtn.onclick = closeDrawer;
if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;

// 2. Exact Card Bindings
const cardConnectedRobot = document.getElementById("cardConnectedRobot");
if (cardConnectedRobot) {
  cardConnectedRobot.onclick = () => {
    const modal = document.getElementById("robotConfigModal");
    if (modal) modal.classList.add("open");
  };
}

const cardChartScanner = document.getElementById("cardChartScanner");
if (cardChartScanner) {
  cardChartScanner.onclick = () => {
    switchTab("tabScanner");
  };
}

const scannerBackToHomeBtn = document.getElementById("scannerBackToHomeBtn");
if (scannerBackToHomeBtn) {
  scannerBackToHomeBtn.onclick = () => {
    switchTab("tabHome");
  };
}

// 3. Drawer Navigation Links
const drawerLinkScanner = document.getElementById("drawerLinkScanner");
if (drawerLinkScanner) {
  drawerLinkScanner.onclick = () => {
    closeDrawer();
    switchTab("tabScanner");
  };
}

const drawerLinkPresets = document.getElementById("drawerLinkPresets");
if (drawerLinkPresets) {
  drawerLinkPresets.onclick = () => {
    closeDrawer();
    const modal = document.getElementById("robotConfigModal");
    if (modal) modal.classList.add("open");
  };
}

const drawerLinkQuotes = document.getElementById("drawerLinkQuotes");
if (drawerLinkQuotes) {
  drawerLinkQuotes.onclick = () => {
    closeDrawer();
    if (typeof openQuotesModal === "function") openQuotesModal();
  };
}

const drawerLinkLicense = document.getElementById("drawerLinkLicense");
if (drawerLinkLicense) {
  drawerLinkLicense.onclick = () => {
    closeDrawer();
    if (typeof openLicenseModal === "function") openLicenseModal();
  };
}

const drawerLinkOverlay = document.getElementById("drawerLinkOverlay");
if (drawerLinkOverlay) {
  drawerLinkOverlay.onclick = () => {
    closeDrawer();
    if (window.AndroidApp && typeof window.AndroidApp.startFloatingBot === "function") {
      window.AndroidApp.startFloatingBot(window.location.origin);
    } else if (typeof openQuotesModal === "function") {
      openQuotesModal();
    }
  };
}

// 4. Avatar Cycler (Switch between Exact Cyborg, Dalí Mask, White Cyborg)
const avatarCycleList = [
  { src: "/static/ultra_pro_avatar.jpg", name: "Ultra Pro Cyborg", sig: "~ El Profesor" },
  { src: "/static/avatar_dali.jpg", name: "Salvador Dalí Mask", sig: "~ El Profesor" },
  { src: "/static/avatar_cyborg_white.jpg", name: "White Cyber Head", sig: "~ Tokyo" }
];
let currentAvatarIdx = 0;

function cycleAvatarConcept() {
  currentAvatarIdx = (currentAvatarIdx + 1) % avatarCycleList.length;
  const chosen = avatarCycleList[currentAvatarIdx];

  const heroImg = document.getElementById("heroRobotAvatar");
  if (heroImg) heroImg.src = chosen.src;

  const cardThumb = document.getElementById("cardRobotThumb");
  if (cardThumb) cardThumb.src = chosen.src;

  const drawerAvatar = document.getElementById("drawerAvatarImg");
  if (drawerAvatar) drawerAvatar.src = chosen.src;

  const heroSig = document.getElementById("heroCreatorTitle");
  if (heroSig) heroSig.innerText = chosen.sig;

  const badgeOpt = document.getElementById("drawerAvatarCycleName");
  if (badgeOpt) badgeOpt.innerText = chosen.name;
}

const heroAvatarWrap = document.getElementById("heroAvatarContainer");
if (heroAvatarWrap) heroAvatarWrap.onclick = cycleAvatarConcept;

const drawerLinkAvatar = document.getElementById("drawerLinkAvatar");
if (drawerLinkAvatar) drawerLinkAvatar.onclick = cycleAvatarConcept;

// Initialize Lucide icons on newly injected elements
if (window.lucide && typeof window.lucide.createIcons === "function") {
  window.lucide.createIcons();
}
