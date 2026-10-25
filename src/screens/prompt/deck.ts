/**
 * Shared constants and types for the prompt deck (PromptScreen and its parts).
 * Timing, slot geometry and card sizing live here so every piece of the deck
 * animates and lays out from the same numbers.
 */
import { PixelRatio } from 'react-native';
import { interpolate, FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { ReportReason } from '../../backend/reports';
import { PromptSource } from '../../db/types';
import { CARD_RADIUS } from '../../ui/surface';
import { Typography, Spacing } from '../../utils/deviceHelpers';

export const CARD_MARGIN_BOTTOM = 24;
export const CARD_CORNER_RADIUS = CARD_RADIUS;

// Twists: the Twist button flips the top card over to show them on its back.
export const FLIP_MS = 450;
// Arriving from elsewhere ("Play in deck"): the screen fades up as the tab switches in.
export const ARRIVAL_FADE_MS = 200;
export const ARRIVAL_DELAY_MS = 16;
// The action buttons' fade-in when a session starts: each one a little after the last.
export const ACTION_FADE_MS = 360;
export const ACTION_STAGGER_MS = 90;
export const actionEntering = (order: number) =>
  FadeIn.duration(ACTION_FADE_MS).delay(order * ACTION_STAGGER_MS);
// While flipped, a twist slides this far out (fading) and the next one slides in.
export const TWIST_SLIDE = 40;
export const TWIST_OUT_MS = 110;
export const TWIST_IN_MS = 170;
// How much the card swells at the midpoint of a flip.
export const FLIP_LIFT = 0.06;

export const SWIPE_MS = 320;
// Fraction of the screen width a drag must cover to change prompts (or a quick flick),
// matching the Welcome Tutorial's deck.
export const SWIPE_THRESHOLD = 0.22;
// Gesture Handler reports velocity in px/s (PanResponder used px/ms, hence 0.5).
export const FLICK_VELOCITY = 500;
// Card edge tap zones stop this far from the top and bottom, clear of the header and
// footer buttons.
export const CARD_EDGE_ZONE_INSET = 64;

// Resting offsets of the deck's slots, top card first. During a skip the top card
// flies off and each card below moves up one slot. The steps shrink with depth
// (6px/1.5°, then 4px/0.9°, then 2px/0.6°), so most of the motion is at the top and
// the bottom of the deck barely stirs.
export const SLOT_Y = [0, 6, 10, 12];
export const SLOT_ROTATE = [0, -1.5, -0.6, 0];
export const SLOTS = SLOT_Y.map((_, i) => i);
export const DEEPEST_SLOT = SLOTS.length - 1;
// The deck never runs out: a card is mounted one slot past the deepest, invisible,
// and fades in as the others move up.
export const SPAWN_DEPTH = SLOTS.length;
// Every card casts a shadow, sized by its slot: short and tight near the bottom of
// the deck, growing to the full card shadow as it rises to the top.
export const SHADOW_SIZE = [1, 0.5, 0.3, 0.15];
export const SHADOW_STRENGTH = [1, 0.85, 0.7, 0.55];

export type ShadowBase = { opacity: number; radius: number; offsetY: number; elevation: number };

export const deckShadow = (slot: number, base: ShadowBase) => {
  'worklet';
  const size = interpolate(slot, SLOTS, SHADOW_SIZE, 'clamp');
  return {
    shadowOpacity: base.opacity * interpolate(slot, SLOTS, SHADOW_STRENGTH, 'clamp'),
    shadowRadius: base.radius * size,
    shadowOffset: { width: 0, height: base.offsetY * size },
    elevation: base.elevation * size,
  };
};

export type DeckSource = 'official' | 'user';

/** Which bottom sheet is open on the prompt screen. */
export type Sheet = 'situation' | 'discussion' | 'report' | 'source' | 'deck' | null;

// The title deck before a session: the title card (0), the age options or first prompt
// (1), the first prompt after the age options (2), and enough below to keep the deck
// full while it moves up two cards. Deepest first, so the top card draws last.
export const TITLE_DECK_INDEXES = [6, 5, 4, 3, 2, 1, 0];

export const SOURCE_LABEL: Record<PromptSource, string> = {
  official: 'What If Originals',
  community: 'Community',
  user: 'My Prompts',
};

export const REPORT_REASONS: {
  reason: ReportReason;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { reason: 'inappropriate', label: 'Not appropriate', icon: 'alert-triangle' },
  { reason: 'wrong-age', label: 'Wrong for this age group', icon: 'users' },
  { reason: 'confusing', label: 'Confusing or unclear', icon: 'help-circle' },
  { reason: 'other', label: 'Something else', icon: 'more-horizontal' },
];

// Every prompt card is the same height. Prompt text starts at the title size and
// shrinks to fit, down to a floor that's still easy to read aloud; text that doesn't
// fit even then is cut off (see TESTFLIGHT_CHECKLIST.md on long prompts).
// The card grows upward only: CARD_GROW is added to the height and to the padding
// under the deck, which keeps the bottom edge where a 340pt card's would be while the
// top reaches toward the filter pills.
export const CARD_GROW = 40;
// Larger system text sizes (Dynamic Type / font scale) get a proportionally taller
// card, capped so it still fits a small phone with the deck scrolling, so prompts
// aren't cut off at the floor size just because the reader needs bigger text.
const FONT_SCALE = Math.min(Math.max(PixelRatio.getFontScale(), 1), 1.6);
export const CARD_HEIGHT = Math.round((340 + CARD_GROW) * FONT_SCALE);
// Geomini sets wider than Inter, so prompts run about 10% under the title sizes to keep
// wrapping down (e.g. 23 to 18 pt on a standard iPhone, instead of 26 to 20).
const PROMPT_FONT_SCALE = 0.9;
export const PROMPT_FONT_MAX = Math.round(Typography.title1 * PROMPT_FONT_SCALE);
export const PROMPT_FONT_MIN = Math.round(Typography.title3 * PROMPT_FONT_SCALE);
// Inset of everything on the card from its edges: tighter top and bottom than sides.
export const CARD_PADDING_X = Spacing.lg;
export const CARD_PADDING_Y = Spacing.md;
// Fixed gap between the follow-up question and the Listen / Tips row.
export const QUESTION_TO_FOOTER = Spacing.md;
export const promptLineHeight = (fontSize: number) => Math.round(fontSize * 1.25);
