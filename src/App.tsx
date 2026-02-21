import { useEffect, useMemo, useState } from "react";
import { Citadel } from "./index";
import { createBasicCommandRegistry } from "./examples/basicCommands.ts";
import { createDevOpsCommandRegistry } from "./examples/devopsCommands";
import { defaultConfig } from "./components/Citadel/config/defaults";
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
  basic: "A broad starter setup with user operations, error handling, media output, and local storage utilities.",
  devops: "An operations-flavored setup focused on deploy, logs, metrics, and infrastructure actions.",
  runtime: "A live configuration setup that changes Citadel behavior while you use it.",
};
const EXAMPLE_HINTS: Record<ExampleId, string> = {
  basic: "Great first stop to understand command structure and result types.",
  devops: "Shows how Citadel can power fast operational workflows in internal tools.",
  runtime: "Shows Citadel acting as a control surface, not just a command runner.",
};
const EXAMPLE_TRY_COMMAND: Record<ExampleId, string> = {
  basic: "user.show 1234",
  devops: "monitor.metrics",
  runtime: "cursor.type.spin",
};
const EXAMPLE_TRY_KEYS: Record<ExampleId, string> = {
  basic: "u s 1234",
  devops: "m m",
  runtime: "cu t sp",
};

const VALID_EXAMPLE_IDS: ExampleId[] = ["basic", "devops", "runtime"];

const isExampleId = (value: string): value is ExampleId =>
  VALID_EXAMPLE_IDS.includes(value as ExampleId);

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

  const commandRegistry = activeBaseRegistry;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-6 md:p-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-200">
        <div className="mb-6">
          <p className="text-xs font-medium tracking-wider uppercase text-sky-700 mb-2">
            Citadel Demo Workspace
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 leading-tight">
            Explore example configurations and see what Citadel can do.
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-600 max-w-3xl">
            This page is a hands-on preview of Citadel in action. Each tab loads a different example configuration so
            you can compare workflows, command sets, and interaction patterns.
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Example Configurations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {VALID_EXAMPLE_IDS.map((exampleId) => {
              const isActive = selectedExample === exampleId;
              return (
                <button
                  key={exampleId}
                  type="button"
                  className={`text-left px-4 py-3 rounded-lg border text-sm transition ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                  onClick={() => setSelectedExample(exampleId)}
                >
                  <div className="font-medium">{EXAMPLE_LABELS[exampleId]}</div>
                  <div className={`mt-1 text-xs ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                    Example setup
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-1">
            Active Example: {EXAMPLE_LABELS[selectedExample]}
          </p>
          <p className="text-sm text-slate-700">{EXAMPLE_DESCRIPTIONS[selectedExample]}</p>
          <p className="text-xs text-slate-500 mt-2">{EXAMPLE_HINTS[selectedExample]}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700">
          <p className="font-medium mb-2">
            Try it now
          </p>
          <p className="text-sm">
            Press <code className="px-2 border border-slate-300 rounded bg-white">.</code> to open Citadel, then run
            commands from the selected example.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Quick try: press initials{" "}
            <code className="px-2 border border-slate-300 rounded bg-white">{EXAMPLE_TRY_KEYS[selectedExample]}</code>{" "}
            and Citadel will expand to{" "}
            <code className="px-2 border border-slate-300 rounded bg-white">{EXAMPLE_TRY_COMMAND[selectedExample]}</code>.
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
