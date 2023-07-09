import { Accessor, createSignal, onCleanup, onMount } from "solid-js";

const useShiftPressed = (): Accessor<boolean> => {
  const [isShiftPressed, setShiftPressed] = createSignal(false);

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Shift") {
      setShiftPressed(true);
    }
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === "Shift") {
      setShiftPressed(false);
    }
  };

  const onBlur = (): void => {
    setShiftPressed(false);
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
  });

  onCleanup(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
  });

  return isShiftPressed;
};

export { useShiftPressed };
