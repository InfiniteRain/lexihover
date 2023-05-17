import { Accessor, createEffect, createSignal } from "solid-js";
import { expandToWord } from "../utils";
import { MousePosition } from "./useMousePosition";

type HoveredWord = {
  readonly word: string;
  readonly rect: DOMRect;
  readonly node: Node;
  readonly wordPosition: number;
};

const useHoveredWord = (
  mousePositionAccessor: Accessor<MousePosition>
): Accessor<HoveredWord | null> => {
  const [hoveredWord, setHoveredWord] = createSignal<HoveredWord | null>(null);

  createEffect(() => {
    const { x, y } = mousePositionAccessor();

    const range = document.caretRangeFromPoint(x, y);

    if (range === null) {
      setHoveredWord(null);
      return;
    }

    const node = range.startContainer;
    const text = node.textContent;

    setHoveredWord(null);

    if (!text) {
      return;
    }

    const [word, left] = expandToWord(text, range.startOffset);

    if (!word) {
      return;
    }

    range.setStart(node, left);

    try {
      range.setEnd(node, left + word.length);
    } catch {
      // weird element, do nothing
      return;
    }

    const rect = range.getBoundingClientRect();

    if (
      x < rect.x ||
      y < rect.y ||
      x > rect.x + rect.width ||
      y > rect.y + rect.height
    ) {
      return;
    }

    setHoveredWord({
      word,
      rect,
      node,
      wordPosition: left,
    });
  });

  return hoveredWord;
};

export { useHoveredWord };
