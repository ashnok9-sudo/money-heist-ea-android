# 🎭 Money Heist EA — Android App (GitHub Actions Build)

Official native Android client for **MONEY HEIST EA** mobile trading platform.

---

## ⚡ How to Build & Download the APK on GitHub

1. **Create a new repository on GitHub** (e.g. `money-heist-ea-android`).
2. **Push this project** to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial Money Heist EA Android release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/money-heist-ea-android.git
   git push -u origin main
   ```
3. **GitHub Actions builds the APK automatically**:
   - Go to the **Actions** tab on your GitHub repository.
   - You'll see the **Build Money Heist EA APK** workflow running (~2 minutes).
4. **Download the APK directly to your phone**:
   - Go to the **Releases** tab on the right side of the repo.
   - Click the latest release (e.g. `v1.0.1`).
   - Download `app-release.apk` (or `app-debug.apk`) directly to your phone and tap **Install**!
   - You can also download it from the **Actions** run artifacts.

---

## 📱 App Features
- **Native Cyber Interface**: Fullscreen immersive trading experience with Money Heist aesthetics.
- **Server Auto-Connect**: Automatically connects to your Money Heist EA server.
- **Custom Server Dialog**: If your server URL changes (e.g. Cloudflare tunnel or VPS domain), tap "Change Server URL" to update it instantly inside the app.
- **Hardware Accelerated**: 60fps chart rendering and live quote tickers.
