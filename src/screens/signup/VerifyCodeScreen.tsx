import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useSurface, PINK } from '../../ui/surface';
import { Button } from '../../ui/components';
import { useAuth } from '../../auth/AuthProvider';
import { InvalidCodeError } from '../../auth/types';
import { SignupStackParamList } from '../../navigation/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { SignupHeader, SignupLayout, SignupTitle, SignupText, MockNote } from './SignupChrome';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export const VerifyCodeScreen = () => {
  const navigation = useNavigation<NavigationProp<SignupStackParamList>>();
  const { email } = useRoute<RouteProp<SignupStackParamList, 'VerifyCode'>>().params;
  const { colors } = useTheme();
  const surface = useSurface();
  const { auth, setAccount } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const onChange = (text: string) => {
    setError(null);
    setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH));
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const result = await auth.verifyEmailCode(email, code);
      setAccount(result.account);
      navigation.navigate(result.needsProfile ? 'ProfileSetup' : 'Done');
    } catch (e) {
      setError(e instanceof InvalidCodeError ? e.message : 'Something went wrong. Try again.');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResendIn(RESEND_SECONDS);
    setError(null);
    await auth.sendEmailCode(email);
  };

  return (
    <SignupLayout
      header={<SignupHeader step={2} onBack={() => navigation.goBack()} />}
      footer={
        <Button
          label={verifying ? 'Verifying…' : 'Verify'}
          variant="secondary"
          onPress={verify}
          disabled={code.length < CODE_LENGTH || verifying}
        />
      }
    >
      <SignupTitle>Enter the code</SignupTitle>
      <SignupText>
        We sent a 6-digit code to{'\n'}
        <Text style={{ color: colors.textPrimary }}>{email}</Text>
      </SignupText>

      {/* One hidden input drives the six boxes, so paste and SMS/email autofill work. */}
      <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const focused = i === Math.min(code.length, CODE_LENGTH - 1);
          return (
            <View
              key={i}
              style={[
                styles.box,
                {
                  backgroundColor: surface.card,
                  borderColor: error ? '#dc2626' : focused || code[i] ? surface.accent : surface.border,
                },
              ]}
            >
              <Text style={[styles.digit, { color: colors.textPrimary }]}>{code[i] ?? ''}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        autoFocus
        style={styles.hiddenInput}
        accessibilityLabel="Verification code"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity onPress={resend} disabled={resendIn > 0}>
        <Text style={[styles.resend, { color: resendIn > 0 ? colors.iconInactive : PINK }]}>
          {resendIn > 0 ? `Didn't get it? Resend in ${resendIn}s` : "Didn't get it? Resend code"}
        </Text>
      </TouchableOpacity>

      <MockNote>Any 6-digit code works except 000000.</MockNote>
    </SignupLayout>
  );
};

const styles = StyleSheet.create({
  boxes: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 60,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: Typography.title2,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  error: {
    color: '#dc2626',
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.sm,
  },
  resend: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
});
