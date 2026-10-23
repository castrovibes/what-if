import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ReflectionRepo } from '../../db/repositories/reflections';
import { Prompt } from '../../db/types';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { useSurface, INPUT_RADIUS } from '../../ui/surface';
import { BottomSheet, Button } from '../../ui/components';
import { toast } from '../../ui/toast';
import { haptic } from '../../ui/haptics';

// Prompts a child has actually talked about: the deck offers a reflection when a
// prompt leaves after being on top at least this long.
export const REFLECT_AFTER_MS = 45_000;
// How long the "How did that go?" toast stays before it goes on its own. A little
// longer than other toasts with an action: it arrives while they're moving on.
export const REFLECT_OFFER_MS = 6000;

const FACES = ['😞', '😐', '🙂', '😊', '🤩'];

/**
 * A quick rating and an optional note about a prompt, saved as a reflection for the
 * active context. When a prompt the user spent real time on is swiped away, the deck
 * offers it with a "How did that go?" toast (see PromptScreen); its Reflect button
 * opens this.
 */
export const ReflectionSheet = ({
  prompt,
  contextId,
  onClose,
}: {
  /** The prompt to reflect on; null closes the sheet. */
  prompt: Prompt | null;
  contextId: string;
  onClose: () => void;
}) => {
  const { colors } = useTheme();
  const surface = useSurface();
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  // Keeps showing the prompt while the sheet slides away after it's set to null.
  const shown = useRef<Prompt | null>(null);
  if (prompt) shown.current = prompt;
  const visible = prompt !== null;

  useEffect(() => {
    if (visible) {
      setNote('');
      setRating(null);
    }
  }, [visible]);

  const save = async () => {
    const p = shown.current;
    if (!p) return onClose();
    if (note.trim() || rating !== null) {
      await ReflectionRepo.create({
        contextId,
        promptId: p.id,
        note: note.trim() || null,
        rating,
      });
      haptic.success();
      toast.show({ message: 'Reflection saved', icon: 'check' });
    }
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="Reflect on the conversation" onClose={onClose}>
      {shown.current && (
        <Text style={[styles.prompt, { color: colors.textPrimary }]} numberOfLines={3}>
          {shown.current.text}
        </Text>
      )}
      <View style={styles.faces} accessibilityRole="radiogroup">
        {FACES.map((face, i) => {
          const on = rating === i + 1;
          return (
            <TouchableOpacity
              key={face}
              onPress={() => {
                haptic.selection();
                setRating(i + 1);
              }}
              style={[
                styles.face,
                { borderColor: on ? surface.accent : surface.border },
                on && { backgroundColor: colors.tintPurple },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${i + 1} of 5`}
            >
              <Text style={styles.faceText}>{face}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TextInput
        style={[
          styles.note,
          {
            color: colors.textPrimary,
            backgroundColor: surface.screen,
            borderColor: surface.border,
          },
        ]}
        placeholder="What did they say? What surprised you?"
        placeholderTextColor={colors.iconInactive}
        value={note}
        onChangeText={setNote}
        multiline
      />
      <View style={styles.buttons}>
        <View style={styles.flex}>
          <Button label="Cancel" variant="secondary" onPress={onClose} />
        </View>
        <View style={styles.flex}>
          <Button label="Save" onPress={save} disabled={!note.trim() && rating === null} />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  prompt: {
    fontSize: Typography.callout,
    fontFamily: 'Geomini-SemiBold',
    lineHeight: Math.round(Typography.callout * 1.35),
    marginBottom: Spacing.md,
  },
  faces: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  face: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceText: {
    fontSize: 26,
  },
  note: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: INPUT_RADIUS,
    padding: Spacing.md,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
