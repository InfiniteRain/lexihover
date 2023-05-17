import { render } from "solid-js/web";
import { Root } from "./components/Root";

const rootId = "lexihover-root-div";
const existingRoot = document.getElementById(rootId);

if (existingRoot) {
  existingRoot.remove();
}

const root = document.createElement("div");
root.id = rootId;
document.body.append(root);

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?"
  );
}

render(() => <Root />, root!);
