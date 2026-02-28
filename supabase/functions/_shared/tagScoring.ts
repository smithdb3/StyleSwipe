// lowLevelDoc Appendix A.2 — Tag score update logic

export const LEARNING_CONSTANTS = {
  LIKE_BOOST: 0.15,
  SKIP_PENALTY: 0.05,
  DECAY_FACTOR: 0.98,
};

export function updateTagScores(
  currentScores: Record<string, number>,
  itemTags: string[],
  direction: "like" | "skip",
  constants = LEARNING_CONSTANTS
): Record<string, number> {
  const newScores = { ...currentScores };

  // Step 1: Decay all tags
  Object.keys(newScores).forEach((tag) => {
    newScores[tag] = newScores[tag] * constants.DECAY_FACTOR;
  });

  // Step 2: Apply boost or penalty
  itemTags.forEach((tag) => {
    if (newScores[tag] === undefined) newScores[tag] = 0;
    if (direction === "like") {
      newScores[tag] += constants.LIKE_BOOST;
    } else {
      newScores[tag] -= constants.SKIP_PENALTY;
    }
  });

  // Step 3: Clamp to [0, 1]
  Object.keys(newScores).forEach((tag) => {
    newScores[tag] = Math.max(0, Math.min(1, newScores[tag]));
  });

  return newScores;
}
