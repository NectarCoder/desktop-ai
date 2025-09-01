import React from 'react';
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
  return (
    <div className="app">
      <div className="tab-bar">
        <div className="tab active">ChatGPT</div>
      </div>
      <div className="content">
        <webview src="https://chatgpt.com" style={{ width: '100%', height: '100%', visibility: 'visible', position: 'absolute', top: 0, left: 0 }} />
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
