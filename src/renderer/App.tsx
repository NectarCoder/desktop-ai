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

const App: React.FC = () => {
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    const w = webviewRef.current;
    if (!w) return;

    const inject = () => {
      try {
        // CSS to force the remote document to occupy full height and remove margins
        const css = `html, body { height: 100% !important; min-height: 100% !important; margin: 0 !important; padding: 0 !important; }
                    body { overflow: auto !important; }`;

        if (typeof w.insertCSS === 'function') {
          w.insertCSS(css);
        } else if (typeof w.executeJavaScript === 'function') {
          // Fallback: append a <style> element inside the webview's document
          const escaped = css.replace(/`/g, '\\`').replace(/\\/g, '\\\\');
          w.executeJavaScript(`(function(){var s=document.createElement('style');s.id='injected-webview-style';s.innerHTML=\`${escaped}\`;document.head.appendChild(s);})();`);
        }
      } catch (e) {
        // ignore injection errors
        console.error('webview injection error', e);
      }
    };

    // dom-ready is fired when the guest page is ready
    w.addEventListener('dom-ready', inject as EventListener);

    return () => {
      try {
        w.removeEventListener('dom-ready', inject as EventListener);
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  return (
    <div className="app">
      <div className="tab-bar">
        <div className="tab active">ChatGPT</div>
      </div>
      <div className="content">
        <webview ref={webviewRef} src="https://chatgpt.com" className="active" />
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
