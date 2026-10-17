import React, { useRef, useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { cardStyles } from './cardStyles';
import { PROMPT_FONT_MAX, PROMPT_FONT_MIN, promptLineHeight } from './deck';

/**
 * Picks the largest prompt font size (between the max and min) at which the prompt
 * fits its area of the card, between the header and the follow-up question. The text
 * stays hidden until it fits, so it never visibly resizes. Text area grows with the
 * square of the font size, so each step jumps close to the answer and it settles in
 * two or three layouts.
 */
// Fitted sizes by text, so a prompt that moves to a new card (e.g. from the title deck
// into the session deck) shows at once instead of being hidden while it's measured.
const fitCache = new Map<string, { fontSize: number; maxLines?: number }>();

const startFit = (text: string) => {
  const cached = fitCache.get(text);
  return cached
    ? { text, fontSize: cached.fontSize, fitted: true, maxLines: cached.maxLines }
    : { text, fontSize: PROMPT_FONT_MAX, fitted: false };
};

export const useFitPromptText = (text: string) => {
  const [fit, setFit] = useState<{
    text: string;
    fontSize: number;
    fitted: boolean;
    maxLines?: number;
  }>(() => startFit(text));
  const available = useRef(0);
  const needed = useRef(0);

  // New text starts over at full size. Reset during render rather than in an effect,
  // so a layout that arrives first can't be undone by a late reset.
  let current = fit;
  if (fit.text !== text) {
    current = startFit(text);
    needed.current = 0;
    setFit(current);
  }
  const { fontSize, fitted, maxLines } = current;

  const check = () => {
    if (fitted || !available.current || !needed.current) return;
    if (needed.current <= available.current) {
      fitCache.set(text, { fontSize });
      setFit({ text, fontSize, fitted: true });
      return;
    }
    if (fontSize <= PROMPT_FONT_MIN) {
      // Too long even at the smallest size: cut it off with an ellipsis at the last
      // line that fits.
      const lines = Math.max(1, Math.floor(available.current / promptLineHeight(fontSize)));
      fitCache.set(text, { fontSize, maxLines: lines });
      setFit({ text, fontSize, fitted: true, maxLines: lines });
      return;
    }
    const estimate = Math.floor(fontSize * Math.sqrt(available.current / needed.current));
    needed.current = 0; // wait for the next attempt's own measurement
    setFit({
      text,
      fontSize: Math.max(PROMPT_FONT_MIN, Math.min(fontSize - 1, estimate)),
      fitted: false,
    });
  };

  return {
    fontSize,
    fitted,
    maxLines,
    /** Remounts the measured text for each attempt, so every attempt gets a layout. */
    attemptKey: `${text}:${fontSize}`,
    onAreaLayout: (e: LayoutChangeEvent) => {
      available.current = e.nativeEvent.layout.height;
      check();
    },
    onPromptLayout: (e: LayoutChangeEvent) => {
      needed.current = e.nativeEvent.layout.height;
      check();
    },
  };
};

/** Prompt-sized text, fitted to the space it's given (see useFitPromptText). */
export const FittedPromptText = ({ text, color }: { text: string; color: string }) => {
  const { fontSize, fitted, maxLines, attemptKey, onAreaLayout, onPromptLayout } =
    useFitPromptText(text);
  return (
    <View style={cardStyles.promptArea} onLayout={onAreaLayout}>
      <Text
        key={attemptKey}
        onLayout={onPromptLayout}
        numberOfLines={maxLines}
        style={[
          cardStyles.promptText,
          { color, fontSize, lineHeight: promptLineHeight(fontSize) },
          !fitted && cardStyles.unfitted,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};
