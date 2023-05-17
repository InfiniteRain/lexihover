import { Component, For, Show } from "solid-js";
import { ActiveDefinition } from "./Root";
import "./DefinitionBox.css";

type DefinitionBoxProps = {
  activeDefinition: ActiveDefinition;
};

const boxWidth = 350;
const boxHeight = 150;
const boxBorderWidth = 2;

const DefinitionBox: Component<DefinitionBoxProps> = ({ activeDefinition }) => {
  return (
    <div
      style={{
        left: `${activeDefinition.x}px`,
        top: `${activeDefinition.y}px`,
        width: `${boxWidth}px`,
        height: `${boxHeight}px`,
        "border-width": `${boxBorderWidth}px`,
      }}
      class="lexihover-definition-box"
    >
      <div class="lexihover-inner-box">
        <For each={activeDefinition.entries}>
          {(entry, index) => (
            <>
              <Show when={index() > 0}>
                <hr />
              </Show>
              <div class="lexihover-margin-container">
                <h1>{entry.title}</h1>
                <ol>
                  <For each={entry.definitions}>
                    {(definition) => (
                      <li>
                        {definition.text}
                        <Show when={definition.examples}>
                          <dl>
                            <For each={definition.examples}>
                              {([original, translation]) => (
                                <>
                                  <dt>{original}</dt>
                                  <Show when={translation}>
                                    <dd>{translation}</dd>
                                  </Show>
                                </>
                              )}
                            </For>
                          </dl>
                        </Show>
                      </li>
                    )}
                  </For>
                </ol>
              </div>
            </>
          )}
        </For>
      </div>
    </div>
  );
};

export { boxWidth, boxHeight, boxBorderWidth, DefinitionBox };
