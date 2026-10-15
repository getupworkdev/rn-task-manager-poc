export type ColorScheme = 'light' | 'dark';

const palette = {
  light: {
    background: '#F5F6FA',
    surface: '#FFFFFF',
    surfaceMuted: '#ECEEF4',
    border: '#DADDE7',
    text: '#151824',
    textMuted: '#5D6275',
    primary: '#3B5BDB',
    onPrimary: '#FFFFFF',
    danger: '#C92A2A',
    onDanger: '#FFFFFF',
    success: '#2B8A3E',
    warning: '#B35C00',
    skeleton: '#E3E6EE',
    toast: '#1F2333',
    onToast: '#FFFFFF',
    toastAction: '#9DB3FF',
  },
  dark: {
    background: '#0E1017',
    surface: '#171A24',
    surfaceMuted: '#222634',
    border: '#2D3242',
    text: '#EEF0F7',
    textMuted: '#A2A8BC',
    primary: '#7C95FF',
    onPrimary: '#0E1017',
    danger: '#FF6B6B',
    onDanger: '#0E1017',
    success: '#69DB7C',
    warning: '#FFB454',
    skeleton: '#252A38',
    toast: '#EEF0F7',
    onToast: '#151824',
    toastAction: '#3B5BDB',
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  space: { xs: number; sm: number; md: number; lg: number; xl: number };
  radius: { sm: number; md: number; lg: number; pill: number };
  font: { xs: number; sm: number; md: number; lg: number; xl: number };
};

export function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: palette[scheme],
    space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    radius: { sm: 6, md: 10, lg: 14, pill: 999 },
    font: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 },
  };
}
