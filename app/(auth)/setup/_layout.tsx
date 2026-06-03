import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="vibe" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="photo" />
    </Stack>
  );
}
