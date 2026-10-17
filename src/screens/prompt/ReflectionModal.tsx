import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ReflectionRepo } from '../../db/repositories/reflections';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { PINK } from '../../ui/surface';

/**
 * "How did that go?" after a prompt (Deliverable #5). Not wired into the prompt
 * screen yet; kept here, ready for when reflections are turned on.
 */
export const ReflectionModal = ({
  visible,
  promptId,
  contextId,
  onClose,
}: {
  visible: boolean;
  promptId: string;
  contextId: string;
  onClose: () => void;
}) => {
  const { colors } = useTheme();
  const [step, setStep] = useState<'choice' | 'reflect'>('choice');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setStep('choice');
      setNote('');
      setRating(null);
    }
  }, [visible]);

  const handleSave = async () => {
    if (note.trim() || rating !== null) {
      await ReflectionRepo.create({
        contextId,
        promptId,
        note: note.trim() || null,
        rating,
      });
    }
    onClose();
  };

  const ratingFaces = ['😞', '😐', '🙂', '😊', '🤩'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
          {step === 'choice' ? (
            <>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                How did that go?
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Take a moment to capture what came up — or skip to the next prompt.
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.bgMuted }]}
                  onPress={onClose}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>
                    Skip
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: PINK }]}
                  onPress={() => setStep('reflect')}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Reflect</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Reflect on the conversation
              </Text>
              <View style={styles.ratingRow}>
                {ratingFaces.map((face, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setRating(i + 1)}
                    style={[styles.ratingButton, rating === i + 1 && { backgroundColor: '#fdfb76' }]}
                  >
                    <Text style={styles.ratingFace}>{face}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.bgMuted,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="What did they say? What surprised you?"
                placeholderTextColor={colors.iconInactive}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.bgMuted }]}
                  onPress={onClose}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: PINK }]}
                  onPress={handleSave}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.title2,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: Typography.body,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  ratingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingFace: {
    fontSize: 28,
  },
  noteInput: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: Typography.body,
    fontFamily: 'Inter-Medium',
    textAlignVertical: 'top',
  },
});
