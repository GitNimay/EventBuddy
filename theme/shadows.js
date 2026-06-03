import { Platform } from 'react-native';

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: {
      elevation: 3,
    },
  }),
  cardHover: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
    },
    android: {
      elevation: 6,
    },
  }),
};

export const shadows = {
  sm: shadow.card,
  md: shadow.cardHover,
};

export default shadows;
