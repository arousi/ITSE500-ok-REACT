import { createContext, useState, useCallback } from "react";
import i18n from "../../../i18n";

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState(i18n.resolvedLanguage || i18n.language || "en");

    const setLanguage = useCallback((lng) => {
        // changeLanguage also updates <html dir/lang> via the i18n listener in src/i18n.
        i18n.changeLanguage(lng);
        setLanguageState(lng);
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}