import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type Mode = 'light' | 'dark';

type ColorModeContextType = {
  mode: Mode;
  toggleMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

function buildTheme(mode: Mode) {
  const isDark = mode === 'dark';

  // Map provided palette
  const light = {
    primary: '#2E7D32',
    primaryDark: '#1B5E20',
    primaryLight: '#81C784',
    accent: '#4CAF50',
    bg: '#E8F5E9',
    surface: '#FFFFFF',
    surfaceAlt: '#f6fbf6',
    text: '#1B5E20',
    muted: '#33691E',
    border: '#d7e7d6',
    borderColor: '#e7efe8',
    borderColorStrong: '#d1e0d3',
    gradientSoftStart: '#f8fdf8',
    gradientSoftEnd: '#f0faf0',
    danger: '#e53e3e',
    dangerBg: '#fee2e2',
    shadow: '0 6px 20px rgba(0,0,0,0.08)',
    radius: 14,
  } as const;

  const dark = {
    primary: '#5ecf68',
    primaryDark: '#4cad53',
    primaryLight: '#91f3a2',
    accent: '#4CAF50',
    bg: '#0f1710',
    surface: '#18251a',
    surfaceAlt: '#1f2e21',
    text: '#e3f6e5',
    muted: '#a3c7a8',
    border: '#2f4732',
    borderColor: '#2f4732',
    borderColorStrong: '#223626',
    gradientSoftStart: 'rgba(20,40,20,0.6)',
    gradientSoftEnd: 'rgba(24,38,24,0.6)',
    danger: '#e53e3e',
    dangerBg: '#3b1111',
    shadow: '0 6px 20px rgba(0,0,0,0.55)',
    radius: 14,
  } as const;

  const c = isDark ? dark : light;

  const theme = createTheme({
    palette: {
      mode,
      primary: { main: c.primary, dark: c.primaryDark, light: c.primaryLight, contrastText: isDark ? '#0f1710' : '#ffffff' },
      secondary: { main: c.accent },
      background: { default: c.bg, paper: c.surface },
      text: { primary: c.text, secondary: c.muted },
      divider: c.borderColor,
      error: { main: c.danger },
    },
    shape: { borderRadius: c.radius },
    typography: {
      fontFamily: 'Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 700, letterSpacing: -0.5 },
      h2: { fontWeight: 700, letterSpacing: -0.5 },
      h3: { fontWeight: 700, letterSpacing: -0.3 },
      h4: { fontWeight: 700, letterSpacing: -0.2 },
      h5: { fontWeight: 600, letterSpacing: -0.1 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
    },
    shadows: [
      'none',
      c.shadow,
      c.shadow,
      c.shadow,
      c.shadow,
      c.shadow,
      ...Array(19).fill(c.shadow),
    ] as any,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--primary': light.primary,
            '--primary-dark': light.primaryDark,
            '--primary-light': light.primaryLight,
            '--accent': light.accent,
            '--bg': light.bg,
            '--surface': light.surface,
            '--surface-alt': light.surfaceAlt,
            '--text': light.text,
            '--muted': light.muted,
            '--border': light.border,
            '--border-color': light.borderColor,
            '--border-color-strong': light.borderColorStrong,
            '--gradient-soft-start': light.gradientSoftStart,
            '--gradient-soft-end': light.gradientSoftEnd,
            '--danger': light.danger,
            '--danger-bg': light.dangerBg,
            '--shadow': light.shadow,
            '--radius': `${light.radius}px`,
            '--maxw': '1100px',
            '--focus-ring': light.primaryLight,
            '--focus-outline': light.primaryLight,
          } as any,
          '[data-theme="dark"]': {
            '--primary': dark.primary,
            '--primary-dark': dark.primaryDark,
            '--primary-light': dark.primaryLight,
            '--accent': dark.accent,
            '--bg': dark.bg,
            '--surface': dark.surface,
            '--surface-alt': dark.surfaceAlt,
            '--text': dark.text,
            '--muted': dark.muted,
            '--border': dark.border,
            '--border-color': dark.borderColor,
            '--border-color-strong': dark.borderColorStrong,
            '--gradient-soft-start': dark.gradientSoftStart,
            '--gradient-soft-end': dark.gradientSoftEnd,
            '--danger': dark.danger,
            '--danger-bg': dark.dangerBg,
            '--shadow': dark.shadow,
            '--radius': `${dark.radius}px`,
            '--maxw': '1100px',
            '--focus-ring': dark.primaryLight,
            '--focus-outline': dark.primaryLight,
          } as any,
          body: {
            backgroundColor: c.bg,
            color: c.text,
            backgroundImage: `linear-gradient(180deg, var(--gradient-soft-start), var(--gradient-soft-end))`,
          },
          '*:focus-visible': {
            outlineColor: 'var(--focus-outline)',
            boxShadow: `0 0 0 3px ${alpha(isDark ? dark.primaryLight : light.primaryLight, 0.45)}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: `linear-gradient(90deg, ${c.primary} 0%, ${c.primaryLight} 100%)`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: c.surface,
          },
          rounded: { borderRadius: c.radius },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${c.borderColor}`,
            boxShadow: c.shadow,
            transition: 'transform 120ms ease, box-shadow 120ms ease',
            ':hover': {
              transform: 'translateY(-1px)',
              boxShadow: c.shadow,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: c.radius, paddingInline: 16, paddingBlock: 8 },
          outlinedPrimary: {
            borderColor: c.borderColor,
            ':hover': { borderColor: c.primaryLight, backgroundColor: alpha(c.primaryLight, isDark ? 0.12 : 0.08) },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': { borderColor: c.borderColor },
            ':hover .MuiOutlinedInput-notchedOutline': { borderColor: c.borderColorStrong },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: c.primaryLight },
            backgroundColor: c.surface,
          },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: c.border } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
    },
  });

  return theme;
}

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('app-color-mode') as Mode) || 'light');

  useEffect(() => {
    localStorage.setItem('app-color-mode', mode);
    try {
      document.documentElement.setAttribute('data-theme', mode);
    } catch {}
  }, [mode]);

  const value = useMemo<ColorModeContextType>(() => ({
    mode,
    toggleMode: () => setMode(prev => (prev === 'light' ? 'dark' : 'light')),
  }), [mode]);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider');
  return ctx;
}
