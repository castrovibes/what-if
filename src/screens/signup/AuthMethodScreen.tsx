import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useSurface, PINK } from '../../ui/surface';
import { Screen } from '../../ui/components';
import { useAuth } from '../../auth/AuthProvider';
import { NotAvailableError, SignInResult } from '../../auth/types';
import { authBackend } from '../../backend/config';
import { SignupStackParamList } from '../../navigation/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { SignupHeader, MockNote, MODAL_EDGES } from './SignupChrome';

// DRAFT COPY — slides 2 and 3 are placeholders until marketing copy is final.
const SLIDES: { icon: keyof typeof Feather.glyphMap; title: string; text: string }[] = [
  {
    icon: 'message-circle',
    title: '290+ real conversation starters',
    text: 'Prompts for every age, from silly to serious.',
  },
  {
    icon: 'map-pin',
    title: 'Made for the moments in between',
    text: 'Car rides, bedtime, waiting rooms — always have a good question ready.',
  },
  {
    icon: 'heart',
    title: 'Grow together',
    text: 'Save favorites, reflect on conversations, and watch their thinking grow.',
  },
];

type Method = 'apple' | 'google';

export const AuthMethodScreen = () => {
  const navigation = useNavigation<NavigationProp<SignupStackParamList>>();
  const { colors, isDark } = useTheme();
  const surface = useSurface();
  const { width } = useWindowDimensions();
  const { auth, setAccount } = useAuth();
  const [slide, setSlide] = useState(0);
  const [busy, setBusy] = useState<Method | null>(null);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setSlide(Math.round(e.nativeEvent.contentOffset.x / width));

  const continueWith = (result: SignInResult) => {
    setAccount(result.account);
    navigation.navigate(result.needsProfile ? 'ProfileSetup' : 'Done');
  };

  const signIn = async (method: Method) => {
    setBusy(method);
    try {
      continueWith(
        await (method === 'apple' ? auth.signInWithApple() : auth.signInWithGoogle()),
      );
    } catch (e) {
      if (e instanceof NotAvailableError) Alert.alert('Coming soon', e.message);
      else Alert.alert('Sign in failed', 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  // Apple's guidelines call for a black button in light mode and white in dark mode.
  const appleBg = isDark ? '#fff' : '#000';
  const appleFg = isDark ? '#000' : '#fff';

  return (
    <Screen edges={MODAL_EDGES}>
      <SignupHeader />

      <View style={styles.carouselArea}>
        <FlatList
          data={SLIDES}
          keyExtractor={s => s.title}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={styles.carousel}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.slideIcon}>
                <Feather name={item.icon} size={30} color="#fff" />
              </View>
              <Text style={[styles.slideTitle, { color: surface.accent }]}>{item.title}</Text>
              <Text style={[styles.slideText, { color: colors.textSecondary }]}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === slide ? PINK : surface.border }]}
            />
          ))}
        </View>
        {slide < SLIDES.length - 1 && (
          <Text style={[styles.swipeHint, { color: colors.textSecondary }]}>Swipe to see more →</Text>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.authButton, { backgroundColor: appleBg, borderColor: appleBg }]}
          onPress={() => signIn('apple')}
          disabled={busy !== null}
          activeOpacity={0.85}
        >
          {busy === 'apple' ? (
            <ActivityIndicator color={appleFg} />
          ) : (
            <>
              <Ionicons name="logo-apple" size={18} color={appleFg} />
              <Text style={[styles.authText, { color: appleFg }]}>Sign in with Apple</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.authButton, { backgroundColor: surface.card, borderColor: surface.border }]}
          onPress={() => signIn('google')}
          disabled={busy !== null}
          activeOpacity={0.85}
        >
          {busy === 'google' ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={16} color={colors.textPrimary} />
              <Text style={[styles.authText, { color: colors.textPrimary }]}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.authButton, { backgroundColor: surface.card, borderColor: surface.border }]}
          onPress={() => navigation.navigate('EmailEntry')}
          disabled={busy !== null}
          activeOpacity={0.85}
        >
          <Feather name="mail" size={17} color={colors.textPrimary} />
          <Text style={[styles.authText, { color: colors.textPrimary }]}>Continue with Email</Text>
        </TouchableOpacity>

        {authBackend === 'mock' && <MockNote>Apple and Google sign-in are simulated.</MockNote>}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  carouselArea: {
    flex: 1,
    justifyContent: 'center',
  },
  carousel: {
    flexGrow: 0,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  slideIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  slideTitle: {
    fontSize: Typography.title3,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  slideText: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.lg,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  swipeHint: {
    marginTop: Spacing.md,
    textAlign: 'center',
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
  },
  buttons: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  authText: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
});
