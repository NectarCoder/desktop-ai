export interface ElectronAPI {
    onNewTab: (callback: () => void) => void;
    onCloseTab: (callback: () => void) => void;
    onNextTab: (callback: () => void) => void;
    onPrevTab: (callback: () => void) => void;
    onTab1: (callback: () => void) => void;
    onTab2: (callback: () => void) => void;
    onTab3: (callback: () => void) => void;
    onTab4: (callback: () => void) => void;
    onTabLast: (callback: () => void) => void;

    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;

    saveState: (state: object) => Promise<boolean>;
    loadState: () => Promise<any>;

    removeAllListeners: (channel: string) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
