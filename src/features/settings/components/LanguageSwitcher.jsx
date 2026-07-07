import { useContext } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { LanguageContext } from '../contexts/LanguageContext';

// Compact EN/AR toggle. Switching updates i18n + <html dir/lang> + MUI direction
// (via LanguageContext -> i18n.changeLanguage and App.js direction wiring).
export default function LanguageSwitcher({ size = 'small' }) {
  const { language, setLanguage } = useContext(LanguageContext) || {};
  const current = String(language || 'en').split('-')[0];
  return (
    <ToggleButtonGroup
      size={size}
      exclusive
      value={current}
      onChange={(_e, val) => { if (val) setLanguage(val); }}
      aria-label="language"
    >
      <ToggleButton value="en" aria-label="English">EN</ToggleButton>
      <ToggleButton value="ar" aria-label="العربية">ع</ToggleButton>
    </ToggleButtonGroup>
  );
}
