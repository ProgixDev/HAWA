import type {TextStyle} from 'react-native';

export const typography = {
  slogan: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 31,
    letterSpacing: 0.35,
  } satisfies TextStyle,
  welcomeTitle: {
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 38,
  } satisfies TextStyle,
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  } satisfies TextStyle,
} as const;
