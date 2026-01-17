import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.scss';

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
  const [activeTabId, setActiveTabId] = React.useState<string>(TABS[0].id);

  // Helper to inject CSS into webviews to ensure they look clean
  const handleDomReady = (event: any) => {
    const webview = event.target;
    if (!webview) return;

    // Inject CSS to remove potential scrollbars on the body if they aren't needed
    // and ensure height is 100%
    const css = `
      html, body { 
        height: 100% !important; 
        width: 100% !important;
        margin: 0 !important; 
        padding: 0 !important;
        overflow: hidden !important; /* Let the scrollable container scroll, not body */
      }
      /* Many SPAs scroll a wrapper div, this generic fix helps some, 
         but we should be careful not to break scrolling. 
         'overflow: auto' on body is usually safer than hidden. 
      */
      body { overflow: auto !important; }
      
      /* Hide some common headers if desired ? */
    `;

    try {
      webview.insertCSS(css);
    } catch (err) {
      console.error('Failed to inject CSS', err);
    }
  };

  return (
    <div className="app">
      <div className="tab-bar">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {/* Placeholder for icon if we had one */}
            <span className="tab-name">{tab.name}</span>
          </div>
        ))}
      </div>
      <div className="content">
        {TABS.map((tab) => (
          <webview
            key={tab.id}
            src={tab.url}
            className={activeTabId === tab.id ? 'active' : ''}
            // @ts-ignore - webview types are tricky
            onDomReady={handleDomReady}
            // Essential to keep the state alive while hidden
            permissionrequest="true"
          />
        ))}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
