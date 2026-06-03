import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEventRecaps, useCreateRecap } from '@/hooks/useRecaps';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const MAX_PHOTOS = 3;
const MAX_CAPTION = 300;

export default function RecapScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.authUser?.id;
  const recapsQuery = useEventRecaps(eventId);
  const createRecapMutation = useCreateRecap();

  const [photos, setPhotos] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  async function pickPhotos() {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Alert.alert('Maximum photos', `You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      const validUris: string[] = [];

      for (const asset of result.assets) {
        if (!validTypes.includes(asset.mimeType ?? '')) {
          Alert.alert('Invalid file type', 'Only JPG, PNG, and WebP images are allowed.');
          continue;
        }
        if (asset.fileSize && asset.fileSize > maxSize) {
          Alert.alert('File too large', 'Each photo must be under 5MB.');
          continue;
        }
        validUris.push(asset.uri);
      }

      setPhotos((prev) => [...prev, ...validUris].slice(0, MAX_PHOTOS));
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadToCloudinary(uri: string): Promise<string | null> {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return null;

    const formData = new FormData();
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    formData.append('file', { uri, type: mime, name: `recap.${ext}` } as unknown as Blob);
    formData.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      return json.secure_url ?? null;
    } catch {
      return null;
    }
  }

  async function handlePost() {
    if (!userId || !eventId) return;
    if (photos.length === 0) {
      Alert.alert('No photos', 'Please select at least one photo.');
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const uri of photos) {
        const url = await uploadToCloudinary(uri);
        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length === 0) {
        Alert.alert('Upload failed', 'Could not upload photos. Please try again.');
        return;
      }

      await createRecapMutation.mutateAsync({
        event_id: eventId,
        user_id: userId,
        photo_urls: uploadedUrls,
        caption: caption.trim() || undefined,
      });

      Alert.alert('Recap posted!', 'Your event recap is now live.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Post failed', e?.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleShare() {
    if (!(await Sharing.isAvailableAsync())) return;
    await Sharing.shareAsync('https://eventbuddy.app', {
      dialogTitle: 'Share your EventBuddy recap',
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Share your recap</Text>
        <Pressable onPress={handleShare} style={styles.iconBtn}>
          <Ionicons name="share-outline" color={colors.primary} size={22} />
        </Pressable>
      </View>

      <FlatList
        data={recapsQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Pressable onPress={pickPhotos} style={styles.addPhotoBtn}>
              <Ionicons name="camera-outline" color={colors.primary} size={32} />
              <Text style={styles.addPhotoText}>
                Add photos ({photos.length}/{MAX_PHOTOS})
              </Text>
            </Pressable>

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((uri, i) => (
                  <View key={i} style={styles.photoWrap}>
                    <Image source={{ uri }} style={styles.photo} />
                    <Pressable onPress={() => removePhoto(i)} style={styles.removePhoto}>
                      <Ionicons name="close-circle" color={colors.error} size={22} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              placeholderTextColor={colors.mutedSoft}
              multiline
              maxLength={MAX_CAPTION}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{caption.length}/{MAX_CAPTION}</Text>

            <Pressable
              onPress={handlePost}
              disabled={uploading || photos.length === 0}
              style={[styles.postBtn, (uploading || photos.length === 0) && styles.postBtnDisabled]}
            >
              {uploading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.postBtnText}>Post Recap</Text>
              )}
            </Pressable>

            {recapsQuery.data && recapsQuery.data.length > 0 && (
              <Text style={styles.recapsTitle}>Recent recaps</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.recapCard}>
            <View style={styles.recapHeader}>
              <Text style={styles.recapUser}>{item.user?.full_name ?? 'A buddy'}</Text>
              <Text style={styles.recapTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            {item.photo_urls.length > 0 && (
              <Image source={{ uri: item.photo_urls[0] }} style={styles.recapImage} />
            )}
            {item.caption ? <Text style={styles.recapCaption}>{item.caption}</Text> : null}
          </View>
        )}
        ListEmptyComponent={
          recapsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  headerTitle: { ...typography.titleMd, color: colors.ink },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.base, paddingBottom: 100 },
  addPhotoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceSoft,
    paddingVertical: spacing.xl,
    marginBottom: spacing.base,
  },
  addPhotoText: { ...typography.bodySm, color: colors.muted, marginTop: spacing.sm },
  photoGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  photoWrap: { position: 'relative' },
  photo: { width: 100, height: 100, borderRadius: radius.sm, backgroundColor: colors.surfaceSoft },
  removePhoto: { position: 'absolute', top: -6, right: -6 },
  captionInput: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.base,
    height: 100,
    ...typography.bodyMd,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  charCount: { ...typography.captionSm, color: colors.mutedSoft, textAlign: 'right', marginBottom: spacing.base },
  postBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { ...typography.buttonMd, color: colors.onPrimary },
  recapsTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.md },
  recapCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.canvas,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  recapHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  recapUser: { ...typography.bodyMd, color: colors.ink },
  recapTime: { ...typography.captionSm, color: colors.muted },
  recapImage: { width: '100%', aspectRatio: 1.5, borderRadius: radius.sm, backgroundColor: colors.surfaceSoft, marginBottom: spacing.sm },
  recapCaption: { ...typography.bodyMd, color: colors.body },
});
