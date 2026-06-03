import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, UrlTile, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatEventDate, formatPrice, formatVenue } from '@/components/EventCard';
import { type EventRecord, useNearbyEvents } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const defaultRegion: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

export default function ExploreRoute() {
  const nearbyEventsQuery = useNearbyEvents();
  const [region, setRegion] = useState<Region>(defaultRegion);
  const [searchText, setSearchText] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function requestCurrentLocation() {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!isMounted) return;

      if (!permission.granted) {
        setPermissionMessage('Location permission was not granted. Showing events with saved pins.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      if (!isMounted) return;

      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      });
    }

    requestCurrentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return (nearbyEventsQuery.data ?? []).filter((event) => {
      if (!event.latitude || !event.longitude) return false;
      if (!query) return true;

      return (event.city ?? '').toLowerCase().includes(query);
    });
  }, [nearbyEventsQuery.data, searchText]);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
      >
        <UrlTile urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" maximumZ={19} />
        {filteredEvents.map((event) => (
          <Marker
            key={event.id}
            coordinate={{ latitude: Number(event.latitude), longitude: Number(event.longitude) }}
            onPress={() => setSelectedEvent(event)}
          >
            <View style={styles.markerPin}>
              <Ionicons name="location" color={colors.onPrimary} size={18} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" color={colors.mutedSoft} size={18} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by city"
            placeholderTextColor={colors.mutedSoft}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
        </View>
        {permissionMessage ? <Text style={styles.permissionText}>{permissionMessage}</Text> : null}
      </View>

      {selectedEvent ? <MapMiniCard event={selectedEvent} /> : null}
    </SafeAreaView>
  );
}

function MapMiniCard({ event }: { event: EventRecord }) {
  return (
    <View style={styles.miniCard}>
      {event.cover_image_url ? (
        <Image source={{ uri: event.cover_image_url }} style={styles.miniImage} />
      ) : (
        <View style={styles.miniImagePlaceholder}><Text style={styles.miniImageText}>{event.title.charAt(0)}</Text></View>
      )}
      <View style={styles.miniBody}>
        <Text style={styles.miniTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.miniMeta} numberOfLines={1}>{formatEventDate(event.date)}</Text>
        <Text style={styles.miniMeta} numberOfLines={1}>{formatVenue(event)} - {formatPrice(event.price)}</Text>
      </View>
      <Pressable onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })} style={styles.viewButton}>
        <Text style={styles.viewButtonText}>View</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.base,
    right: spacing.base,
    gap: spacing.sm,
  },
  searchBar: {
    height: 56,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySm,
    color: colors.ink,
    minHeight: 48,
  },
  permissionText: {
    ...typography.captionSm,
    color: colors.muted,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  markerPin: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.canvas,
    ...shadow.card,
  },
  miniCard: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    bottom: spacing.lg,
    minHeight: 104,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    ...shadow.card,
  },
  miniImage: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
  },
  miniImagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  miniImageText: {
    ...typography.displaySm,
    color: colors.muted,
  },
  miniBody: {
    flex: 1,
    minWidth: 0,
  },
  miniTitle: {
    ...typography.titleMd,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  miniMeta: {
    ...typography.captionSm,
    color: colors.muted,
  },
  viewButton: {
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  viewButtonText: {
    ...typography.buttonSm,
    color: colors.onPrimary,
  },
});
