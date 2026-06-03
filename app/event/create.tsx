import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { useCreateEvent } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type EventType = 'official' | 'community';
type GenderPreference = 'any' | 'women_only' | 'men_only' | 'mixed';
type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    street?: string;
  };
};

const categories = ['music', 'trek', 'hackathon', 'meetup', 'art', 'comedy', 'sports', 'food', 'gaming'] as const;
const categoryLabels: Record<(typeof categories)[number], string> = {
  music: 'Music',
  trek: 'Trek',
  hackathon: 'Hackathon',
  meetup: 'Meetup',
  art: 'Art',
  comedy: 'Comedy',
  sports: 'Sports',
  food: 'Food',
  gaming: 'Gaming',
};
const genderOptions: { label: string; value: GenderPreference }[] = [
  { label: 'Any', value: 'any' },
  { label: 'Women Only', value: 'women_only' },
  { label: 'Men Only', value: 'men_only' },
  { label: 'Mixed', value: 'mixed' },
];
const maxPhotoBytes = 5 * 1024 * 1024;
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

const detailsSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(80, 'Title must be 80 characters or less.'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters.').max(500, 'Description must be 500 characters or less.'),
  category: z.enum(categories, 'Choose a category.'),
  date: z.string().refine((value) => parseDateTime(value).getTime() > Date.now(), 'Date and time must be in the future.'),
  city: z.string().trim().min(1, 'City is required.'),
});
const officialSchema = z.object({
  maxAttendees: z.coerce.number().int().min(2, 'Max attendees must be at least 2.'),
  price: z.coerce.number().min(0, 'Price must be zero or more.'),
});
const communitySchema = z.object({
  currentGroupSize: z.coerce.number().int().min(1, 'Current group size must be at least 1.'),
  maxAttendees: z.coerce.number().int().min(2, 'Total people wanted must be at least 2.'),
  price: z.coerce.number().min(0, 'Cost must be zero or more.'),
  genderPreference: z.enum(['any', 'women_only', 'men_only', 'mixed']),
  menSlots: z.coerce.number().int().min(0).optional(),
  womenSlots: z.coerce.number().int().min(0).optional(),
}).superRefine((value, context) => {
  if (value.currentGroupSize >= value.maxAttendees) {
    context.addIssue({ code: 'custom', path: ['maxAttendees'], message: 'Total people wanted must be greater than current group size.' });
  }

  if (value.genderPreference === 'mixed') {
    const openSpots = value.maxAttendees - value.currentGroupSize;
    const menSlots = value.menSlots ?? 0;
    const womenSlots = value.womenSlots ?? 0;

    if (menSlots + womenSlots !== openSpots) {
      context.addIssue({ code: 'custom', path: ['menSlots'], message: 'Men and women slots must equal the open spots.' });
    }
  }
});

export default function CreateEventRoute() {
  const createEventMutation = useCreateEvent();
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number] | null>(null);
  const [dateValue, setDateValue] = useState('');
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time' | null>(null);
  const [city, setCity] = useState('');
  const [venueName, setVenueName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<PhotonFeature[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [coverAsset, setCoverAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('0');
  const [maxAttendees, setMaxAttendees] = useState('10');
  const [currentGroupSize, setCurrentGroupSize] = useState('1');
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('any');
  const [menSlots, setMenSlots] = useState('0');
  const [womenSlots, setWomenSlots] = useState('0');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lookingForCount = useMemo(() => {
    const total = Number(maxAttendees);
    const current = Number(currentGroupSize);

    return Number.isFinite(total) && Number.isFinite(current) ? Math.max(total - current, 0) : 0;
  }, [currentGroupSize, maxAttendees]);

  useEffect(() => {
    const query = addressQuery.trim();

    if (query.length < 3) {
      setAddressResults([]);
      return;
    }

    let isActive = true;
    const timeout = setTimeout(async () => {
      setIsSearchingAddress(true);

      try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
        const payload = await response.json();

        if (isActive) {
          setAddressResults(Array.isArray(payload.features) ? payload.features : []);
        }
      } catch (_error) {
        if (isActive) setAddressResults([]);
      } finally {
        if (isActive) setIsSearchingAddress(false);
      }
    }, 350);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [addressQuery]);

  function selectAddress(feature: PhotonFeature) {
    const properties = feature.properties ?? {};
    const coordinates = feature.geometry?.coordinates;
    const nextCity = properties.city ?? properties.town ?? properties.village ?? properties.state ?? '';
    const nextVenue = properties.name ?? properties.street ?? nextCity;

    setAddressQuery(formatPhotonAddress(feature));
    setCity(nextCity);
    setVenueName(nextVenue);
    setLongitude(coordinates?.[0] !== undefined ? String(coordinates[0]) : '');
    setLatitude(coordinates?.[1] !== undefined ? String(coordinates[1]) : '');
    setAddressResults([]);
  }

  function continueFromType() {
    if (!eventType) return;
    setErrorMessage(null);
    setStep(2);
  }

  function continueFromDetails() {
    const result = detailsSchema.safeParse({ title, description, category, date: dateValue, city });

    if (!result.success) {
      setErrorMessage(result.error.issues[0]?.message ?? 'Complete event details.');
      return;
    }

    setErrorMessage(null);
    setStep(3);
  }

  async function pickCoverPhoto() {
    setErrorMessage(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage('Photo library permission is required to choose a cover photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled) {
      const validation = await validateImageAsset(result.assets[0]);

      if (validation) {
        setErrorMessage(validation);
        setCoverAsset(null);
        return;
      }

      setCoverAsset(result.assets[0]);
    }
  }

  async function submitEvent() {
    if (!eventType || !category) return;

    const details = detailsSchema.safeParse({ title, description, category, date: dateValue, city });
    if (!details.success) {
      setErrorMessage(details.error.issues[0]?.message ?? 'Complete event details.');
      setStep(2);
      return;
    }

    const finalPrice = isFree ? 0 : Number(price);
    const typeValidation = eventType === 'official'
      ? officialSchema.safeParse({ maxAttendees, price: finalPrice })
      : communitySchema.safeParse({ currentGroupSize, maxAttendees, price: finalPrice, genderPreference, menSlots, womenSlots });

    if (!typeValidation.success) {
      setErrorMessage(typeValidation.error.issues[0]?.message ?? 'Complete event details.');
      return;
    }

    setErrorMessage(null);

    try {
      const coverImageUrl = coverAsset ? await uploadToCloudinary(coverAsset) : null;
      await createEventMutation.mutateAsync({
        event_type: eventType,
        title: title.trim(),
        description: description.trim(),
        category,
        date: parseDateTime(dateValue).toISOString(),
        city: city.trim(),
        venue_name: venueName.trim() || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        cover_image_url: coverImageUrl,
        price: finalPrice,
        max_attendees: Number(maxAttendees),
        current_group_size: eventType === 'community' ? Number(currentGroupSize) : 1,
        gender_preference: eventType === 'community' ? genderPreference : 'any',
        men_slots: eventType === 'community' && genderPreference === 'mixed' ? Number(menSlots) : null,
        women_slots: eventType === 'community' && genderPreference === 'mixed' ? Number(womenSlots) : null,
      });

      Alert.alert(
        eventType === 'official' ? 'Event under review' : 'Outing is live',
        eventType === 'official'
          ? "Your event is under review. We'll notify you when it's approved."
          : 'Your outing is live! People can now join.',
        [{ text: 'OK', onPress: () => router.replace({ pathname: '/(tabs)/create', params: { status: eventType === 'official' ? 'pending' : 'upcoming' } }) }]
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not post event.');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Step {step} of 3</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} /></View>
        </View>

        {step === 1 ? (
          <View>
            <Text style={styles.title}>What are you posting?</Text>
            <SelectableCard
              title="Official Event"
              subtitle="A formal event like a concert, workshop, or hackathon. Will be reviewed before going live."
              selected={eventType === 'official'}
              onPress={() => setEventType('official')}
            />
            <SelectableCard
              title="Community Outing"
              subtitle="You and your friends are going somewhere and want more people to join. Goes live immediately."
              selected={eventType === 'community'}
              onPress={() => setEventType('community')}
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <Text style={styles.title}>Event details</Text>
            <Field label="Event Title" value={title} onChangeText={setTitle} maxLength={80} />
            <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={500} />
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipWrap}>{categories.map((item) => <Chip key={item} label={categoryLabels[item]} selected={category === item} onPress={() => setCategory(item)} />)}</View>
            <Text style={styles.fieldLabel}>Date & Time</Text>
            <View style={styles.inlineFields}>
              <Pressable onPress={() => setDatePickerMode('date')} style={[styles.inputButton, styles.fieldWrapCompact]}>
                <Text style={dateValue ? styles.inputButtonText : styles.inputButtonPlaceholder}>{dateValue ? formatDateDisplay(dateValue) : 'Choose date'}</Text>
              </Pressable>
              <Pressable onPress={() => setDatePickerMode('time')} style={[styles.inputButton, styles.fieldWrapCompact]}>
                <Text style={dateValue ? styles.inputButtonText : styles.inputButtonPlaceholder}>{dateValue ? formatTimeDisplay(dateValue) : 'Choose time'}</Text>
              </Pressable>
            </View>
            {datePickerMode ? (
              <DateTimePicker
                value={dateValue ? new Date(dateValue) : new Date(Date.now() + 60 * 60 * 1000)}
                mode={datePickerMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_event, selectedDate) => {
                  if (Platform.OS !== 'ios') setDatePickerMode(null);
                  if (selectedDate) setDateValue(mergePickedDate(dateValue, selectedDate, datePickerMode).toISOString());
                }}
              />
            ) : null}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                value={addressQuery}
                onChangeText={(value) => {
                  setAddressQuery(value);
                  setCity('');
                  setVenueName('');
                  setLatitude('');
                  setLongitude('');
                }}
                placeholder="Search venue, area, or city"
                placeholderTextColor={colors.mutedSoft}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              {isSearchingAddress ? <Text style={styles.helperText}>Searching addresses...</Text> : null}
              {addressResults.length > 0 ? (
                <View style={styles.addressResults}>
                  {addressResults.map((feature, index) => (
                    <Pressable key={`${formatPhotonAddress(feature)}-${index}`} onPress={() => selectAddress(feature)} style={styles.addressOption}>
                      <Text style={styles.addressTitle} numberOfLines={1}>{feature.properties?.name ?? feature.properties?.street ?? 'Unnamed place'}</Text>
                      <Text style={styles.addressSubtitle} numberOfLines={1}>{formatPhotonAddress(feature)}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {addressQuery && !city ? <Text style={styles.helperText}>Select an address result to set the event location.</Text> : null}
            </View>
            <Pressable onPress={pickCoverPhoto} style={styles.coverPicker}>
              {coverAsset ? <Image source={{ uri: coverAsset.uri }} style={styles.coverImage} /> : <Text style={styles.coverText}>Choose Cover Photo</Text>}
            </Pressable>
          </View>
        ) : null}

        {step === 3 && eventType === 'official' ? (
          <View>
            <Text style={styles.title}>Ticket info</Text>
            <CostToggle isFree={isFree} onChange={setIsFree} />
            {!isFree ? <Field label="Ticket Price" value={price} onChangeText={setPrice} keyboardType="numeric" /> : null}
            <Field label="Max Attendees" value={maxAttendees} onChangeText={setMaxAttendees} keyboardType="number-pad" />
          </View>
        ) : null}

        {step === 3 && eventType === 'community' ? (
          <View>
            <Text style={styles.title}>Group preferences</Text>
            <Field label="How many people are already going?" helper="Including you" value={currentGroupSize} onChangeText={setCurrentGroupSize} keyboardType="number-pad" />
            <Field label="Total people wanted" value={maxAttendees} onChangeText={setMaxAttendees} keyboardType="number-pad" />
            <Text style={styles.helperText}>Looking for {lookingForCount} more people</Text>
            <CostToggle isFree={isFree} onChange={setIsFree} />
            {!isFree ? <Field label="Cost per person" value={price} onChangeText={setPrice} keyboardType="numeric" /> : null}
            <Text style={styles.fieldLabel}>Gender Preference</Text>
            <View style={styles.chipWrap}>{genderOptions.map((item) => <Chip key={item.value} label={item.label} selected={genderPreference === item.value} onPress={() => setGenderPreference(item.value)} />)}</View>
            {genderPreference === 'mixed' ? (
              <View style={styles.inlineFields}>
                <Field label="Men slots" value={menSlots} onChangeText={setMenSlots} keyboardType="number-pad" compact />
                <Field label="Women slots" value={womenSlots} onChangeText={setWomenSlots} keyboardType="number-pad" compact />
              </View>
            ) : null}
          </View>
        ) : null}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 ? <Pressable onPress={() => setStep((current) => current - 1)} style={styles.secondaryButton}><Text style={styles.secondaryButtonLabel}>Back</Text></Pressable> : null}
        <Pressable
          onPress={step === 1 ? continueFromType : step === 2 ? continueFromDetails : submitEvent}
          disabled={(step === 1 && !eventType) || createEventMutation.isPending}
          style={[styles.primaryButton, (step === 1 && !eventType) || createEventMutation.isPending ? styles.primaryButtonDisabled : null]}
        >
          {createEventMutation.isPending ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryButtonLabel}>{step === 3 ? (eventType === 'official' ? 'Post Event' : 'Post Outing') : 'Continue'}</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SelectableCard({ title, subtitle, selected, onPress }: { title: string; subtitle: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.selectableCard, selected ? styles.selectableCardSelected : null]}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardSubtitle}>{subtitle}</Text></Pressable>;
}

function Field({ label, helper, compact, ...props }: { label: string; helper?: string; compact?: boolean } & React.ComponentProps<typeof TextInput>) {
  return <View style={[styles.fieldWrap, compact ? styles.fieldWrapCompact : null]}><Text style={styles.fieldLabel}>{label}</Text><TextInput placeholderTextColor={colors.mutedSoft} style={[styles.input, props.multiline ? styles.textArea : null]} {...props} />{helper ? <Text style={styles.helperText}>{helper}</Text> : null}</View>;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected ? styles.chipSelected : null]}><Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{label}</Text></Pressable>;
}

function CostToggle({ isFree, onChange }: { isFree: boolean; onChange: (isFree: boolean) => void }) {
  return <View style={styles.costToggle}><Chip label="Free" selected={isFree} onPress={() => onChange(true)} /><Chip label="Paid" selected={!isFree} onPress={() => onChange(false)} /></View>;
}

function parseDateTime(value: string) {
  const normalized = value.trim().replace(' ', 'T');
  const date = new Date(normalized);

  return date;
}

function mergePickedDate(currentValue: string, pickedDate: Date, mode: 'date' | 'time') {
  const current = currentValue ? new Date(currentValue) : new Date(Date.now() + 60 * 60 * 1000);

  if (mode === 'date') {
    current.setFullYear(pickedDate.getFullYear(), pickedDate.getMonth(), pickedDate.getDate());
  } else {
    current.setHours(pickedDate.getHours(), pickedDate.getMinutes(), 0, 0);
  }

  return current;
}

function formatDateDisplay(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeDisplay(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function formatPhotonAddress(feature: PhotonFeature) {
  const properties = feature.properties ?? {};

  return [
    properties.name ?? properties.street,
    properties.city ?? properties.town ?? properties.village,
    properties.state,
    properties.country,
  ].filter(Boolean).join(', ');
}

async function validateImageAsset(asset: ImagePicker.ImagePickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase();
  const extension = getFileExtension(asset.uri);

  if (mimeType && !allowedMimeTypes.includes(mimeType)) return 'Please choose a JPG, PNG, or WEBP image.';
  if (!mimeType && extension && !allowedExtensions.includes(extension)) return 'Please choose a JPG, PNG, or WEBP image.';

  const fileSize = asset.fileSize ?? (await getFileSize(asset.uri));
  if (fileSize && fileSize > maxPhotoBytes) return 'Cover photo must be 5MB or smaller.';

  return null;
}

async function getFileSize(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);

  return info.exists && typeof info.size === 'number' ? info.size : null;
}

function getFileExtension(uri: string) {
  const extension = uri.split('?')[0]?.split('.').pop()?.toLowerCase();

  return extension && extension !== uri ? extension : null;
}

async function uploadToCloudinary(asset: ImagePicker.ImagePickerAsset) {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) throw new Error('Cloudinary upload is not configured.');

  const extension = getFileExtension(asset.uri) ?? 'jpg';
  const mimeType = asset.mimeType ?? (extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg');
  const formData = new FormData();
  formData.append('file', { uri: asset.uri, name: asset.fileName ?? `event-cover.${extension}`, type: mimeType } as unknown as Blob);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'eventbuddy/events');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
  const payload = await response.json();

  if (!response.ok || !payload.secure_url) throw new Error(payload.error?.message ?? 'Cloudinary upload failed.');

  return payload.secure_url as string;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, padding: spacing.base, paddingBottom: spacing.section },
  progressHeader: { gap: spacing.sm, marginBottom: spacing.xl },
  progressText: { ...typography.caption, color: colors.muted },
  progressTrack: { height: 6, borderRadius: radius.full, backgroundColor: colors.hairlineSoft, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  title: { ...typography.displayXl, color: colors.ink, marginBottom: spacing.lg },
  selectableCard: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: spacing.base, marginBottom: spacing.base, backgroundColor: colors.canvas },
  selectableCardSelected: { borderColor: colors.ink, borderWidth: 2 },
  cardTitle: { ...typography.titleMd, color: colors.ink, marginBottom: spacing.xs },
  cardSubtitle: { ...typography.bodySm, color: colors.muted },
  fieldWrap: { marginBottom: spacing.base },
  fieldWrapCompact: { flex: 1 },
  fieldLabel: { ...typography.caption, color: colors.ink, marginBottom: spacing.sm },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.sm, paddingHorizontal: spacing.base, ...typography.bodySm, color: colors.ink, backgroundColor: colors.canvas },
  inputButton: { minHeight: 48, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.sm, paddingHorizontal: spacing.base, alignItems: 'flex-start', justifyContent: 'center', backgroundColor: colors.canvas, marginBottom: spacing.base },
  inputButtonText: { ...typography.bodySm, color: colors.ink },
  inputButtonPlaceholder: { ...typography.bodySm, color: colors.mutedSoft },
  textArea: { minHeight: 112, paddingTop: spacing.md, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  chip: { minHeight: 40, borderRadius: radius.xl, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.hairline },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipLabel: { ...typography.buttonSm, color: colors.ink },
  chipLabelSelected: { color: colors.canvas },
  inlineFields: { flexDirection: 'row', gap: spacing.sm },
  coverPicker: { height: 160, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.surfaceSoft, marginBottom: spacing.base },
  coverImage: { width: '100%', height: '100%' },
  coverText: { ...typography.buttonSm, color: colors.ink },
  costToggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  helperText: { ...typography.captionSm, color: colors.muted, marginBottom: spacing.base },
  addressResults: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.sm, overflow: 'hidden', marginTop: spacing.sm, backgroundColor: colors.canvas },
  addressOption: { minHeight: 56, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.hairlineSoft, justifyContent: 'center' },
  addressTitle: { ...typography.caption, color: colors.ink },
  addressSubtitle: { ...typography.captionSm, color: colors.muted, marginTop: spacing.xs },
  errorText: { ...typography.bodySm, color: colors.error, marginTop: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.base, paddingBottom: spacing.lg, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  primaryButton: { flex: 1, height: 48, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryButtonDisabled: { backgroundColor: colors.primaryDisabled },
  primaryButtonLabel: { ...typography.buttonMd, color: colors.onPrimary },
  secondaryButton: { width: 96, height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  secondaryButtonLabel: { ...typography.buttonMd, color: colors.ink },
});
