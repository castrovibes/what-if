import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useSurface, PINK } from '../../ui/surface';
import { Button } from '../../ui/components';
import { useAuth } from '../../auth/AuthProvider';
import { authBackend, useEmulator } from '../../backend/config';
import { SignupStackParamList } from '../../navigation/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { SignupHeader, SignupLayout, SignupTitle, SignupText } from './SignupChrome';

const RESEND_SECONDS = 30;

/**
 * Waits for the user to open the sign-in link from their email. Opening it launches
 * the app, AuthProvider signs them in, and this screen moves on.
 */
export const CheckEmailScreen = () => {
  const navigation = useNavigation<NavigationProp<SignupStackParamList>>();
  const { email } = useRoute<RouteProp<SignupStackParamList, 'CheckEmail'>>().params;
  const { colors } = useTheme();
  const surface = useSurface();
  const { auth, account, completeSignInLink, linkError, clearLinkError } = useAuth();
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [devBusy, setDevBusy] = useState(false);
  const signedInAtStart = useRef(account !== null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Continue once the link has signed the user in. Only react to that moment: this
  // screen stays mounted under later steps, which update the account again.
  const continued = useRef(false);
  useEffect(() => {
    if (!account || signedInAtStart.current || continued.current) return;
    continued.current = true;
    navigation.navigate(account.username ? 'Done' : 'ProfileSetup');
  }, [account, navigation]);

  const resend = async () => {
    setResendIn(RESEND_SECONDS);
    clearLinkError();
    try {
      await auth.sendSignInLink(email);
    } catch {
      Alert.alert("Couldn't resend the link", 'Check your connection and try again.');
    }
  };

  // Development: grab the link the emulator (or mock) "sent" instead of opening email.
  const openDevLink = async () => {
    if (!auth.devLatestSignInLink) return;
    setDevBusy(true);
    clearLinkError();
    try {
      const link = await auth.devLatestSignInLink(email);
      if (!link) {
        Alert.alert('No link yet', 'Nothing has been sent to this address. Try Resend.');
        return;
      }
      await completeSignInLink(link);
    } catch (e) {
      Alert.alert('Sign-in failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setDevBusy(false);
    }
  };

  const showDevButton = __DEV__ && !!auth.devLatestSignInLink && (useEmulator || authBackend === 'mock');

  return (
    <SignupLayout
      header={<SignupHeader step={2} onBack={() => navigation.goBack()} />}
      footer={
        showDevButton ? (
          <>
            <Button
              label={devBusy ? 'Signing in…' : 'Open link (dev)'}
              icon="external-link"
              variant="secondary"
              onPress={openDevLink}
              disabled={devBusy}
            />
            <Text style={[styles.devNote, { color: colors.iconInactive }]}>
              {authBackend === 'mock'
                ? '[MOCK] No email is sent; this opens the mock link.'
                : '[DEV] The Firebase emulator doesn’t send email; this opens the link it generated.'}
            </Text>
          </>
        ) : undefined
      }
    >
      <View style={[styles.iconCircle, { borderColor: surface.border, backgroundColor: surface.card }]}>
        <Feather name="mail" size={28} color={surface.accent} />
      </View>
      <SignupTitle>Check your email</SignupTitle>
      <SignupText>
        We sent a sign-in link to{'\n'}
        <Text style={{ color: colors.textPrimary }}>{email}</Text>
        {'\n\n'}Open it on this phone to continue. It may take a minute to arrive, so check
        your spam folder too.
      </SignupText>

      <View style={styles.waiting}>
        <ActivityIndicator size="small" color={colors.iconInactive} />
        <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
          Waiting for you to open the link…
        </Text>
      </View>

      {linkError && <Text style={styles.error}>{linkError}</Text>}

      <TouchableOpacity onPress={resend} disabled={resendIn > 0}>
        <Text style={[styles.link, { color: resendIn > 0 ? colors.iconInactive : PINK }]}>
          {resendIn > 0 ? `Didn't get it? Resend in ${resendIn}s` : "Didn't get it? Resend link"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.secondaryLink}>
        <Text style={[styles.link, { color: surface.accent }]}>Use a different email</Text>
      </TouchableOpacity>
    </SignupLayout>
  );
};

const styles = StyleSheet.create({
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  waitingText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  error: {
    color: '#dc2626',
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.md,
  },
  link: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  secondaryLink: {
    marginTop: Spacing.md,
  },
  devNote: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});
