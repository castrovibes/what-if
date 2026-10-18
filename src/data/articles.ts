// PLACEHOLDER CONTENT — dummy article stubs for Explore's Articles & Guides carousel.
// There's no article content or reader yet; tapping one shows "coming soon". Replace
// with real articles (and a reader screen) when the content team writes them.

import { Feather } from '@expo/vector-icons';

type IconName = keyof typeof Feather.glyphMap;

export type ArticleKind = 'Guide' | 'Article' | 'Blog';

export type ArticleStub = {
  id: string;
  kind: ArticleKind;
  title: string;
  blurb: string;
  readMinutes: number;
  icon: IconName;
};

export const ARTICLE_STUBS: readonly ArticleStub[] = [
  {
    id: 'art-why-could',
    kind: 'Guide',
    title: 'Why "What could you do?" beats "What should you do?"',
    blurb: 'How open questions invite kids to brainstorm instead of guessing the right answer.',
    readMinutes: 4,
    icon: 'compass',
  },
  {
    id: 'art-i-dont-know',
    kind: 'Guide',
    title: 'When your child says "I don\'t know"',
    blurb: 'Gentle ways to keep the conversation going without turning it into a quiz.',
    readMinutes: 3,
    icon: 'help-circle',
  },
  {
    id: 'art-car-rides',
    kind: 'Article',
    title: 'Five ways to make the most of a car ride',
    blurb: 'Side by side, no eye contact: why the car is one of the best places to talk.',
    readMinutes: 5,
    icon: 'truck',
  },
  {
    id: 'art-teens',
    kind: 'Article',
    title: 'Talking with teens who would rather not talk',
    blurb: 'Lower the stakes, follow their lead, and let silence do some of the work.',
    readMinutes: 6,
    icon: 'message-circle',
  },
  {
    id: 'art-dinner-table',
    kind: 'Blog',
    title: 'What we learned from a month of dinner-table questions',
    blurb: 'Notes from families trying one "What if…?" a night.',
    readMinutes: 4,
    icon: 'coffee',
  },
];
