import dictionaryJsonString from "./assets/dutch-dictionary.json?raw";

type CompressedDictionaryEntry = [
  string, // title
  string, // pos
  [
    string, // definition
    [
      string, // example in Dutch
      string? // translated example
    ][]? // examples
  ][] // definitions
];

type CompressedDictionary = {
  [key: string]: CompressedDictionaryEntry[] | undefined;
};

type VerboseDefinition = {
  text: string;
  examples?: [string, string?][];
};

type VerboseDictionaryEntry = {
  title: string;
  partOfSpeech: string;
  definitions: VerboseDefinition[];
};

const delim = /[\s|\/\\(){}\[\]<>@#$%^&*+\-~:;"?!,.]/;
const dictionary: CompressedDictionary = JSON.parse(dictionaryJsonString);

const isDelimCharacter = (char: string): boolean => {
  return delim.test(char);
};

const expandRangeToWord = (text: string, index: number): [number, number] => {
  let left = index;
  let right = index;

  while (left > 0 && !isDelimCharacter(text[left - 1])) {
    left--;
  }

  while (right < text.length - 1 && !isDelimCharacter(text[right + 1])) {
    right++;
  }

  return [left, right];
};

const trimSingleQuotes = (text: string): string => {
  if (text[0] === "'") {
    text = text.substring(1);
  }

  if (text[text.length - 1] === "'") {
    text = text.substring(0, text.length - 1);
  }

  return text;
};

const expandToWord = (
  text: string,
  index: number
): [string, number, number] | [null, null, null] => {
  if (isDelimCharacter(text[index])) {
    return [null, null, null];
  }

  const [left, right] = expandRangeToWord(text, index);
  const finalWord = trimSingleQuotes(text.substring(left, right + 1));

  if (finalWord === "") {
    return [null, null, null];
  }

  return [finalWord, left, right];
};

const lookup = (word: string): VerboseDictionaryEntry[] | null => {
  let entries: CompressedDictionaryEntry[];

  do {
    const lowerCaseWord = word.toLowerCase();
    entries = dictionary[word] ?? [];

    if (word !== lowerCaseWord) {
      entries = [...entries, ...(dictionary[word.toLowerCase()] ?? [])];
    }

    if (entries.length === 0) {
      word = word.substring(0, word.length - 1);
    }
  } while (entries?.length === 0 && word.length > 0);

  if (entries.length === 0) {
    return null;
  }

  const verboseEntries: VerboseDictionaryEntry[] = [];

  for (const entry of entries) {
    const [title, partOfSpeech, definitions] = entry;
    const verboseDefinitions: VerboseDefinition[] = [];

    for (const definition of definitions ?? []) {
      const [text, examples] = definition;

      verboseDefinitions.push({
        text,
        ...(examples ? { examples } : {}),
      });
    }

    verboseEntries.push({
      title,
      partOfSpeech,
      definitions: verboseDefinitions,
    });
  }

  return verboseEntries;
};

const selectTextInNode = (node: Node, start: number, end: number): void => {
  const range = document.createRange();

  range.setStart(node, start);
  range.setEnd(node, end);

  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  selection.removeAllRanges();
  selection.addRange(range);
};

export type { VerboseDictionaryEntry };
export { expandToWord, lookup, selectTextInNode };
