/**
 * Saves from before DIS-07 finished the act with 10 memories, without `campfire`. A save that
 * has `star` has seen the ending, so it gets `campfire` too and stays finished instead of
 * dropping back to the campfire chapter. Pure, no storage access.
 */
export function migrateSave(saved: readonly string[]): string[] {
  const out = [...saved];
  if (out.includes('star') && !out.includes('campfire')) out.push('campfire');
  return out;
}
