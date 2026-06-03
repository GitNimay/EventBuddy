import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ChatRoute() {
  const params = useLocalSearchParams<{ groupId?: string }>();

  return <Redirect href={{ pathname: '/group/[id]/chat', params: { id: params.groupId ?? '' } }} />;
}
