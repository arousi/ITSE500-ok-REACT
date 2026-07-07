import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';
import { validateEnv } from './config/env';
import ErrorBoundary from './components/ErrorBoundary';
import { SecretKeysProvider } from './features/profile/contexts/SecretKeysContext';
import { CategoryProvider } from './features/profile/contexts/CategoryContext';
import { ActivateLLMsProviderReactProvider } from './features/profile/contexts/ActivateLLMsProviderContext';
import { DisplayConfigurationProvider } from './features/dashboard/contexts/DisplayConfigurationContext';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter} from "react-router-dom";
import { OptionStorageProvider } from './features/profile/contexts/OptionStorageContext';
import { ChatInferenceOptionProvider } from './features/settings/contexts/ChatInferenceOptionContext';
// SystemPromptProvider not used at app root
import { ThemeProvider } from './features/settings/contexts/ThemeContext';
import { LanguageProvider } from './features/settings/contexts/LanguageContext';
import { OpenFieldProvider } from './features/profile/contexts/OpenFieldContext';
// Fail loudly on missing production configuration instead of silently
// falling back to a dev host at runtime.
try {
  validateEnv();
} catch (e) {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.textContent = 'Configuration error: ' + (e?.message || 'missing environment configuration');
    rootEl.setAttribute('style', 'font-family:sans-serif;padding:2rem;color:#b00020');
  }
  throw e;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
   <ErrorBoundary>
   <OpenFieldProvider>
    <ActivateLLMsProviderReactProvider>
      <CategoryProvider>
        <OptionStorageProvider>
          <ChatInferenceOptionProvider>
            <ThemeProvider>
              <LanguageProvider>
              <SecretKeysProvider>
                <DisplayConfigurationProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </DisplayConfigurationProvider>
              </SecretKeysProvider>
              </LanguageProvider>
            </ThemeProvider>
          </ChatInferenceOptionProvider>
        </OptionStorageProvider>
      </CategoryProvider>
    </ActivateLLMsProviderReactProvider>
   </OpenFieldProvider>
   </ErrorBoundary>
    
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
