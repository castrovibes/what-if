import { applyTokens } from '../personalizationTokens';

const empty = { name: null, location: null, interest: null } as never;

describe('applyTokens', () => {
  it('substitutes every token when personalization is filled in', () => {
    const out = applyTokens(
      'What if {name} invited you to {location} to try {interest}?',
      { name: 'Maya', location: 'Austin', interest: 'skateboarding' } as never,
    );
    expect(out).toBe('What if Maya invited you to Austin to try skateboarding?');
  });

  it('falls back to neutral phrasing when a value is missing or blank', () => {
    const out = applyTokens('{name} in {location} loves {interest}.', {
      name: '   ',
      location: null,
      interest: undefined,
    } as never);
    expect(out).toBe('a friend in your town loves something you love.');
  });

  it('replaces repeated tokens and leaves other text alone', () => {
    expect(applyTokens('{name} and {name}', empty)).toBe('a friend and a friend');
    expect(applyTokens('No tokens here', empty)).toBe('No tokens here');
  });
});
