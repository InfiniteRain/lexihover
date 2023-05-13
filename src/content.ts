import "./style.css";

type Box = {
  word: string;
  element: HTMLDivElement;
  child: Box | null;
};

type CompressedDictionary = {
  [key: string]:
    | [
        string, // title
        string, // pos
        [
          string, // definition
          [
            string, // example in Dutch
            string? // translated example
          ][]? // examples
        ][] // definitions
      ][] // entries
    | undefined;
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

const dictPromise: Promise<CompressedDictionary> = fetch(
  chrome.runtime.getURL("dutch-dictionary.json")
).then((response) => response.json());
const delim = /[\s|\/\\(){}\[\]<>@#$%^&*+\-~:;"?!,.]/;

let mouseX = 0;
let mouseY = 0;
let isShiftPressed = false;
let shiftPressedOn: Box | null = null;
let box: Box | null = null;

const createDefinitionBoxElement = (
  entries: VerboseDictionaryEntry[],
  x: number,
  y: number
) => {
  const box = document.createElement("div");

  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
  box.classList.add("lexihover-definition-box");

  const inner = document.createElement("div");
  inner.classList.add("lexihover-inner-box");

  box.append(inner);

  for (const [key, entry] of entries.entries()) {
    if (key > 0) {
      const hr = document.createElement("hr");

      inner.appendChild(hr);
    }

    const marginContainer = document.createElement("div");
    marginContainer.classList.add("lexihover-margin-container");

    const entryHeading = document.createElement("h1");
    entryHeading.innerText = entry.title;

    marginContainer.appendChild(entryHeading);

    const ol = document.createElement("ol");

    for (const definition of entry.definitions) {
      const li = document.createElement("li");
      li.innerText = definition.text;

      ol.appendChild(li);

      if (!definition.examples) {
        continue;
      }

      const dl = document.createElement("dl");

      for (const [original, translation] of definition.examples) {
        const dt = document.createElement("dt");
        dt.innerText = original;

        dl.appendChild(dt);

        if (!translation) {
          continue;
        }

        const dd = document.createElement("dd");
        dd.innerText = translation;

        dl.appendChild(dd);
      }

      li.appendChild(dl);
    }

    marginContainer.appendChild(ol);
    inner.appendChild(marginContainer);
  }

  return box;
};

const getHoveredBox = (currentBox = box): Box | null => {
  if (!currentBox) {
    return null;
  }

  if (currentBox.child) {
    const childCheck = getHoveredBox(currentBox.child);

    if (childCheck !== null) {
      return childCheck;
    }
  }

  const rect = currentBox.element.getBoundingClientRect();

  if (
    mouseX >= rect.left &&
    mouseY >= rect.top &&
    mouseX <= rect.right &&
    mouseY <= rect.bottom
  ) {
    return currentBox;
  }

  return null;
};

const removeBoxChain = (root: Box) => {
  if (box === null) {
    return;
  }

  root = root ?? box;

  if (root.child) {
    removeBoxChain(root.child);
  }

  root.element.remove();
};

const getLastChild = (root = box): Box | null => {
  if (root?.child) {
    return getLastChild(root.child);
  }

  return root;
};

const spawnBox = (
  word: string,
  entries: VerboseDictionaryEntry[],
  rect: DOMRect
) => {
  if (box?.word === word) {
    return;
  }

  const x = rect.x + window.pageXOffset;
  const y = rect.y + rect.height + window.pageYOffset;

  const hoveredBox = getHoveredBox();

  if (hoveredBox === null && box !== null) {
    removeBoxChain(box);
    box = null;
  } else if (hoveredBox?.child) {
    removeBoxChain(hoveredBox.child);
    hoveredBox.child = null;
  }

  const boxElement = createDefinitionBoxElement(entries, x, y);

  document.body.appendChild(boxElement);

  if (x + boxElement.offsetWidth > window.innerWidth + window.pageXOffset) {
    boxElement.style.left = `${
      window.innerWidth - boxElement.offsetWidth + window.pageXOffset
    }px`;
  }

  if (y + boxElement.offsetHeight > window.innerHeight + window.pageYOffset) {
    boxElement.style.top = `${
      window.innerHeight - boxElement.offsetHeight + window.pageYOffset
    }px`;
  }

  if (box === null) {
    box = { word, element: boxElement, child: null };

    return;
  }

  const lastChild = getLastChild();

  if (lastChild !== null) {
    lastChild.child = {
      word,
      element: boxElement,
      child: null,
    };
  }
};

const getWordRange = (text: string, index: number) => {
  let left = index;
  let right = index;

  while (left > 0 && !delim.test(text[left - 1])) {
    left--;
  }

  while (right < text.length - 1 && !delim.test(text[right + 1])) {
    right++;
  }

  return [left, right];
};

const lookup = async (
  word: string
): Promise<[string, VerboseDictionaryEntry[]] | [null, null]> => {
  const dict = await dictPromise;
  let entries: (typeof dict)[string];

  do {
    const lowerCaseWord = word.toLowerCase();
    entries = dict[word] ?? [];

    if (word !== lowerCaseWord) {
      entries = [...entries, ...(dict[word.toLowerCase()] ?? [])];
    }

    if (entries.length === 0) {
      word = word.substring(0, word.length - 1);
    }
  } while (entries?.length === 0 && word.length > 0);

  if (entries.length === 0) {
    return [null, null];
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

  return [word, verboseEntries];
};

const selectRange = (node: Node, start: number, end: number) => {
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

const attemptQuery = async () => {
  const hoveredBox = getHoveredBox();

  if (hoveredBox !== shiftPressedOn) {
    return;
  }

  const x = mouseX;
  const y = mouseY;
  const range = document.caretRangeFromPoint(x, y);

  if (range === null) {
    return;
  }

  let elementWithText = range.startContainer;

  while (
    (elementWithText.textContent ?? "").trim() === "" &&
    elementWithText.parentNode
  ) {
    elementWithText = elementWithText.parentNode;
  }

  const text = elementWithText.textContent;

  if (!text || delim.test(text[range.startOffset])) {
    return;
  }

  const [left, right] = getWordRange(text, range.startOffset);
  let hoveredWord = text.substring(left, right + 1);

  if (hoveredBox?.word === hoveredWord) {
    return;
  }

  const [finalWord, entries] = await lookup(hoveredWord);

  if (!entries || entries.length === 0) {
    return;
  }

  range.setStart(elementWithText, left);
  const rect = range.getBoundingClientRect();

  if (
    mouseX < rect.x ||
    mouseY < rect.y ||
    mouseX > rect.x + rect.width ||
    mouseY > rect.y + rect.height
  ) {
    return;
  }

  selectRange(elementWithText, left, left + finalWord.length);
  spawnBox(finalWord, entries, rect);
};

window.addEventListener("blur", () => {
  isShiftPressed = false;
  shiftPressedOn = null;
});

document.addEventListener("keyup", (event) => {
  if (event.key === "Shift") {
    isShiftPressed = false;
    shiftPressedOn = null;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Shift") {
    if (!isShiftPressed) {
      shiftPressedOn = getHoveredBox();
    }
    isShiftPressed = true;

    attemptQuery();
  }
});

document.addEventListener("mousemove", (event) => {
  mouseX = event.x;
  mouseY = event.y;

  if (isShiftPressed) {
    attemptQuery();
  }
});

document.addEventListener("mousedown", (event) => {
  if (event.button !== 0) {
    return;
  }

  if (box === null) {
    return;
  }

  const hoveredBox = getHoveredBox();

  if (hoveredBox === null) {
    removeBoxChain(box);
    box = null;
  } else if (hoveredBox.child) {
    removeBoxChain(hoveredBox.child);
    hoveredBox.child = null;
  }
});
