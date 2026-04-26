# YouTube Embedded Utilities - Developer Documentation

This document provides a comprehensive technical reference for the YouTube Embedded Utilities Chrome Extension. It covers the architecture, every source file, the communication protocols used, and guidance for extending the project.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Build System](#build-system)
4. [Manifest Configuration](#manifest-configuration)
5. [Source Code Reference](#source-code-reference)
   - [Entry Point: index.ts](#entry-point-indexts)
   - [Observer: observer.ts](#observer-observerts)
   - [Injector: injector.ts](#injector-injectorts)
   - [Player Controller: playerController.ts](#player-controller-playercontrollerts)
   - [Embed Inject: embed_inject.ts](#embed-inject-embed_injectts)
   - [Overlay UI: overlay.ts](#overlay-ui-overlayts)
   - [Styles: styles.css](#styles-stylescss)
   - [Storage: storage.ts](#storage-storagets)
   - [Keyboard: keyboard.ts](#keyboard-keyboardts)
6. [Communication Protocols](#communication-protocols)
7. [Known Limitations](#known-limitations)
8. [How to Extend](#how-to-extend)

---

## Architecture Overview

The extension operates with two separate content script contexts that communicate via `window.postMessage`:

```
Host Page (any website)                     YouTube Embed Iframe
┌──────────────────────────────┐           ┌──────────────────────────┐
│                              │           │                          │
│  Content Script (ISOLATED)   │           │  embed_inject.ts (MAIN)  │
│  ┌────────────────────────┐  │           │  ┌────────────────────┐  │
│  │ observer.ts            │  │           │  │ Direct access to   │  │
│  │   detects iframes      │  │           │  │ movie_player obj   │  │
│  │                        │  │           │  │                    │  │
│  │ injector.ts            │  │           │  │ Listens for        │  │
│  │   creates wrapper,     │  │           │  │ __ytuCommand msgs  │  │
│  │   overlay, controller  │  │           │  │                    │  │
│  │                        │  │  postMsg  │  │ Broadcasts         │  │
│  │ playerController.ts ◄──┼──┼──────────►┼──┤ __ytuResponse msgs │  │
│  │   sends commands,      │  │           │  │ (quality, CC)      │  │
│  │   receives state       │  │           │  │                    │  │
│  │                        │  │           │  └────────────────────┘  │
│  │ overlay.ts             │  │           │                          │
│  │   UI rendering         │  │           │  YouTube Iframe Player   │
│  │   user interactions    │  │           │  (native YT code)        │
│  └────────────────────────┘  │           │                          │
│                              │           └──────────────────────────┘
└──────────────────────────────┘
```

There are two "worlds" at play:

- **ISOLATED world** (default): The main content script runs here. It can see the DOM of the host page but cannot access the host page's JavaScript variables. This is where `observer.ts`, `injector.ts`, `playerController.ts`, and `overlay.ts` run.
- **MAIN world**: The `embed_inject.ts` script runs here, inside the YouTube embed iframe. It has direct access to the iframe page's JavaScript objects, including the internal `movie_player` element. This is how we bypass YouTube's deprecated postMessage quality API.

---

## Project Structure

```
youtubeex/
├── dist/                         # Production build output (load this in Chrome)
├── src/
│   ├── content/                  # Scripts that run on the host page
│   │   ├── index.ts              # Entry point, initializes storage + observer
│   │   ├── observer.ts           # MutationObserver for detecting YouTube iframes
│   │   ├── injector.ts           # Creates wrapper, controller, and overlay per iframe
│   │   └── playerController.ts   # Two-way communication bridge with the iframe
│   ├── embed/
│   │   └── embed_inject.ts       # Runs INSIDE the YouTube iframe (MAIN world)
│   ├── ui/
│   │   ├── overlay.ts            # Builds the entire floating control panel UI
│   │   └── styles.css            # Glassmorphic CSS for the overlay
│   └── utils/
│       ├── storage.ts            # Domain-specific settings persistence
│       └── keyboard.ts           # Keyboard shortcut handler
├── manifest.json                 # Chrome Extension Manifest V3
├── vite.config.ts                # Vite + @crxjs/vite-plugin configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # User-facing readme
```

---

## Build System

The project uses **Vite** with the **@crxjs/vite-plugin** to compile TypeScript and bundle everything into a Chrome-loadable extension.

### Key Commands

| Command           | What it does                                           |
|--------------------|-------------------------------------------------------|
| `npm install`      | Installs all dependencies                              |
| `npm run dev`      | Starts Vite dev server with HMR (hot module reload)    |
| `npm run build`    | Runs `tsc` (type checking) then `vite build`           |

### How the build works

1. `tsc` compiles and type-checks all TypeScript files (but does not emit JS; `noEmit: true`).
2. `vite build` uses `@crxjs/vite-plugin` which reads `manifest.json`, discovers all content scripts listed there, and bundles them as separate entry points into the `dist/` folder.
3. The `dist/` folder is the final extension. You load it via `chrome://extensions` > "Load unpacked".

### Dependencies

| Package                | Purpose                                            |
|------------------------|----------------------------------------------------|
| `vite`                 | Build tool and dev server                          |
| `@crxjs/vite-plugin`  | Vite plugin that understands `manifest.json`       |
| `typescript`           | TypeScript compiler                                |
| `@types/chrome`        | Type definitions for Chrome Extension APIs         |
| `chrome-types`         | Additional Chrome type definitions                 |

---

## Manifest Configuration

`manifest.json` defines two content script entries:

### 1. Main Content Script (ISOLATED world)
```json
{
  "matches": ["<all_urls>"],
  "js": ["src/content/index.ts"]
}
```
- Runs on every page.
- Detects YouTube embeds and injects the overlay UI.
- Runs in the default ISOLATED world (can see the DOM but not the page's JS).

### 2. Embed Inject Script (MAIN world)
```json
{
  "matches": ["*://*.youtube.com/embed/*", "*://*.youtube-nocookie.com/embed/*"],
  "js": ["src/embed/embed_inject.ts"],
  "world": "MAIN",
  "run_at": "document_idle",
  "all_frames": true
}
```
- Runs only inside YouTube embed iframes.
- `"world": "MAIN"` gives it access to the iframe's JavaScript objects (the internal player).
- `"all_frames": true` ensures it runs even in nested iframes.

### Permissions
- `"storage"`: Used for `chrome.storage.local` (persisting playback speed per domain).
- `"host_permissions": ["<all_urls>"]`: Required to inject content scripts on any page.

---

## Source Code Reference

### Entry Point: `index.ts`

**Path**: `src/content/index.ts`

The simplest file. It initializes the storage system (loading any saved settings for the current domain) and then starts the DOM observer.

```typescript
async function main() {
  await initStorage();   // Load saved playback speed for this domain
  initObserver();        // Start watching for YouTube iframes
}
```

**Key detail**: `initStorage()` is `async` because it reads from `chrome.storage.local`, which is asynchronous. The observer only starts after storage is ready, so the initial speed value is available when overlays are created.

---

### Observer: `observer.ts`

**Path**: `src/content/observer.ts`

Responsible for finding YouTube embed iframes on the page.

**How it works**:
1. On load, it queries for all existing `iframe[src*="youtube.com/embed"]` elements and passes them to `processIframe()`.
2. It creates a `MutationObserver` watching `document.body` with `childList: true, subtree: true`. This catches iframes that are added dynamically (e.g., by JavaScript frameworks, lazy loading, or SPAs).
3. When a new node is added, it checks if the node itself is a YouTube iframe or if it contains nested YouTube iframes.

**When to modify**: If you need to support other embed URL patterns (e.g., `youtube-nocookie.com/embed`), add additional `querySelectorAll` patterns here.

---

### Injector: `injector.ts`

**Path**: `src/content/injector.ts`

Handles the setup for each detected YouTube iframe.

**`processIframe(iframe)`**:
1. Checks `iframe.dataset.ytEmbedInjected` to prevent duplicate injection.
2. Checks if the iframe's `src` includes `enablejsapi=1`. If not, it appends it and waits 1 second for the iframe to reload. This parameter is required for the YouTube Iframe API to accept `postMessage` commands.
3. Calls `injectControls(iframe)`.

**`injectControls(iframe)`**:
1. Gets the iframe's parent element and sets it to `position: relative` if it's `static` (needed for absolute positioning).
2. Creates a `PlayerController` instance (the communication bridge).
3. Creates the overlay UI via `createOverlay(controller)`.
4. Creates a wrapper `div` (`.yt-embed-utilities-wrapper`) positioned absolutely over the iframe, matching its dimensions.
5. Appends the overlay inside the wrapper.
6. Adds a `resize` event listener to recalculate wrapper position.
7. Sets up keyboard shortcuts scoped to this iframe/wrapper pair.

**Important**: The wrapper uses `overflow: hidden` implicitly through its dimensions. The overlay's drag logic is constrained to the wrapper bounds.

---

### Player Controller: `playerController.ts`

**Path**: `src/content/playerController.ts`

The central communication class. One instance per iframe.

**Properties**:
| Property                   | Type       | Description                                      |
|----------------------------|------------|--------------------------------------------------|
| `currentTime`              | `number`   | Current playback position in seconds              |
| `playerState`              | `number`   | YouTube player state code (see below)             |
| `availableQualityLevels`   | `string[]` | Available quality options from the player          |
| `playbackQuality`          | `string`   | Current quality level (e.g., `hd1080`)            |
| `videoId`                  | `string`   | YouTube video ID                                  |
| `ccEnabled`                | `boolean`  | Whether closed captions are currently active       |

**Player State Codes** (from YouTube API):
| Code | Meaning    |
|------|------------|
| -1   | Unstarted  |
| 0    | Ended      |
| 1    | Playing    |
| 2    | Paused     |
| 3    | Buffering  |
| 5    | Video cued |

**Callbacks** (set by `overlay.ts` to react to state changes):
| Callback                  | Triggered when...                              |
|---------------------------|-------------------------------------------------|
| `onStateChange`           | Player state changes (play, pause, etc.)         |
| `onTimeUpdate`            | Current time updates (fires frequently)          |
| `onQualityLevelsUpdate`   | Available quality levels change                  |
| `onPlaybackQualityChange` | Active quality changes                           |
| `onVideoDataUpdate`       | Video ID is received                             |
| `onCCChange`              | Closed caption state changes                     |

**Two message sources**:
The `initListener()` method listens for `window.message` events from the iframe. It handles two types:

1. **YouTube's native `infoDelivery` events** (string JSON): Contains `currentTime`, `playerState`, and `videoData`. These are the standard YouTube Iframe API messages.
2. **Custom `__ytuResponse` events** (object): Sent by our `embed_inject.ts` script. Contains `levels`, `current` (quality), and `ccEnabled`.

**Methods**:
| Method                      | What it does                                              |
|-----------------------------|----------------------------------------------------------|
| `play()`                    | Sends `playVideo` command                                 |
| `pause()`                   | Sends `pauseVideo` command                                |
| `togglePlay(isPlaying)`     | Plays or pauses based on current state                    |
| `setPlaybackRate(rate)`     | Sets speed (0.25 to 4)                                    |
| `seekBy(seconds)`           | Seeks relative to current time                            |
| `seekTo(seconds)`           | Seeks to absolute time                                    |
| `setVolume(volume)`         | Sets volume (0 to 100)                                    |
| `mute()` / `unMute()`      | Mutes/unmutes                                             |
| `setPlaybackQuality(q)`     | Sends `__ytuCommand` to embed script (not the standard API) |
| `toggleCC(enable)`          | Loads/unloads the captions module                         |
| `setCCLanguage(langCode)`   | Sets the caption language track                           |

**Critical detail about quality**: `setPlaybackQuality` does NOT use the standard `sendCommand` method. YouTube deprecated the postMessage quality API, so instead it posts a `__ytuCommand` message that the `embed_inject.ts` script picks up and executes using the internal player object. See the [Communication Protocols](#communication-protocols) section.

---

### Embed Inject: `embed_inject.ts`

**Path**: `src/embed/embed_inject.ts`

This script runs inside the YouTube embed iframe in the **MAIN** world. It has access to the page's JavaScript, including the internal player object.

**How it works**:
1. `waitForPlayer()` polls every 500ms for `document.getElementById('movie_player')` until the player is ready (has a `getPlaybackQuality` method).
2. Once ready, it listens for `__ytuCommand` messages from the parent page.
3. It broadcasts `__ytuResponse` messages every 2 seconds containing:
   - `levels`: Available quality levels (`getAvailableQualityLevels()`)
   - `current`: Current quality (`getPlaybackQuality()`)
   - `ccEnabled`: Whether a caption track is active (`getOption('captions', 'track')`)

**Supported commands**:
| Command            | Args             | Action                                                |
|--------------------|------------------|------------------------------------------------------|
| `setQuality`       | `{ quality }`    | Calls `setPlaybackQualityRange(q, q)` and `setPlaybackQuality(q)` |
| `getQualityLevels` | none             | Returns quality levels and current quality             |

**Why MAIN world**: Content scripts in the default ISOLATED world cannot access `document.getElementById('movie_player')` as a JavaScript object with methods. They can only see it as a DOM element. The MAIN world gives us access to the actual player API.

---

### Overlay UI: `overlay.ts`

**Path**: `src/ui/overlay.ts`

Builds the entire floating control panel. This is the largest file.

**Structure**:
```
container (div, position: absolute)
├── minimalBtn (gear icon button, shown when overlay is minimized)
└── overlay (div.ytu-overlay)
    ├── header (title + copy button + minimize button)
    ├── playbackRow (seek back, play/pause, seek forward)
    ├── speedRow (speed label + slider)
    ├── volRow (mute button + volume label + slider)
    ├── qualityRow ("Quality" label + select dropdown)
    └── ccRow (CC toggle button)
```

**Icons**: All icons are inline SVG strings stored in the `icons` object at the top of the file. They use `currentColor` for stroke/fill so they inherit the white text color.

**Dragging logic**:
- Both the header and the minimalBtn trigger dragging via `onmousedown`.
- On `mousemove`, the new position is calculated and clamped to the parent wrapper's boundaries.
- A `isDragged` flag distinguishes between a click and a drag. If the user drags the gear button, clicking it (to open the overlay) is suppressed.

**Quality label mapping** (YouTube internal names to display names):
| Internal Name | Display Label |
|---------------|--------------|
| `hd2160`      | 4K           |
| `hd1440`      | 1440p        |
| `hd1080`      | 1080p        |
| `hd720`       | 720p         |
| `large`       | 480p         |
| `medium`      | 360p         |
| `small`       | 240p         |
| `tiny`        | 144p         |
| `auto`        | Auto         |

---

### Styles: `styles.css`

**Path**: `src/ui/styles.css`

All CSS classes are prefixed with `ytu-` to avoid collisions with the host page's styles.

**Key classes**:
| Class                           | Purpose                                          |
|---------------------------------|--------------------------------------------------|
| `.yt-embed-utilities-wrapper`   | Invisible wrapper over the iframe, `pointer-events: none` |
| `.ytu-overlay`                  | Main glassmorphic panel (blur, transparency)      |
| `.ytu-header`                   | Top bar with title and buttons, `cursor: grab`    |
| `.ytu-row`                      | Horizontal flex row for controls                  |
| `.ytu-btn`                      | Base button style with hover/active animations    |
| `.ytu-btn.icon-btn`             | Square 32x32 icon button variant                  |
| `.ytu-slider`                   | Custom range input (thin track, round white thumb)|
| `.ytu-minimal-btn`              | Circular gear button (36x36, dark glass)          |
| `.ytu-select`                   | Custom dropdown with SVG chevron arrow            |
| `.ytu-hidden`                   | `display: none !important`                        |

**Pointer events trick**: The wrapper has `pointer-events: none` so it does not block clicks on the underlying video. All children have `pointer-events: auto` re-enabled so the buttons and sliders work.

---

### Storage: `storage.ts`

**Path**: `src/utils/storage.ts`

Handles persisting user preferences per domain using `chrome.storage.local`.

**How it works**:
- On page load, `initStorage()` reads the stored data for `window.location.hostname`.
- Data is cached in memory (`cachedData`) for synchronous reads via `getPlaybackSpeed()`.
- When the user changes speed, `setPlaybackSpeed()` updates both the cache and `chrome.storage.local`.

**Storage key format**: The domain hostname (e.g., `example.com`) is used as the storage key. The value is a `StorageData` object:
```typescript
interface StorageData {
  playbackSpeed: number;   // default: 1
}
```

**To add new persistent settings**: Add a new field to `StorageData`, update `DEFAULT_DATA`, and create getter/setter functions following the same pattern.

---

### Keyboard: `keyboard.ts`

**Path**: `src/utils/keyboard.ts`

Handles keyboard shortcuts, scoped to when the user is hovering over or focused on the video.

**Current shortcuts**:
| Shortcut            | Action                            |
|---------------------|-----------------------------------|
| `Shift + ArrowUp`   | Increase playback speed by 0.25x  |
| `Shift + ArrowDown` | Decrease playback speed by 0.25x  |

**Scoping**: The shortcuts only fire when `isHovered` is true (mouse is over the iframe or wrapper) or when the iframe/wrapper has focus. This prevents interfering with the rest of the page.

**`updateSpeedUI()`**: After changing speed via keyboard, this helper finds the speed label and slider within the wrapper using `querySelector` and updates their values to match.

---

## Communication Protocols

There are three distinct message channels used in this extension:

### 1. Standard YouTube Iframe API (postMessage, string JSON)

**Direction**: Content script to iframe, and iframe back to content script.

**Sending commands**:
```typescript
iframe.contentWindow.postMessage(JSON.stringify({
  event: 'command',
  func: 'playVideo',  // or pauseVideo, seekTo, setVolume, etc.
  args: []
}), '*');
```

**Receiving state** (from YouTube):
```typescript
// YouTube sends these automatically when you post { event: 'listening' }
{
  event: 'infoDelivery',
  info: {
    currentTime: 42.5,
    playerState: 1,
    videoData: { video_id: 'dQw4w9WgXcQ' }
  }
}
```

### 2. Custom Command Channel (postMessage, object)

**Direction**: Content script to embed_inject.ts (inside iframe).

**Sending**:
```typescript
iframe.contentWindow.postMessage({
  __ytuCommand: true,
  command: 'setQuality',
  args: { quality: 'hd1080' }
}, '*');
```

**Identifying marker**: `__ytuCommand: true`

### 3. Custom Response Channel (postMessage, object)

**Direction**: embed_inject.ts (inside iframe) to content script.

**Receiving**:
```typescript
{
  __ytuResponse: true,
  type: 'qualityInfo',
  levels: ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'],
  current: 'hd720',
  ccEnabled: false
}
```

**Identifying marker**: `__ytuResponse: true`

---

## Known Limitations

1. **Quality control via the standard YouTube postMessage API is deprecated**. YouTube ignores `setPlaybackQuality` sent via postMessage. We work around this with the MAIN world embed script, but YouTube could change their internal player API at any time.

2. **CC language selection is limited**. The YouTube Iframe API does not reliably expose the list of available caption tracks via postMessage or the internal player object. The CC button acts as a simple on/off toggle for whatever the default caption track is.

3. **Multiple overlays share `document.onmousemove`**. If there are multiple YouTube embeds on one page, the last overlay's drag handler overwrites the previous one's. To fix this, switch to `addEventListener` instead of direct assignment.

4. **`enablejsapi=1` injection causes a one-time iframe reload**. If the embed doesn't already have this parameter, the extension adds it, causing a brief flicker. This is unavoidable.

5. **The wrapper position is based on `offsetTop`/`offsetLeft`**. If the iframe is inside a complex CSS layout (e.g., CSS transforms, sticky positioning), the wrapper may not align perfectly.

---

## How to Extend

### Adding a new control

1. **Add the command to `playerController.ts`**: Create a new method that calls `sendCommand()` or posts a `__ytuCommand`.
2. **Add the UI in `overlay.ts`**: Create the button/slider/dropdown element, bind its event handler to the controller method, and append it to the overlay.
3. **If you need data from the player**: Update `embed_inject.ts` to read the data from the internal player object and include it in the `__ytuResponse` broadcast. Then handle it in `playerController.ts`'s message listener.

### Adding a new persistent setting

1. Add the field to `StorageData` in `storage.ts`.
2. Add a default value to `DEFAULT_DATA`.
3. Create a getter and setter function (follow the `getPlaybackSpeed`/`setPlaybackSpeed` pattern).
4. Use the getter in `overlay.ts` to set the initial UI state.
5. Call the setter when the user changes the value.

### Adding a new icon

1. Find an SVG icon (Feather Icons, Lucide, etc.).
2. Add it as a string to the `icons` object in `overlay.ts`.
3. Use it with `element.innerHTML = icons.yourIcon`.

### Supporting Firefox

Firefox still primarily uses Manifest V2. Key changes needed:
- Change `"manifest_version"` from 3 to 2.
- Replace `"host_permissions"` with `"permissions"`.
- Remove `"world": "MAIN"` (Firefox uses `wrappedJSObject` or page script injection instead).
- Replace `chrome.storage` with `browser.storage` (or use a polyfill like `webextension-polyfill`).
