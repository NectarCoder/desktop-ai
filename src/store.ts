import Store from 'electron-store';

export interface TabState {
    id: string;
    serviceId: string; // 'chatgpt' | 'claude' | 'gemini' | etc.
    title: string;
    url: string;
    iconUrl?: string;
    isNewTab?: boolean;
}

export interface AppState {
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
        default: [] // Default items should be validated if complex, but array is fine
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
        default: undefined,
        properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' }
        }
    }
} as const;

export const store = new Store<AppState>({
    // @ts-ignore - Schema typing in electron-store can be strict, casting or ignoring to bypass for now if types conflict
    schema
});
