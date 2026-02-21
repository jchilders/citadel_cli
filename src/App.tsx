import { useEffect, useMemo, useState } from "react";
import { Citadel } from "./index";
import { createBasicCommandRegistry } from "./examples/basicCommands.ts";
import { createDevOpsCommandRegistry } from "./examples/devopsCommands";
import { defaultConfig } from "./components/Citadel/config/defaults";
import { CommandRegistry, cloneCommandSegments } from "./components/Citadel/types/command-registry";
import { command, registerCommand, text } from "./components/Citadel/types/command-dsl";
import { useRuntimeConfigDemo } from "./examples/runtimeConfigDemo";
import "./styles/app.css";

type ExampleId = "basic" | "devops" | "runtime";

const EXAMPLE_STORAGE_KEY = "citadel-demo-example";
const EXAMPLE_LABELS: Record<ExampleId, string> = {
  basic: "Basic",
  devops: "DevOps",
  runtime: "Runtime Config",
};
const EXAMPLE_DESCRIPTIONS: Record<ExampleId, string> = {
  basic: "General command examples for user, errors, images, and local storage.",
  devops: "Deployment, monitoring, and infrastructure-oriented command examples.",
  runtime: "Commands that reconfigure Citadel behavior in real time.",
};

const VALID_EXAMPLE_IDS: ExampleId[] = ["basic", "devops", "runtime"];

const isExampleId = (value: string): value is ExampleId =>
  VALID_EXAMPLE_IDS.includes(value as ExampleId);

function withDemoSwitcher(
  baseRegistry: CommandRegistry,
  setSelectedExample: (example: ExampleId) => void
): CommandRegistry {
  const merged = new CommandRegistry();

  baseRegistry.commands.forEach((node) => {
    merged.addCommand(cloneCommandSegments(node.segments), node.description ?? "", node.handler);
  });

  registerCommand(
    merged,
    command("demo.example")
      .describe("Switch the active demo example")
      .arg("name", (arg) =>
        arg.describe("Example name: basic | devops | runtime")
      )
      .handle(async ({ namedArgs }) => {
        const nextValue = namedArgs.name?.trim().toLowerCase() ?? "";
        if (!isExampleId(nextValue)) {
          return text(
            `Unknown example "${namedArgs.name ?? ""}". Use one of: ${VALID_EXAMPLE_IDS.join(", ")}.`
          );
        }

        setSelectedExample(nextValue);
        return text(`Switched active example to "${EXAMPLE_LABELS[nextValue]}".`);
      })
  );

  registerCommand(
    merged,
    command("demo.examples")
      .describe("Show available demo examples")
      .handle(async () => text(`Available examples: ${VALID_EXAMPLE_IDS.join(", ")}`))
  );

  return merged;
}

const getInitialExample = (): ExampleId => {
  if (typeof window === "undefined") {
    return "basic";
  }

  const stored = window.localStorage.getItem(EXAMPLE_STORAGE_KEY);
  if (stored && isExampleId(stored)) {
    return stored;
  }

  return "basic";
};

function App() {
  const [selectedExample, setSelectedExample] = useState<ExampleId>(getInitialExample);
  const basicRegistry = useMemo(() => createBasicCommandRegistry(), []);
  const devopsRegistry = useMemo(() => createDevOpsCommandRegistry(), []);
  const runtimeDemo = useRuntimeConfigDemo();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EXAMPLE_STORAGE_KEY, selectedExample);
    }
  }, [selectedExample]);

  const activeBaseRegistry = useMemo(() => {
    if (selectedExample === "devops") {
      return devopsRegistry;
    }

    if (selectedExample === "runtime") {
      return runtimeDemo.commandRegistry;
    }

    return basicRegistry;
  }, [basicRegistry, devopsRegistry, runtimeDemo.commandRegistry, selectedExample]);

  const activeConfig = selectedExample === "runtime" ? runtimeDemo.config : defaultConfig;

  const commandRegistry = useMemo(
    () => withDemoSwitcher(activeBaseRegistry, setSelectedExample),
    [activeBaseRegistry]
  );

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-semibold text-gray-800 text-center mb-4">
          Citadel Demo
        </h1>
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            Example
          </div>
          <div className="flex flex-wrap gap-2">
            {VALID_EXAMPLE_IDS.map((exampleId) => {
              const isActive = selectedExample === exampleId;
              return (
                <button
                  key={exampleId}
                  type="button"
                  className={`px-3 py-1.5 rounded border text-sm transition ${
                    isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedExample(exampleId)}
                >
                  {EXAMPLE_LABELS[exampleId]}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {EXAMPLE_DESCRIPTIONS[selectedExample]}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-700">
          <p className="mb-4">
            Press <code className="px-2 border border-gray-300 rounded">.</code> to activate Citadel.
          </p>
          <p className="text-sm text-gray-500">Press Escape to hide.</p>
          <p className="text-sm text-gray-500 mt-1">
            You can also run <code className="px-2 border border-gray-300 rounded">demo.example &lt;name&gt;</code>.
          </p>
        </div>
        <Citadel
          key={selectedExample}
          commandRegistry={commandRegistry}
          config={activeConfig}
        />
      </div>
    </div>
  );
}

export default App;
