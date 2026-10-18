import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { BottomSheet, SheetOption, Dot } from '../../ui/components';
import { DiscussionTips } from '../../components/DiscussionTips';
import { ReportReason } from '../../backend/reports';
import { LiminalSpace } from '../../db/types';
import { ageGroups, AgeGroupId } from '../../data/ageGroups';
import { DeckSource, REPORT_REASONS, Sheet } from './deck';

/**
 * The prompt screen's bottom sheets: deck source, situation, discussion tips, report,
 * and "pick another deck" (from the card at the end of a deck).
 */
export const PromptSheets = ({
  sheet,
  onClose,
  deckSource,
  onChooseSource,
  spaces,
  liminalSpace,
  onChooseSpace,
  selectedAge,
  onChooseAge,
  promptId,
  onReport,
}: {
  sheet: Sheet;
  onClose: () => void;
  deckSource: DeckSource;
  onChooseSource: (source: DeckSource) => void;
  spaces: LiminalSpace[];
  liminalSpace: string | null;
  onChooseSpace: (id: string | null) => void;
  selectedAge: AgeGroupId | null;
  onChooseAge: (id: AgeGroupId) => void;
  promptId: string;
  onReport: (reason: ReportReason) => void;
}) => {
  const { colors } = useTheme();
  return (
    <>
      <BottomSheet visible={sheet === 'source'} title="Show prompts from" onClose={onClose}>
        <SheetOption
          label="What If Originals"
          selected={deckSource === 'official'}
          leading={<Ionicons name="sparkles-outline" size={16} color={colors.iconDefault} />}
          onPress={() => onChooseSource('official')}
        />
        <SheetOption
          label="My Prompts"
          selected={deckSource === 'user'}
          leading={<Ionicons name="folder-outline" size={16} color={colors.iconDefault} />}
          onPress={() => onChooseSource('user')}
        />
      </BottomSheet>

      <BottomSheet visible={sheet === 'deck'} title="Pick another deck" onClose={onClose}>
        {ageGroups.map(g => (
          <SheetOption
            key={g.id}
            label={`Ages ${g.label.replace('-', ' – ')}`}
            selected={g.id === selectedAge}
            leading={<Dot color={g.bgColor} />}
            onPress={() => onChooseAge(g.id)}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={sheet === 'situation'} title="Right now we're…" onClose={onClose}>
        <SheetOption
          label="Anywhere"
          selected={liminalSpace === null}
          leading={<Feather name="globe" size={16} color={colors.iconDefault} />}
          onPress={() => onChooseSpace(null)}
        />
        {spaces.map(s => (
          <SheetOption
            key={s.id}
            label={s.name}
            selected={s.id === liminalSpace}
            leading={
              <Feather
                name={(s.icon as keyof typeof Feather.glyphMap) ?? 'circle'}
                size={16}
                color={colors.iconDefault}
              />
            }
            onPress={() => onChooseSpace(s.id)}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={sheet === 'discussion'} title="Discussion tips" onClose={onClose}>
        <ScrollView style={styles.discussionScroll}>
          <DiscussionTips promptId={promptId} />
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={sheet === 'report'} title="What’s wrong with this prompt?" onClose={onClose}>
        {REPORT_REASONS.map(r => (
          <SheetOption
            key={r.reason}
            label={r.label}
            leading={<Feather name={r.icon} size={16} color={colors.iconDefault} />}
            onPress={() => onReport(r.reason)}
          />
        ))}
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  discussionScroll: {
    maxHeight: 420,
  },
});
