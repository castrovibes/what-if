import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { usePersonalizationEditor } from '../hooks/usePersonalization';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';
import { Screen, ScreenHeader, ScreenScroll, Card, SectionLabel } from '../ui/components';
import { useSurface, INPUT_RADIUS } from '../ui/surface';

export const PersonalizationScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { activeContext } = useActiveContext();
  const { data, update, loaded } = usePersonalizationEditor();

  if (!loaded) return null;

  return (
    <Screen>
      <ScreenHeader
        title="Personalize"
        onBack={() => navigation.goBack()}
        subtitle={`Tailor prompts for ${activeContext.label}. Fields are optional — anything you leave blank uses a neutral fallback.`}
      />

      <ScreenScroll>
        <Card>
          <Field
            label="Name"
            placeholder="e.g. Maya"
            value={data.name ?? ''}
            onChange={v => update('name', v)}
          />
          <Field
            label="Location"
            placeholder="e.g. Boulder"
            value={data.location ?? ''}
            onChange={v => update('location', v)}
          />
          <Field
            label="Interest"
            placeholder="e.g. soccer"
            value={data.interest ?? ''}
            onChange={v => update('interest', v)}
            last
          />
        </Card>

        <SectionLabel>Preview</SectionLabel>
        <Card>
          <Text style={[local.previewText, { color: colors.textPrimary }]}>
            What if {data.name?.trim() || 'a friend'} was struggling with{' '}
            {data.interest?.trim() || 'something they love'} in {data.location?.trim() || 'your town'}?
          </Text>
        </Card>
      </ScreenScroll>
    </Screen>
  );
};

const Field = ({
  label,
  placeholder,
  value,
  onChange,
  last = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  last?: boolean;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View style={!last && local.field}>
      <Text style={[local.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          local.fieldInput,
          { color: colors.textPrimary, backgroundColor: surface.card, borderColor: surface.border },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.iconInactive}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
};

const local = StyleSheet.create({
  field: { marginBottom: Spacing.md },
  fieldLabel: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: INPUT_RADIUS,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
  },
  previewText: {
    fontSize: Typography.title3,
    fontFamily: 'Geomini-SemiBold',
    lineHeight: 28,
  },
});
