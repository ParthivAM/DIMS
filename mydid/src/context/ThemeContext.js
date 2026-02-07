import React, { createContext, useContext, useState, useEffect } from 'react';

export const navyMirageTheme = {
    primary: "#35577D",
    primaryDark: "#141E30",
    backgroundLight: "#EEF2F6",
    backgroundDark: "#0B1220",
    gradientDark: "linear-gradient(135deg, #141E30, #35577D)",
    cardLight: "#FFFFFF",
    cardDark: "#111827",
    borderLight: "#CBD5E1",
    borderDark: "#1F2933",
    textLightPrimary: "#111827",
    textLightMuted: "#4B5563",
    textDarkPrimary: "#F9FAFB",
    textDarkMuted: "#9CA3AF",
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
};

const ThemeContext = createContext({
    isDarkMode: false,
    toggleTheme: () => { },
    theme: navyMirageTheme,
});

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        const root = document.documentElement;
        const theme = navyMirageTheme;

        if (isDarkMode) {
            root.style.setProperty('--bg-primary', theme.backgroundDark);
            root.style.setProperty('--bg-card', theme.cardDark);
            root.style.setProperty('--text-primary', theme.textDarkPrimary);
            root.style.setProperty('--text-muted', theme.textDarkMuted);
            root.style.setProperty('--border-color', theme.borderDark);
            root.style.setProperty('--primary', theme.primary);
            root.style.setProperty('--primary-dark', theme.primaryDark);
            root.classList.add('dark');
        } else {
            root.style.setProperty('--bg-primary', theme.backgroundLight);
            root.style.setProperty('--bg-card', theme.cardLight);
            root.style.setProperty('--text-primary', theme.textLightPrimary);
            root.style.setProperty('--text-muted', theme.textLightMuted);
            root.style.setProperty('--border-color', theme.borderLight);
            root.style.setProperty('--primary', theme.primary);
            root.style.setProperty('--primary-dark', theme.primaryDark);
            root.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme: navyMirageTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}