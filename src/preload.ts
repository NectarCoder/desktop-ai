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
    onTab1: (callback: () => void) => ipcRenderer.on('shortcut:tab-1', callback),
    onTab2: (callback: () => void) => ipcRenderer.on('shortcut:tab-2', callback),
    onTab3: (callback: () => void) => ipcRenderer.on('shortcut:tab-3', callback),
    onTab4: (callback: () => void) => ipcRenderer.on('shortcut:tab-4', callback),
    onTabLast: (callback: () => void) => ipcRenderer.on('shortcut:tab-last', callback),

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
