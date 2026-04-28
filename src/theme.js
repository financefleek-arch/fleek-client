// src/theme.js
// Matches the web app's CSS variables exactly

export const colors = {
  // Core palette
  navy:       '#0D1B2A',
  navyMid:    '#162033',
  navyLight:  '#1E2E45',
  navyHover:  '#243550',

  accent:     '#3B82F6',
  accentDim:  '#1D4ED8',

  green:      '#10B981',
  red:        '#EF4444',
  amber:      '#F59E0B',

  white:      '#FFFFFF',
  gray50:     '#F9FAFB',
  gray100:    '#F3F4F8',
  gray200:    '#E5E7EB',
  gray400:    '#9CA3AF',
  gray600:    '#6B7280',

  text:       '#111827',
  textMuted:  '#6B7280',

  // Backgrounds
  background: '#F3F4F8',
  card:       '#FFFFFF',
  cardBorder: '#E5E7EB',
};

export const fonts = {
  regular:  'DMSans_400Regular',
  medium:   'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  mono:     'DMSans_400Regular', // fallback until DM Mono loads
};

export const radius = {
  sm: 7,
  md: 10,
  lg: 14,
  xl: 18,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Avatar colours (deterministic from name)
const AVATAR_COLORS = [
  '#1E40AF','#047857','#7C3AED','#B45309',
  '#0F766E','#BE123C','#1D4ED8','#065F46'
];
export const avatarColor = (name = '') => {
  let h = 0;
  for (const c of name) h = (h << 5) - h + c.charCodeAt(0);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

// Format helpers
export const fmtL = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return '₹' + (v / 10000000).toFixed(2) + ' Cr';
  if (v >= 100000)   return '₹' + (v / 100000).toFixed(2) + ' L';
  return '₹' + v.toLocaleString('en-IN');
};

export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
