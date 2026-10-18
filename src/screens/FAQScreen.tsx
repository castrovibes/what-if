import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useSurface, PINK } from '../ui/surface';
import { Screen, ScreenHeader, ScreenScroll, Card, SectionLabel } from '../ui/components';
import { FAQRepo, FAQEntry } from '../db/repositories/faq';
import { Typography, Spacing } from '../utils/deviceHelpers';

export const FAQScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const surface = useSurface();
  const [entries, setEntries] = useState<FAQEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    FAQRepo.list().then(setEntries);
  }, []);

  const grouped = useMemo(() => {
    const m: Record<string, FAQEntry[]> = {};
    for (const e of entries) {
      if (!m[e.category]) m[e.category] = [];
      m[e.category].push(e);
    }
    return m;
  }, [entries]);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Help & FAQ" onBack={() => navigation.goBack()} />

      <ScreenScroll>
        {Object.entries(grouped).map(([category, items]) => (
          <View key={category} style={localStyles.group}>
            <SectionLabel>{category}</SectionLabel>
            <Card padded={false}>
              {items.map((e, i) => {
                const open = expanded.has(e.id);
                const last = i === items.length - 1;
                return (
                  <TouchableOpacity
                    key={e.id}
                    onPress={() => toggle(e.id)}
                    style={[
                      localStyles.entry,
                      !last && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: surface.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={localStyles.entryHeader}>
                      <Text style={[localStyles.question, { color: colors.textPrimary }]}>
                        {e.question}
                      </Text>
                      <Feather
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={open ? PINK : colors.iconInactive}
                      />
                    </View>
                    {open && (
                      <Text style={[localStyles.answer, { color: colors.textSecondary }]}>
                        {e.answer}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ))}
      </ScreenScroll>
    </Screen>
  );
};

const localStyles = StyleSheet.create({
  group: { gap: Spacing.md },
  entry: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  question: {
    fontSize: Typography.callout,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  answer: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    lineHeight: 21,
    marginTop: Spacing.sm,
  },
});
