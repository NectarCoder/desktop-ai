import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.scss';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { usePersistedState } from './hooks/usePersistedState';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: any;
    }
  }
}

interface TabData {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

const TABS: TabData[] = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com' },
];

const App: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<string>(TABS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist the active tab
  usePersistedState('activeTabId', activeTabId, setActiveTabId);
  // Persist sidebar state
  usePersistedState('sidebarCollapsed', !sidebarOpen, (collapsed) => setSidebarOpen(!collapsed));

  const handleDomReady = (event: any) => {
    const webview = event.target;
    if (!webview) return;
    if (typeof webview.insertCSS === 'function') {
      const css = `
          html, body { 
            height: 100% !important; 
            width: 100% !important;
            margin: 0 !important; 
            padding: 0 !important;
            overflow: hidden !important; 
          }
          body { overflow: auto !important; }
        `;
      webview.insertCSS(css).catch((e: any) => console.error(e));
    }
  };

  return (
    <div className="app">
      <TitleBar
        onMenuClick={() => setSidebarOpen(true)}
        isSidebarOpen={sidebarOpen}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenShortcuts={() => console.log('Shortcuts clicked')}
        onOpenSettings={() => console.log('Settings clicked')}
      />

      <div style={{ height: '44px', flexShrink: 0 }}></div>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="tab-name">{tab.name}</span>
          </div>
        ))}
      </div>

      <div className="content">
        {TABS.map((tab) => (
          <webview
            key={tab.id}
            src={tab.url}
            partition={`persist:${tab.id}`}
            className={activeTabId === tab.id ? 'active' : ''}
            // @ts-ignore
            onDomReady={handleDomReady}
            // @ts-ignore
            allowpopups="true"
            // @ts-ignore
            webpreferences="contextIsolation=true, nodeIntegration=false"
          />
        ))}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
