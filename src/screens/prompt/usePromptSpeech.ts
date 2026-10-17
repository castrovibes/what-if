import { useEffect, useState } from 'react';
import * as Speech from 'expo-speech';
import { usePersonalization } from '../../hooks/usePersonalization';
import { applyTokens } from '../../data/personalizationTokens';
import { Prompt } from '../../db/types';

/**
 * Reads the current prompt aloud. Stops when the prompt changes or the screen goes
 * away, so speech never outlives the card it belongs to.
 */
export const usePromptSpeech = (prompt: Prompt | undefined) => {
  const personalization = usePersonalization();
  const [speaking, setSpeaking] = useState(false);
  const promptId = prompt?.id ?? '';

  useEffect(() => {
    Speech.stop();
    setSpeaking(false);
  }, [promptId]);
  useEffect(() => () => void Speech.stop(), []);

  const toggleListen = () => {
    if (!prompt) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const done = () => setSpeaking(false);
    Speech.speak(`${applyTokens(prompt.text, personalization)} ${prompt.fullQuestion}`, {
      language: 'en-US',
      rate: 0.95,
      onDone: done,
      onStopped: done,
      onError: done,
    });
    setSpeaking(true);
  };

  return { speaking, toggleListen };
};
