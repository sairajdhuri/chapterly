import readability from "text-readability";

const sentenceSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });
const wordPattern = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;

export type Sentence = {
  start: number;
  end: number;
  text: string;
  words: number;
  syllables: number;
  score: number;
};

export type Analysis = {
  text: string;
  score: number;
  rawScore: number;
  grade: number;
  words: number;
  characters: number;
  readingMinutes: number;
  averageLength: number;
  sentences: Sentence[];
  hardest: Sentence[];
};

export function getWords(text: string): string[] {
  return text.match(wordPattern) ?? [];
}

export function getReadingLabel(words: number): string {
  if (words === 0) return "0 min";
  if (words < 238) return "< 1 min";
  return `${Math.ceil(words / 238)} min`;
}

export function getAssessment(score: number): { label: string; description: string } {
  if (score >= 90) return { label: "Very easy to read", description: "Simple, direct language gives your chapter a light, steady pace." };
  if (score >= 80) return { label: "Easy to read", description: "Your words move easily. Readers have room to settle into the story." };
  if (score >= 70) return { label: "Fairly easy to read", description: "An approachable chapter, with a little texture to keep things interesting." };
  if (score >= 60) return { label: "A comfortable read", description: "A balanced reading pace. A few thoughtful edits could make it flow even better." };
  if (score >= 50) return { label: "A more considered read", description: "Your prose asks for a little attention. Look for places to give your reader a breath." };
  if (score >= 30) return { label: "A demanding read", description: "Long sentences and layered words slow the pace. Consider where a simpler phrase would help." };
  return { label: "A challenging read", description: "Dense language asks a lot of your reader. Try shorter sentences where you want more momentum." };
}

export function getSentenceAdvice(sentence: Sentence): string {
  if (sentence.words > 30) return "Try a full stop where one thought becomes another.";
  if (sentence.syllables / sentence.words > 1.7) return "Could a familiar word carry the same meaning?";
  return "Read this aloud. Is there a simpler route to your point?";
}

export function analyzeChapter(text: string): Analysis | null {
  const words = getWords(text);
  if (!words.length) return null;

  const sentences: Sentence[] = [];
  for (const part of sentenceSegmenter.segment(text)) {
    const leadingSpace = part.segment.length - part.segment.trimStart().length;
    const trimmed = part.segment.trim();
    if (!getWords(trimmed).length) continue;
    const start = part.index + leadingSpace;
    const previous = sentences.at(-1);
    // Intl.Segmenter may split a title from the name that follows it.
    if (previous && /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St)\.$/i.test(previous.text)) {
      previous.end = start + trimmed.length;
      previous.text = text.slice(previous.start, previous.end);
    } else {
      sentences.push({ start, end: start + trimmed.length, text: trimmed, words: 0, syllables: 0, score: 0 });
    }
  }

  for (const sentence of sentences) {
    const sentenceWords = getWords(sentence.text);
    sentence.words = sentenceWords.length;
    sentence.syllables = readability.syllableCount(sentence.text);
    sentence.score = readability.fleschReadingEase(sentence.text);
  }

  const rawScore = readability.fleschReadingEase(text);
  return {
    text,
    rawScore,
    score: Math.round(Math.max(0, Math.min(100, rawScore))),
    grade: Math.max(0, readability.fleschKincaidGrade(text)),
    words: words.length,
    characters: Array.from(text).length,
    readingMinutes: Math.ceil(words.length / 238),
    averageLength: Math.round(words.length / sentences.length),
    sentences,
    hardest: [...sentences].sort((a, b) => a.score - b.score || a.start - b.start).slice(0, 5),
  };
}
