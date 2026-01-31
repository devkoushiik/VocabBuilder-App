// Theme colors for light and dark modes
export const lightTheme = {
  // Backgrounds
  background: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',

  // Text
  text: '#1f2937',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  textMuted: '#94a3b8',

  // Borders
  border: '#e2e8f0',
  borderLight: '#e0e7ff',
  borderMedium: '#cbd5f5',

  // Primary colors (blue)
  primary: '#2563eb',
  primaryDark: '#1e40af',
  primaryLight: '#3b82f6',
  primaryLighter: '#60a5fa',

  // Accent colors
  accent: '#1e40af',
  accentLight: '#3b82f6',

  // UI elements
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  chipBg: 'transparent',
  chipBorder: '#94a3b8',

  // Status colors
  success: '#16a34a',
  error: '#dc2626',
  warning: '#f97316',

  // Special
  heroBg: '#1e40af',
  quoteBg: '#eff6ff',
  filterBg: '#eef2ff',
  loadingText: '#64748b',

  // Flashcard
  flashcardBg: '#eff6ff',
  flashcardBorder: '#dbeafe',
  flashcardLabel: '#1e40af',
  flashcardValue: '#1e3a8a',
  flashcardHint: '#3b82f6',

  // Buttons (same design, theme-driven colors)
  backButtonBg: '#f1f5f9',
  backButtonBorder: '#e2e8f0',
  filterToggleBg: '#e0f2fe',
  filterToggleText: '#0369a1',
  rangeButtonBorder: '#94a3b8',
  rangeButtonText: '#475569',
  rangeButtonActiveBg: '#1d4ed8',
  rangeButtonActiveBorder: '#1d4ed8',
  rangeButtonActiveText: '#fff',
  practiceNavPrevBg: '#f97316',
  practiceNavNextBg: '#a855f7',
  practiceNavText: '#fff',
  clearAllButtonBg: '#fee2e2',
  clearAllButtonBorder: '#dc2626',
  doneListReturnAllBg: '#ecfdf5',
  doneListReturnAllBorder: '#a7f3d0',
  doneListReturnAllText: '#059669',
  doneListClearAllBg: '#fef2f2',
  doneListClearAllBorder: '#fecaca',
  doneListClearAllText: '#dc2626',
  doneListRemoveBorder: '#e2e8f0',
  doneListRemoveText: '#dc2626',
};

export const darkTheme = {
  // Backgrounds - Dark, White, Red scheme
  background: '#000000', // Pure Dark/Black - deepest background
  surface: '#1A1A1A', // Very dark gray - secondary surface
  card: '#0D0D0D', // Near black - card background

  // Text - White for contrast
  text: '#FFFFFF', // Pure White - primary text
  textSecondary: '#F5F5F5', // Off-white - secondary text
  textTertiary: '#E0E0E0', // Light gray - tertiary text
  textMuted: '#B0B0B0', // Medium gray - muted text

  // Borders - Dark shades
  border: '#1A1A1A', // Very dark gray border
  borderLight: '#2A2A2A', // Slightly lighter border
  borderMedium: '#1A1A1A', // Dark border

  // Primary colors - Red accent
  primary: '#FF0000', // Pure Red - main accent
  primaryDark: '#CC0000', // Darker red
  primaryLight: '#FF3333', // Lighter red
  primaryLighter: '#FF6666', // Very light red

  // Accent colors - Red
  accent: '#FF0000', // Pure Red accent
  accentLight: '#FF3333', // Light red accent

  // UI elements
  inputBg: '#1A1A1A', // Very dark gray - match surface
  inputBorder: '#2A2A2A', // Slightly lighter border
  chipBg: '#0D0D0D', // Near black - match card
  chipBorder: '#1A1A1A', // Very dark gray border

  // Status colors
  success: '#00FF00', // Green
  error: '#FF0000', // Pure Red (matches accent)
  warning: '#FFA500', // Orange

  // Special
  heroBg: '#000000', // Pure Dark/Black
  quoteBg: '#0D0D0D', // Near black - match card
  filterBg: '#000000', // Pure Dark/Black - filter background
  loadingText: '#FFFFFF', // Pure White

  // Flashcard
  flashcardBg: '#0D0D0D', // Near black - match card background
  flashcardBorder: '#2C2C2E', // Lighter border
  flashcardLabel: '#FF453A', // Softer Red
  flashcardValue: '#FFFFFF', // Pure White
  flashcardHint: '#FF6961', // Soft pastel red

  // Gradient colors for borders - Dark, White, Red
  gradientStart: '#000000', // Pure Dark/Black
  gradientMiddle: '#FF0000', // Pure Red accent
  gradientEnd: '#1A1A1A', // Very dark gray

  // Buttons (same design, theme-driven colors - flipped for dark)
  backButtonBg: 'rgba(255,255,255,0.08)',
  backButtonBorder: 'rgba(255,255,255,0.12)',
  filterToggleBg: '#1A1A1A',
  filterToggleText: '#FFFFFF',
  rangeButtonBorder: '#2A2A2A',
  rangeButtonText: '#B0B0B0',
  rangeButtonActiveBg: '#FF0000',
  rangeButtonActiveBorder: '#FF0000',
  rangeButtonActiveText: '#fff',
  practiceNavPrevBg: '#f97316',
  practiceNavNextBg: '#a855f7',
  practiceNavText: '#fff',
  clearAllButtonBg: 'rgba(255,0,0,0.15)',
  clearAllButtonBorder: '#FF0000',
  doneListReturnAllBg: 'rgba(0,255,0,0.15)',
  doneListReturnAllBorder: 'rgba(0,255,0,0.3)',
  doneListReturnAllText: '#4ade80',
  doneListClearAllBg: 'rgba(255,0,0,0.1)',
  doneListClearAllBorder: 'rgba(255,0,0,0.25)',
  doneListClearAllText: '#f87171',
  doneListRemoveBorder: 'rgba(255,255,255,0.25)',
  doneListRemoveText: '#FF0000',
};

