/** Styles shared by the faces of a prompt card (front, twist back, fitted text). */
import { StyleSheet } from 'react-native';
import { Typography, Spacing } from '../../utils/deviceHelpers';
import { CARD_CORNER_RADIUS, CARD_PADDING_X, CARD_PADDING_Y, QUESTION_TO_FOOTER } from './deck';

export const cardStyles = StyleSheet.create({
  // A card in the deck behind the top one. The clipping is on an inner layer
  // (stackCardClip), because clipping the card itself would also cut off its shadow.
  stackCardClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_CORNER_RADIUS,
    overflow: 'hidden',
    paddingHorizontal: CARD_PADDING_X,
    paddingVertical: CARD_PADDING_Y,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardBody: {
    // Fills the card between header and footer.
    flex: 1,
    paddingTop: Spacing.md,
    paddingBottom: QUESTION_TO_FOOTER,
  },
  // One side of the top card. Both sides fill the card; the flip shows one at a time.
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: CARD_PADDING_X,
    paddingVertical: CARD_PADDING_Y,
    justifyContent: 'space-between',
  },
  twistTextSlot: {
    flex: 1,
  },
  difficultyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  twistFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  twistPips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  twistPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  promptArea: {
    // The prompt text is fitted to this space.
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  unfitted: {
    opacity: 0,
  },
  promptText: {
    // fontSize and lineHeight are set per card by useFitPromptText.
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
  },
  fullQuestion: {
    marginTop: Spacing.sm,
    fontSize: Typography.subheadline,
    fontFamily: 'Inter-MediumItalic',
    lineHeight: 21,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  footerText: {
    fontSize: Typography.footnote,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.35,
  },
});
