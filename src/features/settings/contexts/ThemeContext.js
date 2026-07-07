import { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

function getSystemTheme() {
    if (typeof window === "undefined") return "light";
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
    // 'theme' is the user's selected preference: 'light' | 'dark' | 'default'
    // 'default' means follow the OS/system preference
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    // Default is now explicit light mode (was "default" / system before)
    const [theme, setTheme] = useState(stored || "light");
    const [systemTheme, setSystemTheme] = useState(getSystemTheme());

    // listen for changes to the OS-level preference when using 'default'
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => setSystemTheme(e.matches ? "dark" : "light");
        if (mq.addEventListener) mq.addEventListener('change', handler);
        else mq.addListener(handler);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', handler);
            else mq.removeListener(handler);
        };
    }, []);

    // persist the user's preference (not the resolved effective theme)
    useEffect(() => {
        try {
            if (typeof window !== "undefined") localStorage.setItem("theme", theme);
        } catch (e) {
            // ignore storage errors
        }
    }, [theme]);

    const effectiveTheme = theme === "default" ? systemTheme : theme;

    // apply the resolved theme to the document (for CSS hooks)
    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.setAttribute('data-theme', effectiveTheme);
        }
    }, [effectiveTheme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
