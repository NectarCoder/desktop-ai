# UX Architecture Strategy
## Desktop AI — Productivity Dashboard for AI Agents

> **Version:** 1.0  
> **Target Implementer:** GPT-5.2 Codex (AI Coding Assistant)  
> **Implementation Mode:** Strict Phase Execution  
> **Last Updated:** 2026-01-19

---

## Executive Summary

Transform the current browser-like Electron application into a **high-performance, app-like productivity dashboard** for AI agents. This document specifies architectural decisions, implementation requirements, and phased execution steps.

### Current State Analysis
- Basic Electron + React + TypeScript + Webpack setup
- Static tab array with hardcoded AI services
- Standard window chrome (menu bars visible)
- No session persistence or security partitioning
- No state management or settings persistence
- Tab bar always visible regardless of tab count

### Target State
- Frameless window with custom title bar controls
- Sandboxed, partitioned webviews with session persistence
- Dynamic tab system with conditional visibility
- Animated sidebar navigation with keyboard shortcut support
- Persistent state across app restarts
- Premium, polished UI with micro-animations

---

## Technology Stack Decisions

### Core Dependencies to Add

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^8.x",
    "@dnd-kit/utilities": "^3.x",
    "motion": "^11.x",
    "electron-store": "^10.x",
    "lucide-react": "^0.x",
    "uuid": "^11.x"
  },
  "devDependencies": {
    "@types/uuid": "^10.x"
  }
}
```

### Library Justifications

| Need | Library | Rationale |
|------|---------|-----------|
| Drag & Drop Tabs | `@dnd-kit` | Modern hooks API, horizontal sorting strategy, excellent accessibility, active maintenance |
| Animations | `motion` (Framer Motion) | `layoutId` for morphing effects, `AnimatePresence` for exit animations, spring physics |
| State Persistence | `electron-store` | JSON-based storage, schema validation, encryption support, synchronous reads |
| Icons | `lucide-react` | Lightweight, tree-shakable, consistent design system |

---

## Phase 1: Main Process & Security Foundation

### 1.1 Window Configuration

**File:** `src/main.ts`

#### 1.1.1 Frameless Window Setup

```typescript
import { app, BrowserWindow, globalShortcut, Menu, ipcMain } from 'electron';

let mainWindow: BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    
    // FRAMELESS CONFIGURATION
    frame: false,           // Remove native window chrome
    titleBarStyle: 'hidden', // macOS: preserve traffic lights
    titleBarOverlay: {      // Windows: overlay controls
      color: '#0f0f0f',
      symbolColor: '#ffffff',
      height: 44
    },
    
    // Appearance
    backgroundColor: '#0f0f0f',
    show: false, // Prevent white flash
    
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      sandbox: false, // Required for webview
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Graceful show after ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}
```

#### 1.1.2 Remove Application Menu

```typescript
// In createWindow() or after app.whenReady()
Menu.setApplicationMenu(null); // Removes File, Edit, View menus completely
```

#### 1.1.3 Platform-Specific Considerations

| Platform | Behavior |
|----------|----------|
| **Windows** | Use `titleBarOverlay` for native min/max/close buttons |
| **macOS** | Use `titleBarStyle: 'hidden'` to preserve traffic lights |
| **Linux** | Implement custom window controls (see Phase 1.4) |

---

### 1.2 Security Hardening (CRITICAL)

#### 1.2.1 Webview Security Configuration

**All AI service webviews MUST use these settings:**

```html
<webview
  src="https://chatgpt.com"
  partition="persist:chatgpt"
/>
```

**Security Attributes Table:**

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `partition` | `persist:serviceName` | Isolates sessions AND persists across restarts |
| `nodeintegration` | `false` (default) | Prevents Node.js access in guest |
| `contextIsolation` | `true` (default) | Isolates preload scripts |
| `sandbox` | Enabled by default | OS-level sandboxing |

#### 1.2.2 Partition Strategy

Each AI service gets its own persistent partition:

```typescript
const SERVICE_PARTITIONS: Record<string, string> = {
  chatgpt: 'persist:chatgpt',
  claude: 'persist:claude',
  gemini: 'persist:gemini',
  perplexity: 'persist:perplexity',
  deepseek: 'persist:deepseek'
};
```

**Benefits:**
- ✅ Session persistence (users stay logged in)
- ✅ Cookie isolation between services
- ✅ Storage isolation (IndexedDB, localStorage)
- ✅ Cache separation

#### 1.2.3 Secure Webview Creation Handler

**File:** `src/main.ts`

```typescript
app.on('web-contents-created', (event, contents) => {
  // Secure all webviews
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip preload scripts from webviews
    delete webPreferences.preload;
    
    // Enforce security
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.enableRemoteModule = false;
    webPreferences.allowRunningInsecureContent = false;
    
    // Optional: Allowlist URLs
    const allowedHosts = [
      'chatgpt.com',
      'claude.ai',
      'gemini.google.com',
      'perplexity.ai',
      'chat.deepseek.com'
    ];
    
    const url = new URL(params.src);
    if (!allowedHosts.some(host => url.hostname.endsWith(host))) {
      console.warn(`Blocked webview to: ${params.src}`);
      event.preventDefault();
    }
  });

  // Block new window creation
  contents.setWindowOpenHandler(({ url }) => {
    // Open external URLs in system browser
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
});
```

---

### 1.3 Global Shortcut Handler

**File:** `src/main.ts`

#### 1.3.1 IPC Preload Bridge

**File:** `src/preload.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Tab Management
  onNewTab: (callback: () => void) => 
    ipcRenderer.on('shortcut:new-tab', callback),
  onCloseTab: (callback: () => void) => 
    ipcRenderer.on('shortcut:close-tab', callback),
  onNextTab: (callback: () => void) => 
    ipcRenderer.on('shortcut:next-tab', callback),
  onPrevTab: (callback: () => void) => 
    ipcRenderer.on('shortcut:prev-tab', callback),
  
  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  
  // State Persistence
  saveState: (state: object) => ipcRenderer.invoke('store:save', state),
  loadState: () => ipcRenderer.invoke('store:load'),
  
  // Cleanup
  removeAllListeners: (channel: string) => 
    ipcRenderer.removeAllListeners(channel)
});
```

#### 1.3.2 Global Accelerator Registration

**File:** `src/main.ts`

```typescript
function registerGlobalShortcuts() {
  const shortcuts = [
    { accelerator: 'CommandOrControl+T', channel: 'shortcut:new-tab' },
    { accelerator: 'CommandOrControl+W', channel: 'shortcut:close-tab' },
    { accelerator: 'CommandOrControl+Tab', channel: 'shortcut:next-tab' },
    { accelerator: 'CommandOrControl+Shift+Tab', channel: 'shortcut:prev-tab' },
    { accelerator: 'CommandOrControl+1', channel: 'shortcut:tab-1' },
    { accelerator: 'CommandOrControl+2', channel: 'shortcut:tab-2' },
    { accelerator: 'CommandOrControl+3', channel: 'shortcut:tab-3' },
    { accelerator: 'CommandOrControl+4', channel: 'shortcut:tab-4' },
    { accelerator: 'CommandOrControl+9', channel: 'shortcut:tab-last' },
  ];

  shortcuts.forEach(({ accelerator, channel }) => {
    globalShortcut.register(accelerator, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel);
      }
    });
  });
}

// Register on app ready
app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();
});

// Unregister on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

---

### 1.4 Custom Window Controls (Linux/Cross-Platform)

**File:** `src/renderer/components/TitleBar.tsx`

```tsx
import { motion } from 'motion/react';
import { Minus, Square, X, Menu } from 'lucide-react';

interface TitleBarProps {
  onMenuClick: () => void;
}

export function TitleBar({ onMenuClick }: TitleBarProps) {
  const isWindows = navigator.platform.includes('Win');
  const isMac = navigator.platform.includes('Mac');
  
  // macOS uses native traffic lights
  if (isMac) {
    return (
      <div className="title-bar title-bar--mac">
        <div className="drag-region" />
        <HamburgerButton onClick={onMenuClick} />
      </div>
    );
  }

  return (
    <div className="title-bar">
      <HamburgerButton onClick={onMenuClick} />
      <div className="drag-region" />
      <div className="window-controls">
        <button onClick={() => window.electronAPI.minimizeWindow()}>
          <Minus size={16} />
        </button>
        <button onClick={() => window.electronAPI.maximizeWindow()}>
          <Square size={14} />
        </button>
        <button 
          className="close-btn"
          onClick={() => window.electronAPI.closeWindow()}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
```

---

## Phase 2: State Management & Persistence

### 2.1 Electron Store Schema

**File:** `src/main/store.ts`

```typescript
import Store from 'electron-store';

interface TabState {
  id: string;
  serviceId: string; // 'chatgpt' | 'claude' | 'gemini' | etc.
  title: string;
  url: string;
  iconUrl?: string;
}

interface AppState {
  // Theme
  theme: 'system' | 'dark' | 'light';
  
  // Session Restoration
  tabs: TabState[];
  activeTabId: string | null;
  
  // Sidebar
  sidebarCollapsed: boolean;
  
  // Window
  windowBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const schema = {
  theme: {
    type: 'string',
    enum: ['system', 'dark', 'light'],
    default: 'system'
  },
  tabs: {
    type: 'array',
    default: []
  },
  activeTabId: {
    type: ['string', 'null'],
    default: null
  },
  sidebarCollapsed: {
    type: 'boolean',
    default: true
  },
  windowBounds: {
    type: 'object',
    default: undefined
  }
} as const;

export const store = new Store<AppState>({ schema });
```

### 2.2 IPC Handlers for Persistence

**File:** `src/main.ts`

```typescript
import { ipcMain } from 'electron';
import { store } from './store';

// Save state from renderer
ipcMain.handle('store:save', (event, state: Partial<AppState>) => {
  Object.entries(state).forEach(([key, value]) => {
    store.set(key as keyof AppState, value);
  });
  return true;
});

// Load state to renderer
ipcMain.handle('store:load', () => {
  return store.store; // Returns entire state object
});

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());
```

### 2.3 React State Synchronization

**File:** `src/renderer/hooks/usePersistedState.ts`

```typescript
import { useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export function usePersistedState<T>(
  key: string,
  state: T,
  setState: (value: T) => void
) {
  // Debounce saves to avoid excessive IPC calls
  const debouncedState = useDebounce(state, 500);

  // Save on change
  useEffect(() => {
    window.electronAPI.saveState({ [key]: debouncedState });
  }, [key, debouncedState]);

  // Load on mount
  useEffect(() => {
    window.electronAPI.loadState().then((stored) => {
      if (stored[key] !== undefined) {
        setState(stored[key]);
      }
    });
  }, [key, setState]);
}
```

---

## Phase 3: The Landing View (Zero State)

### 3.1 Display Condition

```typescript
const showLandingView = tabs.length === 0 || activeTab?.isNewTab;
```

### 3.2 Component Structure

**File:** `src/renderer/components/LandingView.tsx`

```tsx
import { motion } from 'motion/react';

const AI_SERVICES = [
  { 
    id: 'chatgpt', 
    name: 'ChatGPT', 
    url: 'https://chatgpt.com',
    color: '#10a37f',
    icon: '/icons/chatgpt.svg'
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    url: 'https://gemini.google.com',
    color: '#4285f4',
    icon: '/icons/gemini.svg'
  },
  { 
    id: 'claude', 
    name: 'Claude', 
    url: 'https://claude.ai',
    color: '#d97757',
    icon: '/icons/claude.svg'
  },
  { 
    id: 'perplexity', 
    name: 'Perplexity', 
    url: 'https://perplexity.ai',
    color: '#20b8cd',
    icon: '/icons/perplexity.svg'
  },
];

interface LandingViewProps {
  onServiceSelect: (service: typeof AI_SERVICES[number]) => void;
}

export function LandingView({ onServiceSelect }: LandingViewProps) {
  return (
    <div className="landing-view">
      <motion.div
        className="landing-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="landing-title">
          Welcome to <span className="gradient-text">Desktop AI</span>
        </h1>
        <p className="landing-subtitle">
          Your unified workspace for AI assistants
        </p>

        <div className="service-grid">
          {AI_SERVICES.map((service, index) => (
            <motion.button
              key={service.id}
              className="service-card"
              onClick={() => onServiceSelect(service)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              style={{ '--accent': service.color } as React.CSSProperties}
            >
              <div className="service-icon">
                <img src={service.icon} alt={service.name} />
              </div>
              <span className="service-name">{service.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
```

### 3.3 Landing View Styles

```scss
.landing-view {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f0f 70%);
}

.landing-content {
  text-align: center;
  max-width: 600px;
  padding: 2rem;
}

.landing-title {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.landing-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 3rem;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.service-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--accent);
    box-shadow: 0 0 20px rgba(var(--accent), 0.1);
  }

  .service-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    
    img {
      width: 32px;
      height: 32px;
    }
  }

  .service-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }
}
```

---

## Phase 4: Navigation Drawer (Sidebar)

### 4.1 Animation Architecture

**The "Merge" Effect Implementation:**

Using `motion`'s `layoutId` feature, the hamburger button and sidebar header share the same `layoutId`, creating a seamless morph animation.

### 4.2 Component Structure

**File:** `src/renderer/components/Sidebar.tsx`

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Keyboard, Settings, Moon, Sun, Monitor } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ isOpen, onClose, onOpenShortcuts, onOpenSettings }: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          
          {/* Sidebar Panel */}
          <motion.aside
            className="sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header with Merge Effect */}
            <motion.div 
              className="sidebar-header"
              layoutId="menu-button" // Shared layoutId for merge effect
            >
              <button className="sidebar-close" onClick={onClose}>
                <X size={20} />
              </button>
              <span className="sidebar-title">Menu</span>
            </motion.div>

            {/* Navigation Items */}
            <nav className="sidebar-nav">
              <SidebarItem 
                icon={<Keyboard size={20} />} 
                label="Keyboard Shortcuts"
                onClick={onOpenShortcuts}
              />
            </nav>

            {/* Fixed Bottom Settings */}
            <div className="sidebar-footer">
              <SidebarItem 
                icon={<Settings size={20} />} 
                label="Settings"
                onClick={onOpenSettings}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SidebarItem({ icon, label, onClick }: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <motion.button
      className="sidebar-item"
      onClick={onClick}
      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="sidebar-item-icon">{icon}</span>
      <span className="sidebar-item-label">{label}</span>
    </motion.button>
  );
}
```

### 4.3 Hamburger Button with layoutId

**File:** `src/renderer/components/HamburgerButton.tsx`

```tsx
import { motion } from 'motion/react';
import { Menu } from 'lucide-react';

interface HamburgerButtonProps {
  onClick: () => void;
  isSidebarOpen: boolean;
}

export function HamburgerButton({ onClick, isSidebarOpen }: HamburgerButtonProps) {
  // When sidebar is closed, this button is visible with layoutId
  if (isSidebarOpen) return null;
  
  return (
    <motion.button
      className="hamburger-button"
      layoutId="menu-button" // Shared with sidebar header
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Menu size={20} />
    </motion.button>
  );
}
```

### 4.4 Sidebar Styles

```scss
.hamburger-button {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-primary);
  cursor: pointer;
  -webkit-app-region: no-drag;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 280px;
  height: 100vh;
  background: #1a1a1a;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--text-primary);
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
  
  &:hover {
    color: var(--text-primary);
  }
}
```

### 4.5 Keyboard Shortcuts Modal

**File:** `src/renderer/components/ShortcutsModal.tsx`

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl/⌘', 'T'], action: 'New Tab' },
  { keys: ['Ctrl/⌘', 'W'], action: 'Close Tab' },
  { keys: ['Ctrl/⌘', 'Tab'], action: 'Next Tab' },
  { keys: ['Ctrl/⌘', 'Shift', 'Tab'], action: 'Previous Tab' },
  { keys: ['Ctrl/⌘', '1-9'], action: 'Switch to Tab #' },
];

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="shortcuts-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          >
            <div className="modal-header">
              <h2>Keyboard Shortcuts</h2>
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <div className="shortcuts-list">
              {SHORTCUTS.map((shortcut, index) => (
                <motion.div
                  key={shortcut.action}
                  className="shortcut-row"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="shortcut-action">{shortcut.action}</span>
                  <div className="shortcut-keys">
                    {shortcut.keys.map((key, i) => (
                      <kbd key={i} className="key">{key}</kbd>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 4.6 Shortcuts Modal Styles (Game-Style UI)

```scss
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

.shortcuts-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: 90%;
  max-width: 480px;
  background: linear-gradient(145deg, #1e1e2e, #151520);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #a78bfa, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.shortcut-action {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.shortcut-keys {
  display: flex;
  gap: 6px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  background: linear-gradient(180deg, #2a2a3d 0%, #1f1f2e 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  box-shadow: 
    0 2px 0 rgba(0, 0, 0, 0.3),
    0 0 8px rgba(139, 92, 246, 0.15) inset;
}
```

---

## Phase 5: Dynamic Tab Interface

### 5.1 Visibility Logic

```typescript
const tabBarVisible = tabs.length > 1;
```

| Tab Count | Tab Bar | Content Area |
|-----------|---------|--------------|
| 0 | Hidden | Landing View |
| 1 | Hidden | Full-screen webview |
| 2+ | Visible | Webview below tab bar |

### 5.2 Tab Data Model

```typescript
interface Tab {
  id: string;           // UUID
  serviceId: string;    // 'chatgpt' | 'claude' | etc.
  title: string;        // Dynamic or service name
  url: string;          // Current URL
  iconUrl?: string;     // Favicon
  isNewTab?: boolean;   // Shows landing view
}
```

### 5.3 Draggable Tab Implementation with @dnd-kit

**File:** `src/renderer/components/TabBar.tsx`

```tsx
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface Tab {
  id: string;
  serviceId: string;
  title: string;
  iconUrl?: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabsReorder: (tabs: Tab[]) => void;
}

export function TabBar({ 
  tabs, 
  activeTabId, 
  onTabClick, 
  onTabClose, 
  onTabsReorder 
}: TabBarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevents accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((t) => t.id === active.id);
      const newIndex = tabs.findIndex((t) => t.id === over.id);
      onTabsReorder(arrayMove(tabs, oldIndex, newIndex));
    }
  }

  // Don't render if only one tab
  if (tabs.length <= 1) return null;

  return (
    <div className="tab-bar">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={tabs.map(t => t.id)} 
          strategy={horizontalListSortingStrategy}
        >
          {tabs.map((tab) => (
            <SortableTab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => onTabClick(tab.id)}
              onClose={() => onTabClose(tab.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface SortableTabProps {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

function SortableTab({ tab, isActive, onClick, onClose }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`tab ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      layout // Enables smooth position animations
    >
      {tab.iconUrl && (
        <img src={tab.iconUrl} alt="" className="tab-icon" />
      )}
      <span className="tab-name">{tab.title}</span>
      <button 
        className="tab-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
```

### 5.4 Tab Close Button Styles

```scss
.tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  padding-right: 32px; // Space for close button
  // ... existing styles ...
  
  .tab-close {
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s ease;
    
    &:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444; // Red on hover
    }
  }
  
  &:hover .tab-close {
    opacity: 1;
  }
  
  &.dragging {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    border-radius: 8px;
  }
}
```

### 5.5 Webview Container

**File:** `src/renderer/components/WebviewContainer.tsx`

```tsx
import { useEffect, useRef } from 'react';

interface WebviewContainerProps {
  tabs: Tab[];
  activeTabId: string;
}

export function WebviewContainer({ tabs, activeTabId }: WebviewContainerProps) {
  return (
    <div className="webview-container">
      {tabs.map((tab) => (
        <WebviewPanel
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
        />
      ))}
    </div>
  );
}

function WebviewPanel({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const webviewRef = useRef<HTMLElement>(null);

  // Handle DOM events
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDomReady = () => {
      // Inject any necessary CSS
      (webview as any).insertCSS(`
        html, body { 
          height: 100% !important;
          overflow: auto !important;
        }
      `);
    };

    webview.addEventListener('dom-ready', handleDomReady);
    return () => webview.removeEventListener('dom-ready', handleDomReady);
  }, []);

  return (
    <webview
      ref={webviewRef as any}
      src={tab.url}
      partition={`persist:${tab.serviceId}`}
      className={isActive ? 'active' : ''}
      style={{ display: isActive ? 'flex' : 'none' }}
    />
  );
}
```

---

## File Structure (Post-Implementation)

```
src/
├── main.ts                          # Main process entry
├── preload.ts                       # Context bridge
├── main/
│   └── store.ts                     # electron-store configuration
├── renderer/
│   ├── index.html
│   ├── App.tsx                      # Root component
│   ├── styles.scss                  # Global styles
│   ├── components/
│   │   ├── TitleBar.tsx             # Custom window controls
│   │   ├── HamburgerButton.tsx      # Menu trigger with layoutId
│   │   ├── Sidebar.tsx              # Navigation drawer
│   │   ├── ShortcutsModal.tsx       # Keyboard shortcuts dialog
│   │   ├── SettingsModal.tsx        # Settings dialog
│   │   ├── LandingView.tsx          # Zero-state / New Tab view
│   │   ├── TabBar.tsx               # Draggable tabs
│   │   └── WebviewContainer.tsx     # Service webviews
│   ├── hooks/
│   │   ├── usePersistedState.ts     # State sync with electron-store
│   │   ├── useDebounce.ts           # Debounce utility
│   │   └── useKeyboardShortcuts.ts  # Global shortcut listeners
│   └── types/
│       ├── electron.d.ts            # Window.electronAPI types
│       └── tabs.ts                  # Tab interfaces
└── assets/
    └── icons/                       # Service icons (SVG)
```

---

## Implementation Checklist

### Phase 1: Main Process & Security
- [ ] Configure frameless window with platform-specific title bar
- [ ] Remove application menu
- [ ] Implement secure webview creation handler
- [ ] Create preload script with IPC bridge
- [ ] Register global keyboard shortcuts
- [ ] Implement window control IPC handlers

### Phase 2: State Management
- [ ] Install and configure electron-store
- [ ] Define state schema with types
- [ ] Implement save/load IPC handlers
- [ ] Create usePersistedState hook
- [ ] Implement debounced state saving

### Phase 3: Landing View
- [ ] Create LandingView component
- [ ] Implement service card grid
- [ ] Add entrance animations with motion
- [ ] Connect service selection to tab creation

### Phase 4: Navigation Drawer
- [ ] Create HamburgerButton with layoutId
- [ ] Implement Sidebar with AnimatePresence
- [ ] Add backdrop blur overlay
- [ ] Create ShortcutsModal with game-style keys
- [ ] Implement Settings entry point

### Phase 5: Dynamic Tab Interface
- [ ] Install @dnd-kit packages
- [ ] Implement TabBar with conditional visibility
- [ ] Create SortableTab component
- [ ] Add close button with hover states
- [ ] Connect drag-end to state reordering
- [ ] Create WebviewContainer with partition support

---

## Performance Considerations

1. **Webview Memory:** Use `display: none` instead of conditional rendering to preserve webview state without memory overhead of multiple active renderers.

2. **State Debouncing:** Debounce state saves by 500ms to avoid excessive disk writes.

3. **Animation Performance:** Use `transform` and `opacity` for animations (GPU-accelerated), avoid animating `width`, `height`, or `margin`.

4. **Tab Limits:** Consider implementing a max tab limit (e.g., 10) to prevent memory issues.

---

## Security Summary

| Layer | Protection |
|-------|------------|
| Main ↔ Renderer | `contextBridge` with explicit API exposure |
| Renderer ↔ Webview | No `nodeIntegration`, isolated partitions |
| Webview Content | Sandboxed, URL allowlist enforced |
| External Links | Opened in system browser via `shell.openExternal` |
| Preload in Webviews | Stripped automatically |

---

## Appendix A: TypeScript Declarations

**File:** `src/renderer/types/electron.d.ts`

```typescript
export interface ElectronAPI {
  // Shortcuts
  onNewTab: (callback: () => void) => void;
  onCloseTab: (callback: () => void) => void;
  onNextTab: (callback: () => void) => void;
  onPrevTab: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
  
  // Window
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // Store
  saveState: (state: object) => Promise<boolean>;
  loadState: () => Promise<Record<string, unknown>>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

---

*Document generated for strict phase implementation by AI Coding Assistant.*
