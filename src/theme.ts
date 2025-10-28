import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32',
      light: '#60ad5e',
      dark: '#005005',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#66bb6a',
      light: '#98ee99',
      dark: '#338a3e',
      contrastText: '#0f4221',
    },
    background: {
      default: '#f7fbf8', // light, fresh background with a hint of green
      paper: '#ffffff',
    },
    text: {
      primary: '#0f1b14',
      secondary: '#3a4a3f',
    },
    divider: '#e6f0e8',
  },
  shape: {
    borderRadius: 12,
  },
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
    '0 1px 2px rgba(0,0,0,0.04)',
    '0 2px 6px rgba(15,27,20,0.06)',
    '0 4px 10px rgba(15,27,20,0.08)',
    '0 6px 14px rgba(15,27,20,0.10)',
    '0 8px 20px rgba(15,27,20,0.12)',
    ...Array(19).fill('0 8px 20px rgba(15,27,20,0.12)'),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f7fbf8',
          backgroundImage:
            `radial-gradient(${alpha('#98ee99', 0.18)} 1px, transparent 1px),` +
            `radial-gradient(${alpha('#e6f0e8', 0.35)} 1px, transparent 1px)`,
          backgroundSize: '24px 24px, 48px 48px',
          backgroundPosition: '0 0, 12px 12px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(90deg, #2e7d32 0%, #60ad5e 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          paddingInline: 16,
          paddingBlock: 8,
        },
        containedPrimary: {
          boxShadow: '0 6px 14px rgba(46,125,50,0.22)',
          ':hover': {
            boxShadow: '0 10px 18px rgba(46,125,50,0.28)',
          },
        },
        outlinedPrimary: {
          borderColor: '#cfe8d2',
          ':hover': { borderColor: '#98ee99', backgroundColor: alpha('#98ee99', 0.08) },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e6f0e8',
          boxShadow: '0 4px 14px rgba(15,27,20,0.06)',
          transition: 'transform 120ms ease, box-shadow 120ms ease',
          ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 8px 22px rgba(15,27,20,0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e1efe4' },
          ':hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b7e3c0' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#60ad5e' },
          backgroundColor: '#ffffff',
        },
      },
    },
  },
});

export default theme;
