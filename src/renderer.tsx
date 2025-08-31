import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => (
  <div>
    <h1>Welcome to DesktopAI</h1>
    <p>Add your AI shortcuts and start exploring!</p>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
