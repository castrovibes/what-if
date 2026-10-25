import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { findAgeGroup } from '../../data/ageGroups';
import { Card, Dot } from '../../ui/components';
import { usePersonalization } from '../../hooks/usePersonalization';
import { Note, noteDisplayTitle, formatNoteDateTime } from '../../db/repositories/notes';
import { PromptPlayRepo, PlayedPrompt } from '../../db/repositories/promptPlays';

/**
 * When a note was last edited, short: "Just now", "5 min ago", "3:41 PM" (today),
 * "Yesterday", "Oct 22" (this year), "Oct 22, 2025". Built from formatNoteDateTime
 * ("Oct 22, 2026 · 3:41 PM") so the two never disagree.
 */
export function formatNoteUpdated(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const minutes = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const [date, time] = formatNoteDateTime(d).split(' · ');
  if (d.toDateString() === now.toDateString()) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.getFullYear() === now.getFullYear() ? date.split(',')[0] : date;
}

/**
 * The prompts the given notes are about, by id, personalized as the deck shows them.
 * Looked up once per set of ids (when the folder's notes change), not per row render.
 * A prompt that no longer exists maps to null and its note shows no prompt line.
 */
export function useNotePrompts(notes: Note[] | null): Record<string, PlayedPrompt | null> {
  const personalization = usePersonalization();
  const [prompts, setPrompts] = useState<Record<string, PlayedPrompt | null>>({});
  const ids = [...new Set((notes ?? []).map(n => n.promptId).filter((id): id is string => !!id))];
  const idsKey = ids.sort().join('|');

  useEffect(() => {
    if (!idsKey) return;
    const wanted = idsKey.split('|');
    let cancelled = false;
    Promise.all(wanted.map(id => PromptPlayRepo.get(id, personalization))).then(found => {
      if (cancelled) return;
      setPrompts(prev => {
        const next = { ...prev };
        wanted.forEach((id, i) => (next[id] = found[i]));
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey, personalization]);

  return prompts;
}

/** One note in the Notebook list: title and edited time, a body preview, its prompt. */
export const NotebookNoteRow = ({
  note,
  prompt,
  onPress,
  onLongPress,
}: {
  note: Note;
  prompt: PlayedPrompt | null | undefined;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  const { colors } = useTheme();
  const title = noteDisplayTitle(note);
  // One line: newlines would otherwise end the preview at the first paragraph break.
  const preview = note.body.replace(/\s+/g, ' ').trim();
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Edited ${formatNoteDateTime(note.updatedAt)}`}
      accessibilityHint="Opens the note. Long-press to move or delete it."
    >
      <Card>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatNoteUpdated(note.updatedAt)}
          </Text>
        </View>
        {!!preview && (
          <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
            {preview}
          </Text>
        )}
        {prompt && (
          <View style={styles.promptRow}>
            <Dot color={findAgeGroup(prompt.ageGroup)?.bgColor} size={8} />
            <Text style={[styles.prompt, { color: colors.textSecondary }]} numberOfLines={1}>
              {prompt.text}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: Typography.callout,
    fontFamily: 'Geomini-Bold',
  },
  time: {
    fontSize: Typography.caption,
    fontFamily: 'Inter-Medium',
  },
  preview: {
    marginTop: 4,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  prompt: {
    flex: 1,
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
  },
});
