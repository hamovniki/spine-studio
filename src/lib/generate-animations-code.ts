/**
 * Builds a copy-pasteable JS constant that maps a Spine skeleton's animations
 * to safe, uppercase keys.
 *
 * const lnr_banner = {
 *   SPINE_NAME: 'lnr_banner',
 *   ANIMATIONS: {
 *     ANIMATION_ACTIVE_COL: 'animation_active_col',
 *   },
 * };
 */

export interface NamedAnimation {
  name: string;
}

/** Any character that cannot appear in a JS identifier. */
const INVALID_IDENTIFIER_CHAR = /[^\p{L}\p{N}_$]/gu;

function sanitizeIdentifier(value: string): string {
  const cleaned = value.replace(INVALID_IDENTIFIER_CHAR, '_');
  return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned;
}

/** `lnr-banner v2` -> `lnr_banner_v2` */
export function toConstantName(spineName: string): string {
  const name = sanitizeIdentifier(spineName.trim());
  return name.replace(/_/g, '') ? name : 'SPINE';
}

/** `animation active-col.ex` -> `ANIMATION_ACTIVE_COL_EX` */
export function toAnimationKey(animationName: string): string {
  return sanitizeIdentifier(animationName.trim().toUpperCase());
}

/** Quotes a value for single-quoted JS output, keeping the original name intact. */
function quote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function generateAnimationsCode(
  spineName: string,
  animations: ReadonlyArray<NamedAnimation | string>,
): string {
  const names = animations.map((animation) =>
    typeof animation === 'string' ? animation : animation.name,
  );

  const lines = [
    `const ${toConstantName(spineName)} = {`,
    `  SPINE_NAME: ${quote(spineName)},`,
    '  ANIMATIONS: {',
    ...names.map((name) => `    ${toAnimationKey(name)}: ${quote(name)},`),
    '  },',
    '};',
  ];

  return lines.join('\n');
}
