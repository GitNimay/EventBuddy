import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_SEEN_KEY = 'onboarding_seen';

export async function getOnboardingSeen() {
  const value = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);

  return value === 'true';
}

export async function setOnboardingSeen() {
  await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
}
