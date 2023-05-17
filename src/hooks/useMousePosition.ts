import { Accessor, createSignal, onCleanup, onMount } from "solid-js";

type MousePosition = {
  readonly x: number;
  readonly y: number;
};

const useMousePosition = (): Accessor<MousePosition> => {
  const [mousePosition, setMousePosition] = createSignal<MousePosition>({
    x: 0,
    y: 0,
  });

  const onMouseMove = (event: MouseEvent): void => {
    const { x, y } = event;
    setMousePosition({ x, y });
  };

  onMount(() => {
    document.addEventListener("mousemove", onMouseMove);
  });

  onCleanup(() => {
    document.removeEventListener("mousemove", onMouseMove);
  });

  return mousePosition;
};

export type { MousePosition };
export { useMousePosition };
