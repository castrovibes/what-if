import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useSurface, PINK } from '../../ui/surface';
import { Button } from '../../ui/components';
import { useAuth } from '../../auth/AuthProvider';
import { Plan } from '../../auth/types';
import { SignupStackParamList } from '../../navigation/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { SignupHeader, SignupLayout, SignupTitle, SignupText, MockNote } from './SignupChrome';

const TEAL = '#00a676';

export const PaywallScreen = () => {
  const navigation = useNavigation<NavigationProp<SignupStackParamList>>();
  const { colors } = useTheme();
  const surface = useSurface();
  const { account, setAccount, billing } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan['id']>('premium');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    billing.getPlans().then(setPlans);
  }, [billing]);

  const finishWith = async (run: () => Promise<void>) => {
    if (!account) return;
    setBusy(true);
    try {
      await run();
      navigation.navigate('Done');
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const purchase = () =>
    finishWith(async () => setAccount(await billing.purchase(account!, selected)));
  const continueFree = () =>
    finishWith(async () => setAccount(await billing.chooseFree(account!)));

  return (
    <SignupLayout
      header={<SignupHeader step={4} onBack={() => navigation.goBack()} />}
      footer={
        <>
          <Button
            label={busy ? 'One moment…' : 'Continue'}
            variant="secondary"
            onPress={purchase}
            disabled={busy || plans.length === 0}
          />
          <TouchableOpacity onPress={continueFree} disabled={busy} style={styles.freeLink}>
            <Text style={[styles.freeText, { color: surface.accent }]}>
              Continue with Free (Kids Safe Mode)
            </Text>
          </TouchableOpacity>
          <MockNote>No purchase is made; the plan is only saved on this device.</MockNote>
        </>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <SignupTitle>Choose your plan</SignupTitle>
        <SignupText>Unlock more ways to connect and reflect together.</SignupText>

        {plans.map(plan => {
          const active = plan.id === selected;
          return (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelected(plan.id)}
              activeOpacity={0.85}
              style={[
                styles.plan,
                {
                  backgroundColor: surface.card,
                  borderColor: active ? PINK : surface.border,
                  borderWidth: active ? 2 : 1,
                  ...surface.shadow,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View style={styles.planHeader}>
                <View style={styles.flex}>
                  <Text style={[styles.planName, { color: colors.textPrimary }]}>{plan.name}</Text>
                  <Text style={[styles.planPrice, { color: colors.textSecondary }]}>
                    {plan.priceLabel}
                  </Text>
                  {plan.tagline && (
                    <Text style={[styles.planTagline, { color: colors.textPrimary }]}>
                      {plan.tagline}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.radio,
                    active ? styles.radioOn : { borderColor: surface.border },
                  ]}
                >
                  {active && <Feather name="check" size={14} color="#fff" />}
                </View>
              </View>
              {plan.features.map(f => (
                <View key={f} style={styles.feature}>
                  <Feather name="check" size={14} color={TEAL} />
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f}</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SignupLayout>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  plan: {
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 6,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  planName: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
  },
  planPrice: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  planTagline: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginTop: 4,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: PINK,
    borderColor: PINK,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
  freeLink: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  freeText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
});
