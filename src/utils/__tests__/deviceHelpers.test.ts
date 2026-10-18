import { responsiveValue, Typography, Spacing, getFontSize } from '../deviceHelpers';

describe('deviceHelpers', () => {
  it('responsiveValue always returns something for the current device', () => {
    expect(responsiveValue({ default: 1 })).toBe(1);
    expect(typeof responsiveValue({ small: 1, standard: 2, large: 3, xlarge: 4, default: 5 })).toBe('number');
  });

  it('keeps the type scale ordered from caption to display', () => {
    const scale = [
      Typography.caption,
      Typography.footnote,
      Typography.subheadline,
      Typography.callout,
      Typography.body,
      Typography.title3,
      Typography.title2,
      Typography.title1,
      Typography.largeTitle,
      Typography.display,
    ];
    for (let i = 1; i < scale.length; i++) expect(scale[i]).toBeGreaterThanOrEqual(scale[i - 1]);
  });

  it('keeps spacing steps ordered and font scaling within ±15%', () => {
    expect(Spacing.xs).toBeLessThan(Spacing.sm);
    expect(Spacing.sm).toBeLessThan(Spacing.md);
    expect(Spacing.md).toBeLessThan(Spacing.lg);
    const scaled = getFontSize(20);
    expect(scaled).toBeGreaterThanOrEqual(17);
    expect(scaled).toBeLessThanOrEqual(23);
  });
});
