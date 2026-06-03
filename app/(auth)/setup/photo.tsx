import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSetupScaffold } from '@/components/ProfileSetupScaffold';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const maxAvatarBytes = 5 * 1024 * 1024;
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
const cloudinaryFolder = 'eventbuddy/avatars';

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

export default function PhotoSetupRoute() {
  const params = useLocalSearchParams<{ vibeType?: string; interests?: string }>();
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const interests = useMemo(
    () =>
      typeof params.interests === 'string'
        ? params.interests.split(',').filter(Boolean)
        : [],
    [params.interests]
  );
  const canFinish = Boolean(params.vibeType && interests.length >= 3 && interests.length <= 5);

  async function pickFromGallery() {
    setErrorMessage(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage('Photo library permission is required to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) {
      await validateAndSetAsset(result.assets[0]);
    }
  }

  async function takePhoto() {
    setErrorMessage(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage('Camera permission is required to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) {
      await validateAndSetAsset(result.assets[0]);
    }
  }

  async function validateAndSetAsset(asset: ImagePicker.ImagePickerAsset) {
    const validation = await validateImageAsset(asset);

    if (validation) {
      setErrorMessage(validation);
      setSelectedAsset(null);
      return;
    }

    setSelectedAsset(asset);
  }

  async function finishProfile(avatarUrl?: string) {
    if (!canFinish || !params.vibeType) {
      setErrorMessage('Please complete vibe and interests first.');
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      setErrorMessage(authError?.message ?? 'Please log in before completing profile setup.');
      return;
    }

    const updatePayload: {
      vibe_type: string;
      interests: string[];
      avatar_url?: string;
    } = {
      vibe_type: params.vibeType,
      interests,
    };

    if (avatarUrl) {
      updatePayload.avatar_url = avatarUrl;
    }

    const { error } = await supabase.from('users').update(updatePayload).eq('id', authData.user.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace('/(tabs)');
  }

  async function uploadAndFinish() {
    if (!selectedAsset) {
      setErrorMessage('Choose or take a photo before finishing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const validation = await validateImageAsset(selectedAsset);

      if (validation) {
        setErrorMessage(validation);
        return;
      }

      const avatarUrl = await uploadToCloudinary(selectedAsset);
      await finishProfile(avatarUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not upload your photo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function skipPhoto() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await finishProfile();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProfileSetupScaffold
      step={3}
      title="Add a photo"
      subtitle="Help buddies recognize you."
      primaryLabel="Upload & Finish"
      primaryDisabled={!selectedAsset || !canFinish}
      primaryLoading={isSubmitting}
      onPrimaryPress={uploadAndFinish}
      footerLinkLabel="Skip for now"
      onFooterLinkPress={skipPhoto}
    >
      <View style={styles.photoBlock}>
        <View style={styles.avatarFrame}>
          {selectedAsset ? (
            <Image source={{ uri: selectedAsset.uri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarPlaceholder}>Add Photo</Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          <Pressable onPress={pickFromGallery} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonLabel}>Choose Photo</Text>
          </Pressable>
          <Pressable onPress={takePhoto} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonLabel}>Use Camera</Text>
          </Pressable>
        </View>

        <Text style={styles.helpText}>JPG, PNG, or WEBP. Maximum file size 5MB.</Text>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </ProfileSetupScaffold>
  );
}

async function validateImageAsset(asset: ImagePicker.ImagePickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase();
  const extension = getFileExtension(asset.uri);

  if (mimeType && !allowedMimeTypes.includes(mimeType)) {
    return 'Please choose a JPG, PNG, or WEBP image.';
  }

  if (!mimeType && extension && !allowedExtensions.includes(extension)) {
    return 'Please choose a JPG, PNG, or WEBP image.';
  }

  const fileSize = asset.fileSize ?? (await getFileSize(asset.uri));

  if (fileSize && fileSize > maxAvatarBytes) {
    return 'Profile photo must be 5MB or smaller.';
  }

  return null;
}

async function getFileSize(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists) return null;

  return typeof info.size === 'number' ? info.size : null;
}

function getFileExtension(uri: string) {
  const extension = uri.split('?')[0]?.split('.').pop()?.toLowerCase();

  return extension && extension !== uri ? extension : null;
}

function getUploadMetadata(asset: ImagePicker.ImagePickerAsset) {
  const extension = getFileExtension(asset.uri) ?? 'jpg';
  const mimeType = asset.mimeType ?? (extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg');
  const fileName = asset.fileName ?? `eventbuddy-avatar.${extension}`;

  return { fileName, mimeType };
}

async function uploadToCloudinary(asset: ImagePicker.ImagePickerAsset) {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary upload is not configured.');
  }

  const { fileName, mimeType } = getUploadMetadata(asset);
  const formData = new FormData();

  formData.append('file', { uri: asset.uri, name: fileName, type: mimeType } as unknown as Blob);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', cloudinaryFolder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const payload = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message ?? 'Cloudinary upload failed.');
  }

  return payload.secure_url;
}

const styles = StyleSheet.create({
  photoBlock: {
    alignItems: 'center',
    gap: spacing.base,
    paddingTop: spacing.lg,
  },
  avatarFrame: {
    width: 168,
    height: 168,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    ...typography.buttonSm,
    color: colors.muted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.canvas,
  },
  secondaryButtonLabel: {
    ...typography.buttonSm,
    color: colors.ink,
  },
  helpText: {
    ...typography.bodySm,
    color: colors.muted,
    textAlign: 'center',
  },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
    textAlign: 'center',
  },
});
