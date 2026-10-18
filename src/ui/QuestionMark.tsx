import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { QUESTION_MARK_PATH, QUESTION_MARK_VIEWBOX } from './questionMarkPath';

// The drawing's weight (stem and dot) sits right of its bounding box's center, because the
// hook's tail reaches far left, so a box-centered mark looks off center. It's drawn shifted
// left by this share of its width (the launch images use the same value).
const OPTICAL_SHIFT = 0.1;

/**
 * The hand-drawn question mark from the launch screen, as a vector: ink lines only, in
 * one color, with nothing behind them, so it sits on any card. Sized by height.
 */
export function QuestionMark({ height, color, opacity = 1 }: { height: number; color: string; opacity?: number }) {
  const { width: vw, height: vh } = QUESTION_MARK_VIEWBOX;
  const width = (height * vw) / vh;
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${vw} ${vh}`}
      opacity={opacity}
      style={{ transform: [{ translateX: -width * OPTICAL_SHIFT }] }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={QUESTION_MARK_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
