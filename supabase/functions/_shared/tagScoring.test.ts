// Unit tests for tag score update logic — lowLevelDoc §13.1
import { assertEquals } from "jsr:@std/assert";
import { updateTagScores } from "./tagScoring.ts";

Deno.test("updateTagScores: like boost adds LIKE_BOOST to tag scores", () => {
  const current = { minimalist: 0.5 };
  const tags = ["minimalist", "black"];
  const result = updateTagScores(current, tags, "like");
  assertEquals(result.minimalist, 0.64);
  assertEquals(result.black, 0.15);
});

Deno.test("updateTagScores: skip penalty subtracts SKIP_PENALTY", () => {
  const current = { minimalist: 0.1 };
  const result = updateTagScores(current, ["minimalist"], "skip");
  assertEquals(result.minimalist, 0.048);
});

Deno.test("updateTagScores: skip penalty below zero is clamped to 0", () => {
  const current = { minimalist: 0.02 };
  const result = updateTagScores(current, ["minimalist"], "skip");
  assertEquals(result.minimalist, 0);
});

Deno.test("updateTagScores: decay applies to all existing tags before boost", () => {
  const current = { minimalist: 0.8, other: 0.5 };
  const result = updateTagScores(current, ["minimalist"], "like");
  assertEquals(result.other, 0.49);
});

Deno.test("updateTagScores: clamps scores to [0, 1]", () => {
  const current = { tag: 0.95 };
  const result = updateTagScores(current, ["tag"], "like");
  assertEquals(result.tag, 1);
});

Deno.test("updateTagScores: handles empty scores on first swipe (new user)", () => {
  const current: Record<string, number> = {};
  const tags = ["minimalist", "black"];
  const result = updateTagScores(current, tags, "like");
  assertEquals(result.minimalist, 0.15);
  assertEquals(result.black, 0.15);
});

Deno.test("updateTagScores: does not mutate input object", () => {
  const current = { minimalist: 0.5 };
  const copy = { ...current };
  updateTagScores(current, ["minimalist"], "like");
  assertEquals(current, copy);
});

Deno.test("updateTagScores: accepts custom constants", () => {
  const current = { x: 0.5 };
  const result = updateTagScores(current, ["x"], "like", {
    LIKE_BOOST: 0.2,
    SKIP_PENALTY: 0.05,
    DECAY_FACTOR: 1,
  });
  assertEquals(result.x, 0.7);
});
