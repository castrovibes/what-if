/**
 * Shared layout pieces for the sign-up screens: header (back, progress, close),
 * titles and labeled text fields.
 */
import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import { useSurface, PINK, INPUT_RADIUS } from '../../ui/surface';
import { Screen } from '../../ui/components';
import { SignupMode } from '../../navigation/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';

export const SIGNUP_STEPS = 4;

/** Sign-up is presented as a modal sheet below the status bar: only the bottom inset applies. */
export const MODAL_EDGES: Edge[] = ['bottom'];

type SignupModeValue = { mode: SignupMode; setMode: (mode: SignupMode) => void };

const SignupModeContext = createContext<SignupModeValue>({ mode: 'signup', setMode: () => {} });

/**
 * Whether the flow is creating an account or logging a returning user in. It starts
 * from how the flow was opened; the first screen can switch it.
 */
export const SignupModeProvider = ({
  initialMode,
  children,
}: {
  initialMode: SignupMode;
  children: ReactNode;
}) => {
  const [mode, setMode] = useState(initialMode);
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return <SignupModeContext.Provider value={value}>{children}</SignupModeContext.Provider>;
};

export const useSignupMode = () => useContext(SignupModeContext);

/** Leaves the whole sign-up flow and returns to wherever it was opened from. */
export const useCloseSignup = () => {
  const navigation = useNavigation();
  return () => navigation.getParent()?.goBack();
};

/**
 * Back chevron, close X, and a segmented progress bar for steps 1–4. Logging in isn't
 * a numbered sequence, so it shows no progress bar.
 */
export const SignupHeader = ({ step, onBack }: { step?: number; onBack?: () => void }) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const close = useCloseSignup();
  const { mode } = useSignupMode();
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityLabel="Back">
            <Feather name="chevron-left" size={26} color={surface.accent} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconSpacer} />
        )}
        <TouchableOpacity onPress={close} hitSlop={10} accessibilityLabel={mode === 'login' ? 'Close log in' : 'Close sign up'}>
          <Feather name="x" size={22} color={colors.iconDefault} />
        </TouchableOpacity>
      </View>
      {step !== undefined && mode === 'signup' && (
        <View style={styles.progress} accessibilityLabel={`Step ${step} of ${SIGNUP_STEPS}`}>
          {Array.from({ length: SIGNUP_STEPS }, (_, i) => (
            <View
              key={i}
              style={[styles.segment, { backgroundColor: i < step ? PINK : surface.border }]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

/** Screen frame: header on top, scrollable-ish content, a footer pinned above the keyboard. */
export const SignupLayout = ({
  header,
  children,
  footer,
}: {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) => (
  <Screen edges={MODAL_EDGES}>
    {header}
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.body}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </KeyboardAvoidingView>
  </Screen>
);

export const SignupTitle = ({ children }: { children: string }) => {
  const surface = useSurface();
  return <Text style={[styles.title, { color: surface.accent }]}>{children}</Text>;
};

export const SignupText = ({ children }: { children: ReactNode }) => {
  const { colors } = useTheme();
  return <Text style={[styles.text, { color: colors.textSecondary }]}>{children}</Text>;
};

export const FieldLabel = ({ children }: { children: string }) => {
  const { colors } = useTheme();
  return <Text style={[styles.label, { color: colors.textSecondary }]}>{children.toUpperCase()}</Text>;
};

/** Rounded text input; `active` gives it the accent-colored focus border. */
export const SignupField = ({
  active,
  right,
  ...props
}: TextInputProps & { active?: boolean; right?: ReactNode }) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: surface.card, borderColor: active ? surface.accent : surface.border },
      ]}
    >
      <TextInput
        placeholderTextColor={colors.iconInactive}
        style={[styles.input, { color: colors.textPrimary }]}
        {...props}
      />
      {right}
    </View>
  );
};

/** Small notice shown only in development, to explain mock behavior. */
export const MockNote = ({ children }: { children: string }) => {
  const { colors } = useTheme();
  if (!__DEV__) return null;
  return <Text style={[styles.mockNote, { color: colors.iconInactive }]}>[MOCK] {children}</Text>;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  iconSpacer: {
    width: 26,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.title1,
    fontFamily: 'Geomini-ExtraBold',
    marginBottom: Spacing.sm,
  },
  text: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: INPUT_RADIUS,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    paddingVertical: 12,
  },
  mockNote: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
    marginTop: Spacing.sm,
  },
});
