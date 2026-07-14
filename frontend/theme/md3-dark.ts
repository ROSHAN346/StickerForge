import { createTheme } from '@mui/material/styles'
import { roboto } from '@/lib/fonts'

export const md3DarkTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    primary: {
      main: '#b388ff',
      light: '#d4baff',
      dark: '#8c5eff',
      contrastText: '#1a0033',
    },
    secondary: {
      main: '#ff4081',
      light: '#ff7996',
      dark: '#c60055',
      contrastText: '#1a0011',
    },
    error: {
      main: '#ff5252',
      light: '#ff867f',
      dark: '#c50e0e',
      contrastText: '#1a0000',
    },
    warning: {
      main: '#ffd93d',
      light: '#ffe97a',
      dark: '#caae00',
      contrastText: '#1a1500',
    },
    info: {
      main: '#40c4ff',
      light: '#82eaff',
      dark: '#0094cc',
      contrastText: '#001a24',
    },
    success: {
      main: '#69f0ae',
      light: '#b5f5c8',
      dark: '#1de9b6',
      contrastText: '#003311',
    },
    background: {
      default: '#0a0a0f',
      paper: '#15131f',
    },
    text: {
      primary: '#f5f0ff',
      secondary: '#a89eb8',
      disabled: '#5a5070',
    },
    divider: 'rgba(179, 136, 255, 0.12)',
    action: {
      active: '#b388ff',
      hover: 'rgba(179, 136, 255, 0.08)',
      selected: 'rgba(179, 136, 255, 0.12)',
      disabled: '#5a5070',
      disabledBackground: '#1a1726',
    },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: { fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.3rem', fontWeight: 600 },
    h6: { fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.01em' },
    subtitle1: { fontSize: '1rem', fontWeight: 600, letterSpacing: '0.005em' },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.005em' },
    body1: { fontSize: '1rem', fontWeight: 400, letterSpacing: '0.01em' },
    body2: { fontSize: '0.875rem', fontWeight: 400, letterSpacing: '0.015em' },
    button: { fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'none' },
    caption: { fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.02em' },
    overline: { fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0f',
          backgroundImage: 'none',
          minHeight: '100vh',
          overflowX: 'hidden',
          '& *': {
            WebkitTapHighlightColor: 'transparent',
          },
        },
        '*::-webkit-scrollbar': {
          width: '6px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(179, 136, 255, 0.3)',
          borderRadius: '3px',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 28,
          minHeight: 52,
          paddingInline: 28,
          fontSize: '0.95rem',
          fontWeight: 700,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        contained: {
          background: 'linear-gradient(135deg, #b388ff 0%, #ff4081 100%)',
          boxShadow: '0 4px 20px rgba(179, 136, 255, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 28px rgba(255, 64, 129, 0.4)',
            transform: 'translateY(-2px) scale(1.02)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
            boxShadow: '0 2px 10px rgba(179, 136, 255, 0.2)',
          },
          '&.Mui-disabled': {
            background: 'rgba(179, 136, 255, 0.15)',
            color: 'rgba(245, 240, 255, 0.3)',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderWidth: 2,
          borderColor: 'rgba(179, 136, 255, 0.3)',
          color: '#b388ff',
          '&:hover': {
            borderWidth: 2,
            borderColor: '#b388ff',
            backgroundColor: 'rgba(179, 136, 255, 0.06)',
            transform: 'translateY(-1px)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(179, 136, 255, 0.06)',
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(21, 19, 31, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundImage: 'none',
          border: '1px solid rgba(179, 136, 255, 0.1)',
          borderRadius: 24,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(21, 19, 31, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: 'rgba(21, 19, 31, 0.6)',
          backdropFilter: 'blur(10px)',
          '& fieldset': {
            borderColor: 'rgba(179, 136, 255, 0.15)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(179, 136, 255, 0.35)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#b388ff',
            borderWidth: 2,
            boxShadow: '0 0 0 4px rgba(179, 136, 255, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
        },
        filled: {
          backgroundColor: 'rgba(179, 136, 255, 0.12)',
          color: '#b388ff',
          '&:hover': {
            backgroundColor: 'rgba(179, 136, 255, 0.18)',
          },
        },
        outlined: {
          borderColor: 'rgba(179, 136, 255, 0.2)',
          '&:hover': {
            backgroundColor: 'rgba(179, 136, 255, 0.06)',
          },
        },
        clickable: {
          '&:active': {
            transform: 'scale(0.96)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:active': {
            transform: 'scale(0.9)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(21, 19, 31, 0.92)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: 32,
          border: '1px solid rgba(179, 136, 255, 0.1)',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiPaper-root': {
            backgroundColor: 'rgba(21, 19, 31, 0.92)',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            color: '#f5f0ff',
            border: '1px solid rgba(179, 136, 255, 0.15)',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: 'rgba(179, 136, 255, 0.1)',
          height: 8,
        },
        bar: {
          borderRadius: 8,
          background: 'linear-gradient(90deg, #b388ff, #ff4081)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 10, 15, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(179, 136, 255, 0.08)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(21, 19, 31, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 10,
          fontSize: '0.75rem',
          padding: '8px 14px',
          border: '1px solid rgba(179, 136, 255, 0.15)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: '#b388ff',
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#8c5eff',
          },
        },
      },
    },
    MuiPopper: {
      styleOverrides: {
        root: {
          zIndex: 1300,
        },
      },
    },
  },
})
