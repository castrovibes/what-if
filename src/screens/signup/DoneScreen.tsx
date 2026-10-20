import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { SignupStackParamList } from '../../navigation/types';
import { useSurface } from '../../ui/surface';
import { Screen } from '../../ui/components';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { useCloseSignup, MODAL_EDGES } from './SignupChrome';

const RETURN_AFTER_MS = 1600;

/** Confirmation, then closes the sign-up flow back to where it was opened. */
export const DoneScreen = () => {
  const { colors } = useTheme();
  const surface = useSurface();
  const close = useCloseSignup();
  const returning = useRoute<RouteProp<SignupStackParamList, 'Done'>>().params?.returning ?? false;
  const name = useAuth().account?.displayName;

  useEffect(() => {
    const t = setTimeout(close, RETURN_AFTER_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen edges={MODAL_EDGES}>
      <View style={styles.center}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.check}>
          <Feather name="check" size={40} color="#fff" />
        </Animated.View>
        <Text style={[styles.title, { color: surface.accent }]}>
          {returning ? (name ? `Welcome back, ${name}!` : 'Welcome back!') : 'You’re all set!'}
        </Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          {returning
            ? 'Your favorites and settings will sync to this phone.'
            : 'Taking you back to where you left off.'}
        </Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  check: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00db96',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.title2,
    fontFamily: 'Geomini-ExtraBold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  text: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});
