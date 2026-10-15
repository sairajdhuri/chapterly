import assert from "node:assert/strict";
import test from "node:test";
import { analyzeChapter, getWords, getReadingLabel, getAssessment } from "../src/lib/readability.ts";
import readability from "text-readability";
import { SAMPLE_CHAPTER } from "../src/lib/sample.ts";

test("empty and punctuation-only chapters do not produce invented scores", () => {
  for (const text of ["", "  \n\n", "... ! — 😊"]) assert.equal(analyzeChapter(text), null);
});

test("chapter scores use text-readability without replacing its formula", () => {
  const result = analyzeChapter(SAMPLE_CHAPTER)!;
  assert.equal(result.rawScore, readability.fleschReadingEase(SAMPLE_CHAPTER));
  assert.equal(result.grade, Math.max(0, readability.fleschKincaidGrade(SAMPLE_CHAPTER)));
  assert.equal(readability.fleschReadingEase("The cat sat on the mat."), 116.15);
});

test("words support contractions, Unicode, numbers, and paragraph breaks", () => {
  assert.deepEqual(getWords("Clara’s café isn't closed.\n\n42 books—well-loved."), ["Clara’s", "café", "isn't", "closed", "42", "books", "well", "loved"]);
  assert.equal(getReadingLabel(0), "0 min");
  assert.equal(getReadingLabel(20), "< 1 min");
  assert.equal(getReadingLabel(239), "2 min");
});

test("sentences preserve exact offsets across dialogue, CRLF, and repeated text", () => {
  const text = '  “Go home!”\r\n\r\nShe stayed. She stayed.\nAn unfinished thought';
  const result = analyzeChapter(text)!;
  assert.equal(result.sentences.length, 4);
  for (const sentence of result.sentences) assert.equal(text.slice(sentence.start, sentence.end), sentence.text);
  assert.notEqual(result.sentences[1].start, result.sentences[2].start);
  assert.equal(result.text, text);
});

test("honorifics do not create phantom sentences", () => {
  const result = analyzeChapter("Dr. Clara met Mr. Bell. They went home.")!;
  assert.equal(result.sentences.length, 2);
  assert.equal(result.sentences[0].text, "Dr. Clara met Mr. Bell.");
});

test("five hardest sentences are ranked by raw difficulty, with stable ties", () => {
  const result = analyzeChapter(SAMPLE_CHAPTER)!;
  assert.equal(result.hardest.length, 5);
  assert.equal(new Set(result.hardest.map(s => s.start)).size, 5);
  for (let i = 1; i < result.hardest.length; i++) assert.ok(result.hardest[i - 1].score <= result.hardest[i].score);
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("a dense sentence ranks ahead of a short, familiar sentence", () => {
  const result = analyzeChapter("The cat sat on the mat. The extraordinarily complicated recommendation necessitated considerable deliberation.")!;
  assert.ok(result.hardest[0].text.includes("extraordinarily"));
  assert.ok(result.hardest[0].score < result.hardest[1].score);
});

test("short chapters produce only as many notes as there are sentences", () => {
  const result = analyzeChapter("The cat sat. The dog ran.")!;
  assert.equal(result.hardest.length, 2);
  assert.equal(result.words, 6);
  assert.equal(result.score, 100);
  assert.equal(getAssessment(result.score).label, "Very easy to read");
});

test("long chapters keep complete sentence offsets and finite scores", () => {
  const text = SAMPLE_CHAPTER.repeat(75);
  const result = analyzeChapter(text)!;
  assert.ok(result.words > 20000);
  assert.equal(result.hardest.length, 5);
  assert.ok(Number.isFinite(result.grade));
  assert.equal(result.characters, Array.from(text).length);
  for (const sentence of result.hardest) assert.equal(text.slice(sentence.start, sentence.end), sentence.text);
});
