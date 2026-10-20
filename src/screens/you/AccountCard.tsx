import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useSurface } from '../../ui/surface';
import { Card, Button, ListRow } from '../../ui/components';
import { useAuth } from '../../providers/AuthProvider';
import { PlanId } from '../../auth/types';
import { FeatureFlags } from '../../data/featureFlags';
import { Typography, Spacing } from '../../utils/deviceHelpers';

const PLAN_LABEL: Record<PlanId, string> = {
  free: 'Free · Kids Safe Mode',
  premium: 'Premium',
  professional: 'Professional',
};

/**
 * The top of the You tab: who's signed in (name, plan, email), or a plain welcome while
 * accounts are off for the beta, or the sign-up offer.
 */
export const AccountCard = ({ onSignUp }: { onSignUp: () => void }) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const { account } = useAuth();

  if (account) {
    const name = account.displayName;
    return (
      <Card padded={false}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: surface.accent }]}>
            {name ? (
              <Text style={styles.initial}>{name.charAt(0).toUpperCase()}</Text>
            ) : (
              <Feather name="user" size={28} color="#fff" />
            )}
          </View>
          <View style={styles.flex}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {name ? `Welcome back, ${name}` : 'Welcome back'}
            </Text>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>
              {PLAN_LABEL[account.plan]}
              {account.email ? ` · ${account.email}` : ''}
            </Text>
          </View>
        </View>
        <ListRow icon="edit-2" label="Edit profile" detail="Coming soon" chevron={false} last />
      </Card>
    );
  }

  if (!FeatureFlags.showSignup) {
    // Accounts aren't offered yet (beta): a simple welcome instead of sign-up.
    return (
      <Card padded={false}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: surface.accent }]}>
            <Feather name="user" size={28} color="#fff" />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>Welcome</Text>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>
              Your favorites and settings are saved on this phone.
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card padded={false}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: surface.accent }]}>
          <Feather name="user-plus" size={26} color="#fff" />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>Save your progress</Text>
          <Text style={[styles.detail, { color: colors.textSecondary }]}>
            Create a free account to keep your favorites and reflections, and to unlock Premium.
          </Text>
        </View>
      </View>
      <View style={styles.cta}>
        <Button label="Sign up or log in" onPress={onSignUp} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: Typography.title2,
    fontFamily: 'Geomini-Bold',
    color: '#fff',
  },
  name: {
    fontSize: Typography.title3,
    fontFamily: 'Geomini-Bold',
  },
  detail: {
    marginTop: 2,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
  cta: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginTop: -Spacing.sm,
  },
});
