/** Compact only the decimal padding in ExpressionEngine.format() output. */
export function compactFormattedResult(formatted) {
  const text = formatted.text;
  const match = text.match(/^(≈?)([+-]?\d+),(\d+)(.*)$/);
  if (!match) return text;

  const decimals = match[3].replace(/0+$/, '');
  const number = decimals ? `${match[2]},${decimals}` : match[2];
  return `${match[1]}${number}${match[4]}`;
}
