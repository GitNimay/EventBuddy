import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { useEventDetail } from '@/hooks/useEvents';
import { useGroupSummary, useGroupMembers } from '@/hooks/useGroupChat';
import { useLiveLocation, useUpdateLiveLocation } from '@/hooks/useSafety';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type LocationRow = {
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  is_sharing: boolean;
  last_updated: string;
  user: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

export default function LiveLocationRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const groupId = params.id;
  const summaryQuery = useGroupSummary(groupId);
  const membersQuery = useGroupMembers(groupId);
  const locationQuery = useLiveLocation(groupId);
  const updateLocationMutation = useUpdateLiveLocation();
  const [isSharing, setIsSharing] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);
  const event = summaryQuery.data?.event;
  const isEventToday = event ? isToday(event.date) : false;
  const locations = (locationQuery.data ?? []) as LocationRow[];
  const members = membersQuery.data ?? [];

  useEffect(() => {
    if (!isSharing || !groupId) return;

    const interval = setInterval(async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        updateLocationMutation.mutate({
          groupId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          isSharing: true,
        });
      } catch (_e) {}
    }, 10000);

    return () => clearInterval(interval);
  }, [isSharing, groupId]);

  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  async function toggleSharing() {
    if (isSharing) {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      updateLocationMutation.mutate(
        { groupId: groupId!, latitude: 0, longitude: 0, isSharing: false },
        { onSuccess: () => setIsSharing(false) },
      );
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please enable location access to share your position.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    updateLocationMutation.mutate(
      {
        groupId: groupId!,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        isSharing: true,
      },
      { onSuccess: () => setIsSharing(true) },
    );
  }

  const initialRegion = getInitialRegion(locations, members);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.mapWrap}>
        <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion} showsUserLocation={false}>
          {locations
            .filter((loc) => loc.is_sharing && loc.latitude && loc.longitude)
            .map((loc) => (
              <Marker
                key={loc.user_id}
                coordinate={{ latitude: loc.latitude!, longitude: loc.longitude! }}
                title={loc.user?.full_name ?? 'Buddy'}
              />
            ))}
        </MapView>

        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" color={colors.ink} size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title} numberOfLines={1}>{summaryQuery.data?.name ?? 'Live location'}</Text>
            <Text style={styles.subtitle}>{locations.filter((l) => l.is_sharing).length} sharing</Text>
          </View>
        </View>

        <View style={styles.memberList}>
          {members.map((member) => {
            const loc = locations.find((l) => l.user_id === member.user_id);
            const isOnline = loc?.is_sharing && loc?.latitude && loc?.longitude;
            const lastSeen = loc?.last_updated ? timeAgo(loc.last_updated) : null;

            return (
              <View key={member.id} style={styles.memberRow}>
                <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
                <Text style={styles.memberName} numberOfLines={1}>{member.user?.full_name ?? 'Buddy'}</Text>
                <Text style={styles.memberStatus}>{isOnline ? 'Sharing' : lastSeen ? `Last seen ${lastSeen}` : 'Not sharing'}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {isEventToday ? (
        <View style={styles.footer}>
          <Pressable onPress={toggleSharing} style={[styles.primaryButton, isSharing ? styles.stopButton : null]}>
            <Ionicons name={isSharing ? 'location' : 'location-outline'} color={colors.onPrimary} size={20} />
            <Text style={styles.primaryButtonLabel}>{isSharing ? 'Stop Sharing' : 'Share My Location'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.footer}>
          <View style={styles.disabledFooter}>
            <Ionicons name="time-outline" color={colors.muted} size={18} />
            <Text style={styles.disabledText}>Live location is only available on event day.</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function getInitialRegion(locations: LocationRow[], members: { user_id: string }[]) {
  const sharing = locations.filter((l) => l.is_sharing && l.latitude && l.longitude);
  if (sharing.length > 0) {
    const lat = sharing.reduce((sum, l) => sum + (l.latitude ?? 0), 0) / sharing.length;
    const lng = sharing.reduce((sum, l) => sum + (l.longitude ?? 0), 0) / sharing.length;
    return { latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  }
  return { latitude: 18.5204, longitude: 73.8567, latitudeDelta: 0.05, longitudeDelta: 0.05 };
}

function isToday(date: string) {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  headerBar: { position: 'absolute', top: spacing.md, left: spacing.base, right: spacing.base, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.canvas, borderRadius: radius.lg, padding: spacing.sm, ...({ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 } as any) },
  iconButton: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  headerCopy: { flex: 1 },
  title: { ...typography.titleMd, color: colors.ink },
  subtitle: { ...typography.captionSm, color: colors.muted },
  memberList: { position: 'absolute', bottom: 100, left: spacing.base, right: spacing.base, backgroundColor: colors.canvas, borderRadius: radius.lg, padding: spacing.base, gap: spacing.sm, ...({ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 } as any) },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: radius.full },
  onlineDot: { backgroundColor: colors.primary },
  offlineDot: { backgroundColor: colors.mutedSoft },
  memberName: { ...typography.bodySm, color: colors.ink, flex: 1 },
  memberStatus: { ...typography.captionSm, color: colors.muted },
  footer: { padding: spacing.base, paddingBottom: spacing.lg, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  primaryButton: { height: 50, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary },
  primaryButtonLabel: { ...typography.buttonMd, color: colors.onPrimary },
  stopButton: { backgroundColor: colors.ink },
  disabledFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 50, borderRadius: radius.sm, backgroundColor: colors.surfaceSoft },
  disabledText: { ...typography.bodySm, color: colors.muted },
});
