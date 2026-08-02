const MIN_TEXT_LUMINANCE = 0.42;

/**
 * Faction colours are configurable, and darker ones — the Republic's pure blue
 * especially — are close to unreadable as small text on the dark panels. Lifts a
 * colour toward white until it clears a luminance floor, which keeps the hue so
 * the faction stays recognisable. Use for text only; bars, dots and glows should
 * keep the configured colour.
 */
export function readableOnDark(hex: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;

  const value = parseInt(match[1], 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const luminance = (0.299 * channels[0] + 0.587 * channels[1] + 0.114 * channels[2]) / 255;
  if (luminance >= MIN_TEXT_LUMINANCE) return hex;

  const lift = (MIN_TEXT_LUMINANCE - luminance) / (1 - luminance);
  const lifted = channels.map((c) => Math.round(c + (255 - c) * lift));
  return `#${lifted.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
