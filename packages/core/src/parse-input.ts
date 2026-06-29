/**
 * Framework-agnostic input tokenizer for argument entry.
 *
 * Part of the Citadel core: pure functions with no React or DOM dependency,
 * shared between the web (React) and terminal (CLI) front-ends. See
 * CORE_EXTRACTION_DESIGN.md.
 */

export interface ParsedInput {
  words: string[];
  currentWord: string;
  isQuoted: boolean;
  quoteChar?: "'" | '"';
  isComplete: boolean;
}

export function parseInput(input: string): ParsedInput {
  const words: string[] = [];
  let currentWord = '';
  let isQuoted = false;
  let quoteChar: "'" | '"' | undefined;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if ((char === '"' || char === "'") && (!isQuoted || char === quoteChar)) {
      if (isQuoted) {
        // End quote
        words.push(currentWord);
        currentWord = '';
        isQuoted = false;
        quoteChar = undefined;
      } else {
        // Start quote
        if (currentWord) {
          words.push(currentWord);
          currentWord = '';
        }
        isQuoted = true;
        quoteChar = char;
      }
    } else if (!isQuoted && char === ' ') {
      if (currentWord) {
        words.push(currentWord);
        currentWord = '';
      }
    } else {
      currentWord += char;
    }
  }

  return {
    words,
    currentWord,
    isQuoted,
    quoteChar,
    // Empty input is not "complete" — treating it as complete would commit an
    // empty argument when the user backspaces their input away.
    isComplete: !isQuoted && !currentWord && words.length > 0
  };
}

/**
 * Returns the trimmed input with a matching pair of surrounding single or
 * double quotes removed, so quoted argument values are stored without their
 * delimiters (`"Hello, world"` → `Hello, world`).
 */
export function stripSurroundingQuotes(input: string): string {
  const trimmed = input.trim();
  const first = trimmed[0];
  if ((first === '"' || first === "'") && trimmed.length >= 2 && trimmed.endsWith(first)) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
