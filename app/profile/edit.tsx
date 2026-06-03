import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const VIBE_OPTIONS = ['introvert', 'extrovert', 'solo_explorer', 'social_butterfly'] as const;
const INTEREST_POOL = [
  'music', 'sports', 'tech', 'art', 'food', 'travel', 'fitness', 'gaming',
  'photography', 'dance', 'movies', 'books', 'nature', 'fashion', 'cooking', 'yoga',
];

export default function EditProfileScreen() {
  const currentUserQuery = useCurrentUser();
  const profile = currentUserQuery.data?.profile;
  const authUser = currentUserQuery.data?.authUser;

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [vibeType, setVibeType] = useState<string>(profile?.vibe_type ?? '');
  const [interests, setInterests] = useState<string[]>(Array.isArray(profile?.interests) ? profile.interests : []);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setBio(profile.bio ?? '');
      setVibeType(profile.vibe_type ?? '');
      setInterests(Array.isArray(profile.interests) ? profile.interests : []);
      setAvatarUri(profile.avatar_url ?? null);
    }
  }, [profile]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function uploadToCloudinary(uri: string): Promise<string | null> {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return null;

    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'avatar.jpg' } as unknown as Blob);
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

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    if (!authUser) return;

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUri;
      if (avatarUri && avatarUri !== profile?.avatar_url && !avatarUri.startsWith('https://')) {
        finalAvatarUrl = await uploadToCloudinary(avatarUri);
      }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim() || null,
          vibe_type: (vibeType || null) as any,
          interests,
          avatar_url: finalAvatarUrl,
        })
        .eq('id', authUser.id);

      if (error) throw error;
      currentUserQuery.refetch();
      router.back();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={pickImage} style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="camera-outline" color={colors.muted} size={32} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" color={colors.onPrimary} size={14} />
          </View>
        </Pressable>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          placeholderTextColor={colors.mutedSoft}
          maxLength={50}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell future buddies about yourself"
          placeholderTextColor={colors.mutedSoft}
          multiline
          maxLength={200}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Vibe</Text>
        <View style={styles.chipRow}>
          {VIBE_OPTIONS.map((vibe) => {
            const active = vibeType === vibe;
            return (
              <Pressable
                key={vibe}
                onPress={() => setVibeType(active ? '' : vibe)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {formatLabel(vibe)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Interests</Text>
        <View style={styles.chipRow}>
          {INTEREST_POOL.map((interest) => {
            const active = interests.includes(interest);
            return (
              <Pressable
                key={interest}
                onPress={() => toggleInterest(interest)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {formatLabel(interest)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
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
  avatarWrap: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  avatar: { width: 96, height: 96, borderRadius: radius.full, backgroundColor: colors.surfaceSoft },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 2,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  label: { ...typography.caption, color: colors.muted, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    height: 56,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.base,
    ...typography.bodyMd,
    color: colors.ink,
  },
  textArea: { height: 100, paddingTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipLabel: { ...typography.buttonSm, color: colors.ink },
  chipLabelActive: { color: colors.canvas },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.buttonMd, color: colors.onPrimary },
});
