import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../providers/ThemeProvider';
import { useSurface, PINK, INPUT_RADIUS } from '../../ui/surface';
import { Button } from '../../ui/components';
import { toast } from '../../ui/toast';
import { haptic } from '../../ui/haptics';
import { useAuth } from '../../providers/AuthProvider';
import { DISPLAY_NAME_MAX_LENGTH } from '../../auth/types';
import { SignupStackParamList } from '../../navigation/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { SignupHeader, SignupLayout, SignupTitle, SignupText, FieldLabel, SignupField } from './SignupChrome';

// Accounts are for the adults facilitating conversations; the profile step asks them to
// confirm that rather than for a birthdate. (Policy: see the sign-up notes.)
const MIN_ACCOUNT_AGE = 18;

/**
 * The profile step: what to call them, and the adult confirmation. No usernames, no
 * availability checks: there's nothing social for a handle to be unique in.
 */
export const ProfileSetupScreen = () => {
  const navigation = useNavigation<NavigationProp<SignupStackParamList>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const { auth, account, setAccount } = useAuth();
  const [name, setName] = useState(account?.displayName ?? '');
  const [isAdult, setIsAdult] = useState(account?.ageConfirmed ?? false);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const canFinish = trimmed.length > 0 && isAdult && !saving;
  const initial = (trimmed || account?.email || '?').charAt(0).toUpperCase();

  const finish = async () => {
    if (!account || !canFinish) return;
    setSaving(true);
    try {
      setAccount(
        await auth.saveProfile(account.id, { displayName: trimmed, ageConfirmed: true, photoUri: null }),
      );
      haptic.success();
      navigation.navigate('Paywall');
    } catch {
      toast.show({ message: "Couldn't save your profile. Please try again.", icon: 'alert-circle' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SignupLayout
      header={<SignupHeader step={3} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />}
      footer={<Button label={saving ? 'Saving…' : 'Continue'} onPress={finish} disabled={!canFinish} />}
    >
      <SignupTitle>What should we call you?</SignupTitle>
      <SignupText>Just a first name or a nickname is fine. You can change it later.</SignupText>

      {/* TODO: photo upload needs expo-image-picker + file storage on the backend. */}
      <TouchableOpacity
        style={styles.photoRow}
        onPress={() => toast.beta('Profile photos')}
        accessibilityLabel="Add a photo"
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View>
          <Text style={[styles.photoTitle, { color: surface.accent }]}>Add a photo</Text>
          <Text style={[styles.photoHint, { color: colors.textSecondary }]}>Optional</Text>
        </View>
      </TouchableOpacity>

      <FieldLabel>Your name</FieldLabel>
      <SignupField
        value={name}
        onChangeText={setName}
        placeholder="e.g. Sam"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        textContentType="givenName"
        autoComplete="given-name"
        returnKeyType="done"
        active={trimmed.length > 0}
      />

      <TouchableOpacity
        onPress={() => {
          haptic.selection();
          setIsAdult(v => !v);
        }}
        activeOpacity={0.85}
        style={[
          styles.confirmRow,
          { backgroundColor: surface.card, borderColor: isAdult ? surface.accent : surface.border },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isAdult }}
        accessibilityLabel={`I'm ${MIN_ACCOUNT_AGE} or older`}
      >
        <View
          style={[
            styles.checkbox,
            isAdult ? { backgroundColor: PINK, borderColor: PINK } : { borderColor: surface.border },
          ]}
        >
          {isAdult && <Feather name="check" size={14} color="#fff" />}
        </View>
        <View style={styles.confirmText}>
          <Text style={[styles.confirmLabel, { color: colors.textPrimary }]}>
            I’m {MIN_ACCOUNT_AGE} or older
          </Text>
          <Text style={[styles.confirmHint, { color: colors.textSecondary }]}>
            Accounts are for the adults leading the conversation.
          </Text>
        </View>
      </TouchableOpacity>
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
    fontFamily: 'Geomini-Bold',
    color: '#fff',
  },
  photoTitle: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-SemiBold',
  },
  photoHint: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderRadius: INPUT_RADIUS,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    flex: 1,
  },
  confirmLabel: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-SemiBold',
  },
  confirmHint: {
    marginTop: 2,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    lineHeight: 18,
  },
});
