import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AcademicYearProvider } from './lib/AcademicYearContext';
import { ColorModeProvider } from './lib/ColorModeContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <HashRouter>
      <ColorModeProvider>
        <AcademicYearProvider>
          <App />
        </AcademicYearProvider>
      </ColorModeProvider>
    </HashRouter>
  </React.StrictMode>
);
