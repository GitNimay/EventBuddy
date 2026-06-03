export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const fontFamily = {
  ...fonts,
  semibold: fonts.semiBold,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const lineHeight = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
};

export const typography = {
  displayXl: { fontSize: 28, fontFamily: fonts.bold, lineHeight: 40 },
  displayLg: { fontSize: 22, fontFamily: fonts.medium, lineHeight: 26 },
  displayMd: { fontSize: 21, fontFamily: fonts.bold, lineHeight: 30 },
  displaySm: { fontSize: 20, fontFamily: fonts.semiBold, lineHeight: 24 },
  ratingDisplay: { fontSize: 64, fontFamily: fonts.bold, lineHeight: 70 },
  titleMd: { fontSize: 16, fontFamily: fonts.semiBold, lineHeight: 20 },
  titleSm: { fontSize: 16, fontFamily: fonts.medium, lineHeight: 20 },
  bodyMd: { fontSize: 16, fontFamily: fonts.regular, lineHeight: 24 },
  bodySm: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  caption: { fontSize: 14, fontFamily: fonts.medium, lineHeight: 18 },
  captionSm: { fontSize: 13, fontFamily: fonts.regular, lineHeight: 16 },
  badge: { fontSize: 11, fontFamily: fonts.semiBold, lineHeight: 13 },
  microLabel: { fontSize: 12, fontFamily: fonts.bold, lineHeight: 16 },
  uppercaseTag: { fontSize: 8, fontFamily: fonts.bold, lineHeight: 10, letterSpacing: 0.32, textTransform: 'uppercase' },
  buttonMd: { fontSize: 16, fontFamily: fonts.medium, lineHeight: 20 },
  buttonSm: { fontSize: 14, fontFamily: fonts.medium, lineHeight: 20 },
  navLink: { fontSize: 16, fontFamily: fonts.semiBold, lineHeight: 20 },
  fontFamily,
  fontSize,
  lineHeight,
};

export default typography;
