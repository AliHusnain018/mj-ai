# MJ — Real-Time Voice-First AI Personal Assistant

**MJ** is a premium, futuristic, voice-to-voice personal AI companion and personal assistant inspired by Jarvis. Designed with a voice-first philosophy, MJ eliminates traditional text-chat bubbles in favor of real-time audio interaction, bilingual English and Urdu understanding, an animated audio-reactive AI orb, dynamic oscilloscope waveforms, extensible tool calling, and long-term conversational memory.

---

## 🌟 Key Capabilities

- **Strictly Voice-to-Voice Interaction**: No message composers or chat feeds. Powered by the Gemini Live API with 16kHz PCM microphone streaming and 24kHz PCM AI audio playback.
- **Instantaneous Voice Interruption**: If MJ is speaking and the user speaks, AI audio playback cuts off immediately and clears queued audio buffers, returning MJ to active listening.
- **Bilingual Mastery (English + Urdu)**: Natively understands English, Urdu (اردو), Roman Urdu (e.g. *"MJ YouTube kholo"*, *"mera reminder laga do"*), and code-switching without requiring manual language toggling.
- **Extensible Tool Calling System**:
  - `openWebsite`: Safely launches requested websites (YouTube, GitHub, Google, Gmail) in browser tabs.
  - `webSearch`: Real-time web information retrieval and Wikipedia/search grounding.
  - `getWeather`: Live geocoded temperature and weather conditions via Open-Meteo.
  - `manageReminders`: Conversational reminders saved in persistent memory.
  - `manageTodos`: Full personal to-do list management.
  - `manageNotes`: Quick idea recording and note retrieval.
  - `manageCalendar`: Schedule and view calendar events.
  - `manageMemory`: Explicit user-directed memory (*"Remember that I prefer Urdu"*, *"Forget that preference"*).
  - `codingAssist`: Verbal code explanation, error diagnosis, and refactoring assistance.
  - `draftEmail`: Email composition with sensitive-action confirmation dialog.
  - `systemAction`: Safe browser environment diagnostics (battery, CPU cores, platform).
- **Security & Permission Model**:
  - **Safe**: Auto-executed with visual holographic toast.
  - **Sensitive**: Prompts on-screen confirmation modal before execution (e.g., sending emails).
  - **Dangerous**: Strict safety restrictions and verbal/visual verification.
- **Glassmorphic Futuristic UI**:
  - 3D-styled fluid central AI orb with multi-layer radial plasma glow.
  - Real-time oscilloscope canvas waveform synced with audio input/output volumes.
  - Tactile central power/mic button.
  - Developer diagnostics panel and telemetry console.
  - Productivity & memory side drawer.

---

## 🏗️ Project Architecture

```text
mj-ai/
├── server.ts                  # Full-stack Express + WebSocket (/live) server bridging Gemini Live
├── src/
│   ├── ai/
│   │   ├── LiveSession.ts     # Client WebSocket manager for Gemini Live
│   │   └── systemPrompt.ts    # MJ's bilingual voice persona & tool instructions
│   ├── audio/
│   │   ├── AudioStreamer.ts   # 16kHz PCM mic capture & voice activity detection
│   │   ├── AudioPlayer.ts     # 24kHz PCM gapless playback & instant interruption
│   │   └── audioUtils.ts      # PCM16, Float32, base64 conversion & resampling
│   ├── components/
│   │   ├── AIOrb.tsx          # Multi-layered reactive 3D orb
│   │   ├── Waveform.tsx       # Canvas-based real-time audio wave
│   │   ├── VoiceButton.tsx    # Central tactile interaction button
│   │   ├── StatusIndicator.tsx# Live telemetry header & mode pills
│   │   ├── ActionToast.tsx    # Floating holographic tool feedback toast
│   │   ├── PermissionModal.tsx# Security approval dialog for sensitive actions
│   │   ├── SettingsModal.tsx  # Personality modes & voice customization
│   │   ├── ProductivityDrawer.tsx # Reminders, Tasks, Notes, Calendar, Memory
│   │   ├── DebugPanel.tsx     # Developer diagnostic logs & metrics
│   │   └── OnboardingModal.tsx# First-run welcome experience
│   ├── memory/
│   │   └── MemoryManager.ts   # Persistent local memory & productivity storage
│   ├── tools/
│   │   ├── ToolRegistry.ts    # Function declarations for Gemini Live
│   │   └── ToolManager.ts     # Execution logic, safety & permission requester
│   ├── types/
│   │   └── assistant.ts       # TypeScript models and interfaces
│   ├── App.tsx                # Main view orchestrating UI, audio, and state
│   ├── main.tsx               # React root entry point
│   └── index.css              # Tailwind CSS imports
├── index.html                 # App entry point with meta tags & Google fonts
├── metadata.json              # AI Studio capability declarations
├── package.json               # Full-stack dependencies & scripts
├── tsconfig.json              # TypeScript strict configuration
└── vite.config.ts             # Vite configuration
```

---

## 🚀 Getting Started

### 1. Installation

Install all project dependencies:

```bash
npm install
```

### 2. Environment Variables

Create your `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Ensure `GEMINI_API_KEY` is provided:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PORT=3000
VITE_GEMINI_LIVE_MODEL="gemini-3.8-live"
```

*(In Google AI Studio, `GEMINI_API_KEY` is automatically injected into the server environment at runtime).*

### 3. Development Server

Start the full-stack server (runs Express with Vite middleware and WebSocket `/live` on port 3000):

```bash
npm run dev
```

Open `http://localhost:3000` in Chrome, Edge, or Safari.

### 4. Production Build & Start

To build for production and launch:

```bash
npm run build
npm start
```

### 5. Typecheck, Extension Bundling & Tests

```bash
# Build Chrome Extension MV3
npm run build:extension

# Run automated tests
npm test

# Typecheck
npm run lint
```

---

## 🌐 Live Browser & Website Control (Chrome Extension MV3)

MJ includes a dedicated **Chrome Extension Manifest V3 Browser Control Bridge** that enables continuous voice-controlled browsing on active tabs without requiring mouse interaction:

### Architecture
```text
                     MJ VOICE APP
                          │
                   Gemini Live API
                          │
                     Tool Calls
                          │
                BrowserControlManager
                          │
                   Extension Bridge
                          │
              Chrome Extension MV3
                   (Background)
                          │
                   Content Scripts
                          │
                 Active Web Page DOM
```

### Installation in Google Chrome
1. Build the extension: `npm run build:extension`
2. Open Google Chrome and navigate to `chrome://extensions`
3. Toggle on **Developer mode** in the top right corner
4. Click **Load unpacked** in the top left corner
5. Select the `extension/` directory from this project
6. Open the MJ Web App (`http://localhost:3000`). The header will display `Browser: Active`!

### Continuous Voice Commands
- *"MJ, YouTube kholo"* → Opens YouTube in active window.
- *"Python complete course search karo"* → Types search query and loads video results.
- *"Pehli video kholo"* / *"First lecture play karo"* → Resolves and clicks the first lecture video.
- *"Iska channel kholo"* → Resolves the channel from contextual target memory and opens channel page.
- *"Neeche scroll karo"* / *"Aur neeche"* → Smoothly scrolls the active viewport down.
- *"Top pe jao"* / *"Bottom pe jao"* → Jumps to top or bottom of the page.
- *"Back jao"* / *"Forward jao"* → Navigates browser history backward or forward.
- *"Pause"* / *"Play"* / *"10 second aage karo"* → Controls HTML5 video media playback.

---

## 🎙️ Spoken Conversation Examples

### English

- *"MJ, open YouTube."* → Opens YouTube in a new tab and confirms verbally.
- *"Remind me at 8 PM to finish the quarterly budget."* → Saves reminder to persistent memory.
- *"What's the weather in San Francisco today?"* → Checks live forecast via Open-Meteo.
- *"Remember that my favorite programming language is TypeScript."* → Stores in memory.

### Urdu (اردو) / Roman Urdu

- *"MJ, YouTube kholo."* → Opens YouTube.
- *"Mera reminder laga do ke 9 baje call karni hai."* → Adds reminder.
- *"Lahore ka mausam kaisa hai?"* → Reports live weather in Urdu.
- *"Mujhe is code ka bug explain karo."* → Analyzes error and explains logic.

---

## 🔒 Security & Privacy Notes

1. **API Keys**: Stored exclusively on the server (`server.ts`). Never exposed to browser bundles or client-side WebSocket frames.
2. **Microphone Permissions**: Explicitly requested on first user connection. Tracks are cleanly terminated when disconnected.
3. **URL Validation**: `openWebsite` strictly permits `http://` and `https://` schemes, rejecting dangerous protocols (`javascript:`, `file:`, `data:`).
4. **Sensitive Action Verification**: Operations like emailing or deleting items require interactive user confirmation before completion.
5. **Memory Control**: Stored locally and inspectable/clearable at any time via the Memory Drawer or Settings.

---

## 🌐 Browser Sandbox Limitations & Companion Architecture

A standard web browser cannot execute arbitrary local shell commands, control external desktop apps, or bypass operating system sandboxes.

MJ is architected with a modular abstraction:
- **Browser-Safe Tier**: Executes web searches, open URLs, localStorage memory, audio synthesis, and geolocation directly.
- **Desktop Companion Tier**: Designed with a clean RPC specification to communicate with an optional native local companion (e.g. Electron/Tauri or local HTTP daemon) for local application launching and terminal scripts when authorized.

---

## 📄 License

Apache-2.0
