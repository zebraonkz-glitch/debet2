import { Colors } from './colors';

export const Theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  typography: {
    title: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: Colors.text,
    },
    section: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: Colors.text,
    },
    body: {
      fontSize: 15,
      color: Colors.text,
    },
    caption: {
      fontSize: 13,
      color: Colors.textMuted,
    },
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
} as const;
