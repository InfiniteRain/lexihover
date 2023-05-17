import { onCleanup, onMount } from "solid-js";

const onMouseDown = (onMouseDown: (event: MouseEvent) => void): void => {
  onMount(() => {
    document.addEventListener("mousedown", onMouseDown);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", onMouseDown);
  });
};

export { onMouseDown };
