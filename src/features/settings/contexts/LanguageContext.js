import { createContext, useState, useCallback, useEffect } from "react";
import i18n from "../../../i18n";

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState(i18n.resolvedLanguage || i18n.language || "en");

    const setLanguage = useCallback((lng) => {
        // changeLanguage also updates <html dir/lang> via the i18n listener in src/i18n.
        i18n.changeLanguage(lng);
        setLanguageState(lng);
    }, []);

    // Keep context state in sync if the language changes elsewhere (the detector
    // resolving async after mount, or any other caller of i18n.changeLanguage).
    useEffect(() => {
        const handler = (lng) => setLanguageState(lng);
        i18n.on('languageChanged', handler);
        return () => i18n.off('languageChanged', handler);
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}