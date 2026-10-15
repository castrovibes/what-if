import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { styles } from '../styles/sharedStyles';
import { usePersonalizationEditor } from '../hooks/usePersonalization';
import { useActiveContext } from '../providers/ActiveContextProvider';
import { Typography, Spacing } from '../utils/deviceHelpers';

export const PersonalizationScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { activeContext } = useActiveContext();
  const { data, update, loaded } = usePersonalizationEditor();

  if (!loaded) return null;

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonRow}>
          <Feather name="chevron-left" size={20} color="#e10086" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>PERSONALIZE</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Tailor prompts for {activeContext.label}. Fields are optional — anything you leave blank uses a neutral fallback.
        </Text>

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
        />

        <View style={[localStyles.previewCard, { backgroundColor: colors.tipsBg }]}>
          <Text style={[localStyles.previewLabel, { color: colors.textSecondary }]}>PREVIEW</Text>
          <Text style={[localStyles.previewText, { color: colors.textPrimary }]}>
            What if {data.name?.trim() || 'a friend'} was struggling with{' '}
            {data.interest?.trim() || 'something they love'} in {data.location?.trim() || 'your town'}?
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const { colors } = useTheme();
  return (
    <View style={localStyles.field}>
      <Text style={[localStyles.fieldLabel, { color: colors.textSecondary }]}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        style={[
          localStyles.fieldInput,
          { color: colors.textPrimary, backgroundColor: colors.bgMuted, borderColor: colors.border },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.iconInactive}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  field: { marginTop: Spacing.lg },
  fieldLabel: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
  },
  previewCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: 12,
  },
  previewLabel: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: Spacing.sm,
  },
  previewText: {
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    lineHeight: 22,
  },
});
