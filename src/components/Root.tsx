import {
  Component,
  createEffect,
  createSignal,
  For,
  on,
  untrack,
} from "solid-js";
import { lookup, selectTextInNode } from "../utils";
import {
  boxHeight,
  boxWidth,
  boxBorderWidth,
  DefinitionBox,
} from "./DefinitionBox";
import { useMousePosition } from "../hooks/useMousePosition";
import { useShiftPressed } from "../hooks/useShiftPressed";
import { useHoveredWord } from "../hooks/useHoveredWord";
import { onMouseDown } from "../hooks/onMouseDown";
import type { VerboseDictionaryEntry } from "../utils";

type ActiveDefinition = {
  readonly entries: VerboseDictionaryEntry[];
  readonly x: number;
  readonly y: number;
};

const Root: Component = () => {
  const [shiftPressedOn, setShiftPressedOn] = createSignal<number | null>(null);
  const [activeDefinitions, setActiveDefinitions] = createSignal<
    ActiveDefinition[]
  >([]);

  const isShiftPressed = useShiftPressed();
  const mousePosition = useMousePosition();
  const hoveredWord = useHoveredWord(mousePosition);

  const getHoveredDefinitionBoxIndex = (): number | null => {
    const definitions = untrack(activeDefinitions);
    const { x: mx, y: my } = untrack(mousePosition);

    const x = mx + scrollX;
    const y = my + scrollY;

    for (let i = definitions.length - 1; i >= 0; i--) {
      const definition = definitions[i];

      if (
        x >= definition.x &&
        y >= definition.y &&
        x <= definition.x + boxWidth &&
        y <= definition.y + boxHeight
      ) {
        return i;
      }
    }

    return null;
  };

  const popActiveDefinitionsAfterIndex = (index: number | null): void => {
    setActiveDefinitions(
      index === null ? [] : (prev) => prev.slice(0, index + 1)
    );
  };

  const attemptQuery = (): void => {
    if (!isShiftPressed()) {
      return;
    }

    const hoveredBoxIndex = getHoveredDefinitionBoxIndex();

    if (hoveredBoxIndex !== shiftPressedOn()) {
      return;
    }

    const activeHoveredWord = hoveredWord();

    if (!activeHoveredWord) {
      return;
    }

    const { word, wordPosition, node } = activeHoveredWord;
    const entries = lookup(activeHoveredWord.word);

    if (!entries) {
      return;
    }

    if (activeDefinitions().length > 0) {
      popActiveDefinitionsAfterIndex(getHoveredDefinitionBoxIndex());
    }

    const rect = activeHoveredWord.rect;

    const mx = rect.x;
    const my = rect.y + rect.height + boxBorderWidth;
    const bw = boxWidth + boxBorderWidth * 2;
    const bh = boxHeight + boxBorderWidth * 2;

    const x =
      mx + bw + window.scrollX > window.innerWidth + window.scrollX
        ? window.innerWidth - bw + window.scrollX
        : mx + window.scrollX;
    const y =
      my + bh + window.scrollY > window.innerHeight + window.scrollY
        ? window.innerHeight - bh + window.scrollY
        : my + window.scrollY;

    const definition: ActiveDefinition = {
      entries,
      x,
      y,
    };

    setActiveDefinitions((prev) => [...prev, definition]);
    selectTextInNode(node, wordPosition, wordPosition + word.length);
  };

  onMouseDown((event: MouseEvent): void => {
    if (event.button !== 0) {
      return;
    }

    if (activeDefinitions().length === 0) {
      return;
    }

    popActiveDefinitionsAfterIndex(getHoveredDefinitionBoxIndex());
  });

  createEffect(() => {
    if (isShiftPressed()) {
      setShiftPressedOn(getHoveredDefinitionBoxIndex());
      return;
    }

    setShiftPressedOn(null);
  });

  createEffect(
    on([mousePosition, isShiftPressed], () => {
      if (isShiftPressed()) {
        attemptQuery();
      }
    })
  );

  return (
    <For each={activeDefinitions()}>
      {(definition) => <DefinitionBox activeDefinition={definition} />}
    </For>
  );
};

export { Root };
export type { ActiveDefinition };
