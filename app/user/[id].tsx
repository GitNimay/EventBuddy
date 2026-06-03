import { useLocalSearchParams } from 'expo-router';

import { BuddyProfileScreen } from '@/components/BuddyProfileScreen';

export default function UserProfileRoute() {
  const params = useLocalSearchParams<{ id?: string }>();

  return <BuddyProfileScreen userId={params.id} />;
}
