// Flutter-aligned palette for React (MUI)
// Mirrors flutter_app_itse500/lib/theme.dart

export const paletteFlutter = {
  appBackgroundColor: '#FFFAFA',
  appBarColor: '#1C1B1F',
  logoutButtonColor: '#C22527',
  deleteArchiveColor: '#DC8A1F',
  primaryAppColor: '#1976D2',
  socialButtonColor: '#064482',
  continueAsGuestColor: '#1C1B1F',
  userBubbleBgColor: '#E5E5E5',
  assistantBubbleBgColor: '#717171',
};

export function buildMuiThemes(mode) {
  // mode: 'light' | 'dark'
  const isDark = mode === 'dark';
  return {
    palette: {
      mode,
      primary: { main: paletteFlutter.primaryAppColor, contrastText: '#FFFFFF' },
      secondary: { main: paletteFlutter.socialButtonColor, contrastText: '#FFFFFF' },
      background: {
        default: isDark ? paletteFlutter.appBarColor : paletteFlutter.appBackgroundColor,
        paper: isDark ? paletteFlutter.appBarColor : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#FFFFFF' : '#000000',
      },
      error: { main: paletteFlutter.logoutButtonColor },
      warning: { main: paletteFlutter.deleteArchiveColor },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: (themeParam) => ({
          body: {
            backgroundColor: isDark ? paletteFlutter.appBarColor : paletteFlutter.appBackgroundColor,
            color: isDark ? '#FFFFFF' : '#000000',
          },
        }),
      },
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: paletteFlutter.appBarColor,
            color: '#FFFFFF',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'capitalize',
          },
          containedPrimary: {
            backgroundColor: paletteFlutter.primaryAppColor,
          },
          containedSecondary: {
            backgroundColor: paletteFlutter.socialButtonColor,
          },
        },
      },
      MuiTypography: {
        defaultProps: {
          color: 'text.primary',
        },
      },
    },
  };
}
