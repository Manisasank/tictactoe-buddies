# 🎮 XO Arena — Ultimate Multiplayer Tic Tac Toe & AI

> An ultra-responsive, cyber-sleek real-time Tic Tac Toe progressive web application (PWA) with smart AI, Infinity mode, synthesized Web Audio sound FX, particle confetti, and real-time cloud multiplayer powered by Supabase.

---

## 🌟 Key Features

- 🤖 **Single Player vs Smart AI**:
  - **Easy**: Relaxed, casual practice.
  - **Medium**: Tactical blocker that keeps you on your toes.
  - **Master**: Mathematically unbeatable **Minimax algorithm** with reactive AI personality.
- ♾️ **Infinity Mode (3-Piece Shrinking Tic Tac Toe)**:
  - Each player can only have **3 pieces** on the board.
  - When placing your 4th piece, your oldest piece fades away!
  - Eliminates repetitive draws and introduces high-tempo strategic gameplay.
- 👥 **Local Pass & Play**:
  - 2 Players on one screen. Perfect for playing with a friend on mobile or laptop with zero internet required.
- 🌐 **Real-time Online Multiplayer (Supabase Realtime)**:
  - Create private game rooms with shareable 6-digit room codes.
  - Automatic turn synchronization via Supabase PostgreSQL channels.
- 🔊 **Zero-Dependency Web Audio Synthesizer**:
  - Embedded retro-modern audio tones for piece drops, victory fanfares, draw sounds, piece decay, and UI clicks.
  - Includes a mute toggle (🔊 / 🔇) and mobile haptic vibration feedback.
- 🎆 **Pure Canvas Confetti Engine**:
  - Custom celebratory confetti fireworks on match victory.
- ⚡ **Dynamic Neon Winning Strike Line**:
  - Smooth SVG laser strike animation cutting through the winning 3 cells.
- 📱 **Progressive Web App (PWA)**:
  - Offline-ready with `manifest.json` and `sw.js` Service Worker.
  - Installable directly to Android, iPhone, Windows, and Mac home screens!
- 🏆 **Ranks, XP, and Trophy Cabinet**:
  - Earn World Points and level up from **Bronze → Silver → Gold → Diamond**.
  - Local device Hall of Fame + Supabase Global Leaderboards.
  - 9 unique unlockable achievement badges.

---

## 🚀 Live Deployment & Launch Guide

You can launch this application live to the web in under 2 minutes using any of the following platforms:

### Option 1: GitHub Pages (Recommended — Instant & 100% Free)
Since this repository is on GitHub:
1. Open your repository on GitHub: [`https://github.com/Manisasank/tictactoe-buddies`](https://github.com/Manisasank/tictactoe-buddies)
2. Go to **Settings** $\rightarrow$ **Pages** (in the left sidebar).
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
4. Click **Save**.
5. Within 60 seconds, your site will be live at:
   `https://manisasank.github.io/tictactoe-buddies/`

---

### Option 2: Netlify (Continuous Deployment)
1. Go to [Netlify.com](https://www.netlify.com) and log in.
2. Click **Add new site** $\rightarrow$ **Import an existing project**.
3. Select **GitHub** and grant access to `tictactoe-buddies`.
4. Leave build command empty and publish directory as `./` (or leave default).
5. Click **Deploy tictactoe-buddies**.

---

### Option 3: Vercel
1. Go to [Vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your `tictactoe-buddies` repository.
3. Click **Deploy**.

---

## 🗄️ Backend Setup (Optional: For Online Multiplayer)

The app works **100% offline out-of-the-box** for AI, Infinity, and Pass & Play modes with local storage persistence.

To enable online room codes and global cloud leaderboards:
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the entire contents of [`schema.sql`](./schema.sql).
4. Go to **Project Settings** $\rightarrow$ **API** and copy your **Project URL** and **anon public key**.
5. In the game header, click the ☁️ **Cloud Settings** icon to paste your credentials and test the connection!

---

## 🛠️ Local Development & Quick Run

To test locally on your computer:

```bash
# 1. Clone the repository
git clone https://github.com/Manisasank/tictactoe-buddies.git

# 2. Open the project folder
cd tictactoe-buddies

# 3. Simply double-click index.html or launch via any local server:
# Using Python:
python -m http.server 8000
# Then open http://localhost:8000 in your browser
```

---

## 👨‍💻 Author

**Y Mani Shasank**  
- GitHub: [@Manisasank](https://github.com/Manisasank)