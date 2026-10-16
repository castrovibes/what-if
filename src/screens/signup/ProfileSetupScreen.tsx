import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useSurface } from '../../ui/surface';
import { Button, BottomSheet } from '../../ui/components';
import { useAuth } from '../../auth/AuthProvider';
import { UsernameStatus } from '../../auth/types';
import { SignupStackParamList } from '../../navigation/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import {
  SignupHeader,
  SignupLayout,
  SignupTitle,
  FieldLabel,
  SignupField,
} from './SignupChrome';

// Accounts are for the adults facilitating conversations. The exact minimum age
// (and what happens below it) is a policy decision — see the sign-up notes.
const MIN_ACCOUNT_AGE = 18;
const TEAL = '#00a676';

const MIN_DATE = new Date(1900, 0, 1);
// Where the wheel starts before anything is picked.
const DEFAULT_PICKER_DATE = new Date(1990, 0, 1);

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatLong = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const ageOn = (birth: Date, today = new Date()) => {
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  return beforeBirthday ? age - 1 : age;
};

export const ProfileSetupScreen = () => {
  const navigation = useNavigation<NavigationProp<SignupStackParamList>>();
  const { colors, isDark } = useTheme();
  const surface = useSurface();
  const { auth, account, setAccount } = useAuth();
  const [username, setUsername] = useState(account?.username ?? '');
  const [status, setStatus] = useState<UsernameStatus | 'checking' | null>(null);
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check availability once typing pauses.
  useEffect(() => {
    if (!username.trim()) {
      setStatus(null);
      return;
    }
    setStatus('checking');
    let cancelled = false;
    const t = setTimeout(async () => {
      const result = await auth.checkUsername(username);
      if (!cancelled) setStatus(result);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [username, auth]);

  const tooYoung = birthdate !== null && ageOn(birthdate) < MIN_ACCOUNT_AGE;
  const birthdateError = tooYoung
    ? `You need to be ${MIN_ACCOUNT_AGE} or older to create an account.`
    : null;
  const canFinish = status === 'available' && birthdate !== null && !tooYoung && !saving;

  // iOS: a wheel inside a bottom sheet. Android: the system date dialog.
  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: birthdate ?? DEFAULT_PICKER_DATE,
        mode: 'date',
        minimumDate: MIN_DATE,
        maximumDate: new Date(),
        onChange: (event, date) => {
          if (event.type === 'set' && date) setBirthdate(date);
        },
      });
    } else {
      if (!birthdate) setBirthdate(DEFAULT_PICKER_DATE);
      setPickerOpen(true);
    }
  };

  const onIosChange = (_: DateTimePickerEvent, date?: Date) => {
    if (date) setBirthdate(date);
  };

  const initial = (username.trim() || account?.email || '?').charAt(0).toUpperCase();

  const finish = async () => {
    if (!account || !birthdate) return;
    setSaving(true);
    try {
      setAccount(
        await auth.saveProfile(account.id, {
          username: username.trim(),
          birthdate: toIso(birthdate),
          photoUri: null,
        }),
      );
      navigation.navigate('Paywall');
    } catch {
      Alert.alert("Couldn't save your profile", 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const usernameRight =
    status === 'checking' ? (
      <ActivityIndicator size="small" color={colors.iconInactive} />
    ) : status === 'available' ? (
      <View style={styles.status}>
        <Feather name="check" size={14} color={TEAL} />
        <Text style={[styles.statusText, { color: TEAL }]}>Available</Text>
      </View>
    ) : status === 'taken' ? (
      <Text style={[styles.statusText, styles.bad]}>Taken</Text>
    ) : null;

  return (
    <SignupLayout
      header={<SignupHeader step={3} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />}
      footer={<Button label={saving ? 'Saving…' : 'Finish'} onPress={finish} disabled={!canFinish} />}
    >
      <SignupTitle>Set up your profile</SignupTitle>

      {/* TODO: photo upload needs expo-image-picker + file storage on the backend. */}
      <TouchableOpacity
        style={styles.photoRow}
        onPress={() => Alert.alert('Coming soon', 'Adding a profile photo is coming soon.')}
        accessibilityLabel="Add a photo"
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View>
          <Text style={[styles.photoTitle, { color: surface.accent }]}>Add a photo</Text>
          <Text style={[styles.photoHint, { color: colors.textSecondary }]}>Skip for now</Text>
        </View>
      </TouchableOpacity>

      <FieldLabel>Username</FieldLabel>
      <SignupField
        value={username}
        onChangeText={t => setUsername(t.replace(/\s/g, ''))}
        placeholder="riverwalker32"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        active={status === 'available'}
        right={usernameRight}
      />
      {status === 'invalid' && (
        <Text style={[styles.help, styles.bad]}>Use 3–20 letters, numbers, periods or underscores.</Text>
      )}

      <FieldLabel>Your birthdate</FieldLabel>
      <TouchableOpacity
        onPress={openPicker}
        activeOpacity={0.85}
        accessibilityLabel="Your birthdate"
        accessibilityHint="Opens a date picker"
        style={[
          styles.dateField,
          {
            backgroundColor: surface.card,
            borderColor: birthdate && !tooYoung ? surface.accent : surface.border,
          },
        ]}
      >
        <Text
          style={[
            styles.dateText,
            { color: birthdate ? colors.textPrimary : colors.iconInactive },
          ]}
        >
          {birthdate ? formatLong(birthdate) : 'Select your birthdate'}
        </Text>
        <Feather name="calendar" size={18} color={colors.iconDefault} />
      </TouchableOpacity>
      {birthdateError && <Text style={[styles.help, styles.bad]}>{birthdateError}</Text>}

      {Platform.OS === 'ios' && (
        <BottomSheet visible={pickerOpen} title="Your birthdate" onClose={() => setPickerOpen(false)}>
          <DateTimePicker
            value={birthdate ?? DEFAULT_PICKER_DATE}
            mode="date"
            display="spinner"
            minimumDate={MIN_DATE}
            maximumDate={new Date()}
            onChange={onIosChange}
            themeVariant={isDark ? 'dark' : 'light'}
            style={styles.picker}
          />
          <Button label="Done" onPress={() => setPickerOpen(false)} />
        </BottomSheet>
      )}
    </SignupLayout>
  );
};

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#90dcff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.title1,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    color: '#fff',
  },
  photoTitle: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  photoHint: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  bad: {
    color: '#dc2626',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    marginBottom: Spacing.md,
  },
  dateText: {
    flex: 1,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
  },
  picker: {
    alignSelf: 'stretch',
    marginBottom: Spacing.md,
  },
  help: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
});
